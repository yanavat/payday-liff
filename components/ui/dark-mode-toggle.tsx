"use client";

import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";

export function DarkModeToggle() {
  const [isDark, toggle] = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
      aria-label="เปิด/ปิดโหมดสีเข้ม"
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="h-5 w-5" strokeWidth={1.8} aria-hidden />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}
