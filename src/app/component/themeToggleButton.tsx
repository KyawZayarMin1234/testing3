"use client";
import { useTheme } from "next-themes";
import { Moon, SunDim } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm
                  hover:bg-accent transition-colors"
      aria-pressed={isDark}
    >
      {isDark ? <SunDim className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="truncate">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
