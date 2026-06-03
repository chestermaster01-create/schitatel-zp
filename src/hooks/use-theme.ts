import { useEffect, useState } from "react";

const THEME_KEY = "salary-app-theme";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return { isDark, toggle };
}
