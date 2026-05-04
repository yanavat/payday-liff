"use client";

import type { ReactNode } from "react";
import { HRSidebar } from "./hr-sidebar";
import { HRTopbar } from "./hr-topbar";
import { DarkModeProvider, useDarkMode } from "@/lib/context/dark-mode-context";
import { cn } from "@/lib/utils";

function HRLayoutContent({ children }: { children: ReactNode }) {
  const { isDark } = useDarkMode();

  return (
    <div className={cn("flex min-h-screen bg-bg-page text-text-primary", isDark && "dark")}>
      <HRSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <HRTopbar />
        <main className="min-h-0 flex-1 overflow-auto px-5 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export function HRLayoutShell({ children }: { children: ReactNode }) {
  return (
    <DarkModeProvider>
      <HRLayoutContent>{children}</HRLayoutContent>
    </DarkModeProvider>
  );
}
