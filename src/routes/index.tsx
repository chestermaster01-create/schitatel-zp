import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Расчёт зарплат" },
      { name: "description", content: "Расчёт зарплат сотрудников на основе выручки за месяц." },
    ],
  }),
  component: Index,
});

const RATE = 1700;
const STORAGE_KEY = "salary-app-v1";

type Employee = {
  id: string;
  name: string;
  // revenue[YYYY-MM][day] = number
  revenue: Record<string, Record<number, number>>;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const daysInMonth = (year: number, month0: number) => new Date(year, month0 + 1, 0).getDate();
const RU_MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

function Index() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEmployees(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees, loaded]);

  const mKey = monthKey(new Date(year, month, 1));
  const dim = daysInMonth(year, month);

  const addEmployee = () => {
    const n = name.trim();
    if (!n) return;
    const e: Employee = { id: crypto.randomUUID(), name: n, revenue: {} };
    setEmployees((p) => [...p, e]);
    setName("");
    setSelectedId(e.id);
  };

  const removeEmployee = (id: string) => {
    setEmployees((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const setDayRevenue = (id: string, day: number, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setEmployees((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        const month = { ...(e.revenue[mKey] ?? {}) };
        if (!value || isNaN(num) || num <= 0) {
          delete month[day];
        } else {
          month[day] = num;
        }
        return { ...e, revenue: { ...e.revenue, [mKey]: month } };
      }),
    );
  };

  const stats = (e: Employee) => {
    const m = e.revenue[mKey] ?? {};
    const days = Object.values(m).filter((v) => v > 0).length;
    const revenue = Object.values(m).reduce((a, b) => a + (b || 0), 0);
    return { days, revenue, salary: days * RATE };
  };

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
      return acc;
    },
    { days: 0, revenue: 0, salary: 0 },
  );

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Расчёт зарплат</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ставка: {fmt(RATE)} ₽ × количество рабочих дней (дни с выручкой)
            </p>
          </div>
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
                  return (
                    <li key={e.id}>
                      <button
                        onClick={() => setSelectedId(e.id)}
                        className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                          active
                            ? "border-primary bg-accent"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{e.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.days} дн. · выручка {fmt(s.revenue)} ₽
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold">{fmt(s.salary)} ₽</div>
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                removeEmployee(e.id);
                              }}
                              className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 mt-1"
                            >
                              <Trash2 className="h-3 w-3" /> удалить
                            </button>
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
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border"><dt>ФОТ</dt><dd>{fmt(totals.salary)} ₽</dd></div>
            </dl>
          </Card>
        </section>

        <section>
          {!selected ? (
            <Card className="p-10 text-center text-muted-foreground">
              Выберите сотрудника, чтобы внести выручку по дням
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {RU_MONTHS[month]} {year}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Дней</div>
                    <div className="text-lg font-semibold">{stats(selected).days}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Выручка</div>
                    <div className="text-lg font-semibold">{fmt(stats(selected).revenue)} ₽</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Зарплата</div>
                    <div className="text-lg font-semibold text-primary">{fmt(stats(selected).salary)} ₽</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                  const val = selected.revenue[mKey]?.[day] ?? "";
                  const date = new Date(year, month, day);
                  const dow = date.toLocaleDateString("ru-RU", { weekday: "short" });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <label
                      key={day}
                      className={`rounded-md border px-3 py-2 ${
                        val ? "border-primary/60 bg-accent" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{day}</span>
                        <span className={`text-[10px] uppercase ${isWeekend ? "text-destructive" : "text-muted-foreground"}`}>{dow}</span>
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                        value={val}
                        onChange={(e) => setDayRevenue(selected.id, day, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
