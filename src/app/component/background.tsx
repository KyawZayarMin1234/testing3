"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Background() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <div
      className={[
        "absolute top-0 z-[-2] h-screen w-screen",
        isDark
          ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"
          : "bg-[#f8f8ff] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,200,150,0.4),rgba(255,255,255,0))]",
      ].join(" ")}
    />
  );
}
