import { useEffect, useState } from "react";

export const RATE = 1700;
export const BONUS_THRESHOLD = 3_000_000;
export const BONUS_RATE = 0.001;
export const STORAGE_KEY = "salary-app-v1";

export const COLOR_PRESETS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#8b5cf6", // violet
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
];

export type Employee = {
  id: string;
  name: string;
  color?: string;
  pointId?: string;
  revenue: Record<string, Record<number, number>>;
};

export const RU_MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
export const RU_WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const daysInMonth = (year: number, month0: number) =>
  new Date(year, month0 + 1, 0).getDate();

export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");
export const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return String(n);
};

export function statsFor(e: Employee, mKey: string) {
  const m = e.revenue[mKey] ?? {};
  const days = Object.values(m).filter((v) => v > 0).length;
  const revenue = Object.values(m).reduce((a, b) => a + (b || 0), 0);
  const base = days * RATE;
  const hasBonus = revenue > BONUS_THRESHOLD;
  const bonus = hasBonus ? revenue * BONUS_RATE : 0;
  return { days, revenue, base, bonus, hasBonus, salary: base + bonus };
}

const STORAGE_EVENT = "salary-app:update";
export const POINTS_KEY = "salary-app-points-v1";
export const CURRENT_POINT_KEY = "salary-app-current-point";

export type Point = { id: string; name: string };

type State = { all: Employee[]; points: Point[]; current: string };

function readState(): State {
  let all: Employee[] = [];
  let points: Point[] = [];
  try { all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { /* */ }
  try { points = JSON.parse(localStorage.getItem(POINTS_KEY) || "[]"); } catch { /* */ }
  let changed = false;
  if (points.length === 0) {
    points = [{ id: crypto.randomUUID(), name: "Пункт 1" }];
    changed = true;
  }
  all.forEach((e, i) => {
    if (!e.color) e.color = COLOR_PRESETS[i % COLOR_PRESETS.length];
    if (!e.pointId || !points.some((p) => p.id === e.pointId)) {
      e.pointId = points[0].id; changed = true;
    }
  });
  let current = localStorage.getItem(CURRENT_POINT_KEY) || "";
  if (!points.some((p) => p.id === current)) { current = points[0].id; changed = true; }
  if (changed) writeState({ all, points, current }, false);
  return { all, points, current };
}

function writeState(s: State, notify = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s.all));
  localStorage.setItem(POINTS_KEY, JSON.stringify(s.points));
  localStorage.setItem(CURRENT_POINT_KEY, s.current);
  if (notify) window.dispatchEvent(new Event(STORAGE_EVENT));
}

function useStore() {
  const [state, setState] = useState<State>({ all: [], points: [], current: "" });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => { setState(readState()); setLoaded(true); };
    load();
    window.addEventListener(STORAGE_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(STORAGE_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);
  const mutate = (fn: (s: State) => State) => {
    const next = fn(readState());
    writeState(next);
    setState(next);
  };
  return { state, loaded, mutate };
}

export function useEmployees() {
  const { state, loaded, mutate } = useStore();
  const employees = state.all.filter((e) => e.pointId === state.current);
  const update = (updater: (prev: Employee[]) => Employee[]) =>
    mutate((s) => {
      const mine = s.all.filter((e) => e.pointId === s.current);
      const others = s.all.filter((e) => e.pointId !== s.current);
      const next = updater(mine).map((e) => ({ ...e, pointId: s.current }));
      return { ...s, all: [...others, ...next] };
    });
  return { employees, loaded, update, persist: (n: Employee[]) => update(() => n) };
}

export function usePoints() {
  const { state, mutate } = useStore();
  return {
    points: state.points,
    current: state.current,
    counts: Object.fromEntries(
      state.points.map((p) => [p.id, state.all.filter((e) => e.pointId === p.id).length]),
    ) as Record<string, number>,
    select: (id: string) => mutate((s) => ({ ...s, current: id })),
    add: (name: string) =>
      mutate((s) => {
        const p = { id: crypto.randomUUID(), name };
        return { ...s, points: [...s.points, p], current: p.id };
      }),
    rename: (id: string, name: string) =>
      mutate((s) => ({ ...s, points: s.points.map((p) => (p.id === id ? { ...p, name } : p)) })),
    remove: (id: string) =>
      mutate((s) => {
        const points = s.points.filter((p) => p.id !== id);
        if (points.length === 0) return s;
        return {
          all: s.all.filter((e) => e.pointId !== id),
          points,
          current: s.current === id ? points[0].id : s.current,
        };
      }),
  };
}

/** Convert hex to rgb tuple. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Pick black or white foreground for given bg hex. */
export function readableFg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0a0a0a" : "#ffffff";
}

/** Inline style overriding --primary tokens so themed components adopt color. */
export function colorThemeStyle(color?: string): React.CSSProperties {
  if (!color) return {};
  return {
    ["--primary" as string]: color,
    ["--primary-foreground" as string]: readableFg(color),
    ["--ring" as string]: color,
  } as React.CSSProperties;
}
