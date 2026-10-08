import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  RU_MONTHS, RU_WEEKDAYS, monthKey, daysInMonth,
  fmt, fmtShort, statsFor, useEmployees,
} from "@/lib/salary";
import { NavBar } from "@/components/nav-bar";
import { PointSwitcher } from "@/components/point-switcher";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Общий календарь · Расчёт зарплат" },
      { name: "description", content: "Общий календарь выручки всех сотрудников по дням." },
    ],
  }),
  component: CombinedCalendar,
});

function CombinedCalendar() {
  const { employees } = useEmployees();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [openDay, setOpenDay] = useState<number | null>(null);

  const mKey = monthKey(new Date(year, month, 1));
  const dim = daysInMonth(year, month);

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

  type DayEntry = { employee: (typeof employees)[number]; revenue: number };
  const dayEntries = (day: number): DayEntry[] =>
    employees
      .map((e) => ({ employee: e, revenue: e.revenue[mKey]?.[day] ?? 0 }))
      .filter((x) => x.revenue > 0);

  const monthTotals = useMemo(() => {
    let revenue = 0, salary = 0, base = 0;
    employees.forEach((e) => {
      const s = statsFor(e, mKey);
      revenue += s.revenue; salary += s.salary; base += s.base;
    });
    return { revenue, salary, base };
  }, [employees, mKey]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Общий календарь</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Выручка всех сотрудников по дням месяца
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

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">{RU_MONTHS[month]} {year}</div>
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
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
              if (day == null) return <div key={`e-${idx}`} className="min-h-[84px]" />;
              const entries = dayEntries(day);
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
                  onClick={() => entries.length && setOpenDay(day)}
                  className={`min-h-[84px] rounded-md border p-1.5 flex flex-col items-stretch text-left transition-colors hover:border-foreground/30 ${
                    isWeekend ? "bg-muted/30" : "bg-card"
                  } ${isToday ? "ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isWeekend ? "text-destructive/80" : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {entries.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{entries.length}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entries.slice(0, 6).map(({ employee, revenue }) => (
                      <span
                        key={employee.id}
                        title={`${employee.name}: ${fmt(revenue)} ₽`}
                        className="inline-flex items-center gap-1 rounded px-1 py-px text-[10px] font-medium"
                        style={{
                          backgroundColor: (employee.color || "#888") + "22",
                          color: employee.color,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: employee.color }}
                        />
                        {fmtShort(revenue)}
                      </span>
                    ))}
                    {entries.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{entries.length - 6}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-medium mb-3">Сводка за {RU_MONTHS[month]} {year}</h2>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет сотрудников</p>
          ) : (
            <ul className="space-y-2">
              {employees.map((e) => {
                const s = statsFor(e, mKey);
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                    style={{ borderColor: (e.color || "#888") + "55" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="font-medium truncate">{e.name}</span>
                      <span className="text-xs text-muted-foreground">· {s.days} дн.</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">Выручка</div>
                        <div>{fmt(s.revenue)} ₽</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">ЗП без надбавки</div>
                        <div>{fmt(s.base)} ₽</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">ЗП итог</div>
                        <div className="font-semibold" style={{ color: e.color }}>{fmt(s.salary)} ₽</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs">Общая выручка</div><div className="font-semibold">{fmt(monthTotals.revenue)} ₽</div></div>
            <div><div className="text-muted-foreground text-xs">ЗП без надбавки</div><div className="font-semibold">{fmt(monthTotals.base)} ₽</div></div>
            <div><div className="text-muted-foreground text-xs">ФОТ с надбавкой</div><div className="font-semibold">{fmt(monthTotals.salary)} ₽</div></div>
          </div>
        </Card>
      </main>

      <Dialog open={openDay != null} onOpenChange={(o) => !o && setOpenDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openDay != null && <>{openDay} {RU_MONTHS[month].toLowerCase()} {year}</>}
            </DialogTitle>
          </DialogHeader>
          {openDay != null && (() => {
            const entries = dayEntries(openDay);
            const total = entries.reduce((a, b) => a + b.revenue, 0);
            return (
              <div className="space-y-2">
                {entries.map(({ employee, revenue }) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                    style={{ borderColor: (employee.color || "#888") + "55" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: employee.color }} />
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div className="font-semibold" style={{ color: employee.color }}>
                      {fmt(revenue)} ₽
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                  <span className="text-muted-foreground">Итого за день</span>
                  <span className="font-semibold">{fmt(total)} ₽</span>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
