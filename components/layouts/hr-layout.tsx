"use client";

import type { ReactNode } from "react";
import { HRSidebar } from "./hr-sidebar";
import { HRTopbar } from "./hr-topbar";
import { DarkModeProvider, useDarkMode } from "@/lib/context/dark-mode-context";
import { OfflineBanner } from "@/components/employee/offline-banner";
import { cn } from "@/lib/utils";
import { useHRRole } from "@/components/hr/hr-auth-gate";

function HRLayoutContent({ children }: { children: ReactNode }) {
  const { isDark } = useDarkMode();
  const { role } = useHRRole();

  return (
    <div className={cn("flex min-h-screen bg-bg-page text-text-primary", isDark && "dark")}>
      <HRSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <HRTopbar />
        {role === "viewer" && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm font-medium text-amber-900">
            View Only
          </div>
        )}
        <OfflineBanner />
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
