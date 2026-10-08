import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2, Plus, Calendar, ChevronLeft, ChevronRight, Sparkles, Pencil, Palette,
} from "lucide-react";
import {
  RATE, BONUS_THRESHOLD, COLOR_PRESETS, RU_MONTHS, RU_WEEKDAYS,
  monthKey, daysInMonth, fmt, fmtShort, statsFor, useEmployees,
  colorThemeStyle, readableFg, type Employee,
} from "@/lib/salary";
import { NavBar } from "@/components/nav-bar";
import { PointSwitcher } from "@/components/point-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Расчёт зарплат" },
      { name: "description", content: "Расчёт зарплат сотрудников на основе выручки за месяц." },
    ],
  }),
  component: Index,
});

function Index() {
  const { employees, update } = useEmployees();
  const [name, setName] = useState("");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(COLOR_PRESETS[0]);

  const mKey = monthKey(new Date(year, month, 1));
  const dim = daysInMonth(year, month);

  const addEmployee = () => {
    const n = name.trim();
    if (!n) return;
    const color = COLOR_PRESETS[employees.length % COLOR_PRESETS.length];
    const e: Employee = { id: crypto.randomUUID(), name: n, color, revenue: {} };
    update((p) => [...p, e]);
    setName("");
    setSelectedId(e.id);
  };

  const removeEmployee = (id: string) => {
    update((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const setDayRevenue = (id: string, day: number, value: string) => {
    const num = value === "" ? NaN : Number(value);
    update((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        const m = { ...(e.revenue[mKey] ?? {}) };
        if (!value || isNaN(num) || num <= 0) delete m[day];
        else m[day] = num;
        return { ...e, revenue: { ...e.revenue, [mKey]: m } };
      }),
    );
  };

  const stats = (e: Employee) => statsFor(e, mKey);

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );

  const totals = employees.reduce(
    (acc, e) => {
      const s = stats(e);
      acc.days += s.days;
      acc.revenue += s.revenue;
      acc.salary += s.salary;
      acc.base += s.base;
      return acc;
    },
    { days: 0, revenue: 0, salary: 0, base: 0 },
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const openDay = (day: number) => {
    if (!selected) return;
    setEditingDay(day);
    setEditValue(String(selected.revenue[mKey]?.[day] ?? ""));
  };

  const saveDay = () => {
    if (selected && editingDay != null) setDayRevenue(selected.id, editingDay, editValue);
    setEditingDay(null);
  };

  const openEdit = (e: Employee) => {
    setEditingEmployee(e);
    setEditName(e.name);
    setEditColor(e.color || COLOR_PRESETS[0]);
  };

  const saveEdit = () => {
    if (!editingEmployee) return;
    const name = editName.trim();
    if (!name) return;
    update((p) =>
      p.map((e) =>
        e.id === editingEmployee.id ? { ...e, name, color: editColor } : e,
      ),
    );
    setEditingEmployee(null);
  };

  const themeStyle = selected ? colorThemeStyle(selected.color) : {};

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Расчёт зарплат</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Базовая ставка: {fmt(RATE)} ₽ × рабочих дней · надбавка 0.1% от выручки при выручке свыше {fmt(BONUS_THRESHOLD)} ₽
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PointSwitcher />
            <NavBar />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {RU_MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || year)}
                className="w-24 h-9"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 grid gap-6 md:grid-cols-[360px_1fr]">
        <section className="space-y-4">
          <Card className="p-4">
            <h2 className="font-medium mb-3">Добавить сотрудника</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Имя сотрудника"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmployee()}
              />
              <Button onClick={addEmployee} size="icon" aria-label="Добавить">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Сотрудники</h2>
              <span className="text-xs text-muted-foreground">{employees.length}</span>
            </div>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Пока никого нет</p>
            ) : (
              <ul className="space-y-2">
                {employees.map((e) => {
                  const s = stats(e);
                  const active = e.id === selectedId;
                  const color = e.color || "#6366f1";
                  return (
                    <li key={e.id}>
                      <button
                        onClick={() => setSelectedId(e.id)}
                        style={{
                          borderColor: active ? color : undefined,
                          backgroundColor: active ? color + "15" : undefined,
                        }}
                        className="w-full text-left rounded-md border px-3 py-2 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-1.5">
                                {e.name}
                                {s.hasBonus && <Sparkles className="h-3.5 w-3.5" style={{ color }} />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {s.days} дн. · {fmt(s.revenue)} ₽
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold" style={{ color }}>
                              {fmt(s.salary)} ₽
                            </div>
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <button
                                onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                aria-label="Редактировать"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(e); }}
                                className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                                aria-label="Удалить"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-medium mb-3">Итог за {RU_MONTHS[month]} {year}</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Рабочих дней (сумма)</dt><dd>{totals.days}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Общая выручка</dt><dd>{fmt(totals.revenue)} ₽</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">ЗП без надбавки (сумма)</dt><dd>{fmt(totals.base)} ₽</dd></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border"><dt>ФОТ (с надбавкой)</dt><dd>{fmt(totals.salary)} ₽</dd></div>
            </dl>
          </Card>
        </section>

        <section>
          {!selected ? (
            <Card className="p-10 text-center text-muted-foreground">
              Выберите сотрудника, чтобы внести выручку по дням
            </Card>
          ) : (
            <Card className="p-6" style={{ borderColor: selected.color }}>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full shrink-0"
                    style={{ backgroundColor: selected.color }}
                    aria-hidden
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {RU_MONTHS[month]} {year}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Дней</div>
                    <div className="text-lg font-semibold">{stats(selected).days}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Выручка</div>
                    <div className="text-lg font-semibold">{fmt(stats(selected).revenue)} ₽</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ЗП без надбавки</div>
                    <div className="text-lg font-semibold">{fmt(stats(selected).base)} ₽</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      {stats(selected).hasBonus ? (
                        <>С надбавкой <Sparkles className="h-3 w-3" /></>
                      ) : (
                        "Зарплата"
                      )}
                    </div>
                    <div className="text-lg font-semibold" style={{ color: selected.color }}>
                      {fmt(stats(selected).salary)} ₽
                    </div>
                    {stats(selected).hasBonus && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        +{fmt(stats(selected).bonus)} надбавка
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium text-sm">{RU_MONTHS[month]} {year}</div>
                <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {RU_WEEKDAYS.map((w, i) => (
                  <div
                    key={w}
                    className={`text-center text-[11px] uppercase font-medium py-1 ${
                      i >= 5 ? "text-destructive/70" : "text-muted-foreground"
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day == null) return <div key={`e-${idx}`} className="aspect-square" />;
                  const val = selected.revenue[mKey]?.[day];
                  const date = new Date(year, month, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const today = new Date();
                  const isToday =
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();
                  return (
                    <button
                      key={day}
                      onClick={() => openDay(day)}
                      style={
                        val
                          ? {
                              borderColor: selected.color,
                              backgroundColor: (selected.color || "") + "1f",
                            }
                          : undefined
                      }
                      className={`aspect-square rounded-md border p-1.5 flex flex-col items-stretch justify-between text-left transition-colors hover:border-primary/60 ${
                        !val && isWeekend ? "bg-muted/30" : ""
                      } ${isToday ? "ring-1 ring-primary" : ""}`}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          isWeekend && !val ? "text-destructive/80" : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      {val ? (
                        <span className="text-[11px] font-semibold truncate" style={{ color: selected.color }}>
                          {fmtShort(val)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50">—</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Нажмите на день, чтобы внести выручку. Дни с выручкой считаются рабочими.
              </p>
            </Card>
          )}
        </section>
      </main>

      {/* Day revenue dialog */}
      <Dialog open={editingDay != null} onOpenChange={(o) => !o && setEditingDay(null)}>
        <DialogContent className="sm:max-w-sm" style={themeStyle}>
          <DialogHeader>
            <DialogTitle>
              {editingDay != null && (
                <>Выручка · {editingDay} {RU_MONTHS[month].toLowerCase()} {year}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Сумма в ₽"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveDay(); }}
            />
            <p className="text-xs text-muted-foreground">
              Оставьте пустым или 0, чтобы отметить день как нерабочий.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {selected?.revenue[mKey]?.[editingDay ?? -1] != null && (
              <Button variant="ghost" onClick={() => setEditValue("")}>Очистить</Button>
            )}
            <Button variant="outline" onClick={() => setEditingDay(null)}>Отмена</Button>
            <Button onClick={saveDay}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit employee dialog */}
      <Dialog open={editingEmployee != null} onOpenChange={(o) => !o && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-md" style={colorThemeStyle(editColor)}>
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Имя</label>
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="h-4 w-4" /> Цветовая гамма
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => {
                  const active = c.toLowerCase() === editColor.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        active ? "ring-2 ring-offset-2 ring-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c, color: readableFg(c) }}
                      aria-label={c}
                    />
                  );
                })}
                <label
                  className="h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ backgroundColor: editColor }}
                  title="Свой цвет"
                >
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>Отмена</Button>
            <Button onClick={saveEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete != null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && (
                <>«{confirmDelete.name}» будет удалён вместе со всеми данными о выручке. Действие нельзя отменить.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) removeEmployee(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
