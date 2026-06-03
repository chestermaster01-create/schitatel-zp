import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar as CalIcon, Users, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isDark, toggle } = useTheme();
  const items = [
    { to: "/", label: "Сотрудники", icon: Users },
    { to: "/calendar", label: "Общий календарь", icon: CalIcon },
  ];
  return (
    <nav className="flex gap-1 rounded-md border border-border bg-card p-1 items-center">
      {items.map((it) => {
        const active = path === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
              active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
        className="h-8 w-8 ml-1"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </nav>
  );
}
