import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar as CalIcon, Users } from "lucide-react";

export function NavBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: "Сотрудники", icon: Users },
    { to: "/calendar", label: "Общий календарь", icon: CalIcon },
  ];
  return (
    <nav className="flex gap-1 rounded-md border border-border bg-card p-1">
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
    </nav>
  );
}
