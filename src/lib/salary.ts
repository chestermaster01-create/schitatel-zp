import { useEffect, useState } from "react";

export const RATE = 1700;
export const BONUS_THRESHOLD = 3_000_000;
export const BONUS_RATE = 0.01;
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

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: Employee[] = raw ? JSON.parse(raw) : [];
        // assign default colors for old data
        parsed.forEach((e, i) => {
          if (!e.color) e.color = COLOR_PRESETS[i % COLOR_PRESETS.length];
        });
        setEmployees(parsed);
      } catch {
        setEmployees([]);
      }
      setLoaded(true);
    };
    load();
    const handler = () => load();
    window.addEventListener(STORAGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const persist = (next: Employee[]) => {
    setEmployees(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  const update = (updater: (prev: Employee[]) => Employee[]) => {
    setEmployees((prev) => {
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(STORAGE_EVENT));
      return next;
    });
  };

  return { employees, loaded, persist, update };
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
