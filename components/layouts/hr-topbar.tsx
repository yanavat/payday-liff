"use client";

import { usePathname } from "next/navigation";
import { Bell, HelpCircle, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { hrUser } from "@/lib/mock";

const SEGMENT_LABELS: Record<string, string> = {
  hr: "แดชบอร์ด",
  dashboard: "แดชบอร์ด",
  requests: "คำขอ EWA",
  reports: "รายงาน",
  settings: "ตั้งค่า",
  employees: "พนักงาน",
  request: "ยื่นคำขอแทน",
};

function HRBreadcrumb() {
  const pathname = usePathname();
  // Strip locale prefix: /th/hr/requests → ["hr", "requests"]
  const segments = pathname.split("/").filter(Boolean).slice(1);

  const crumbs = segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    href: "/" + pathname.split("/").filter(Boolean).slice(0, i + 2).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <BreadcrumbItem key={crumb.href}>
            {crumb.isLast ? (
              <BreadcrumbPage className="font-semibold text-text-primary">
                {crumb.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink
                  href={crumb.href}
                  className="text-text-muted hover:text-text-primary"
                >
                  {crumb.label}
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function HRTopbar() {
  const initials = hrUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-canvas px-6">
      <HRBreadcrumb />

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border border-bg-canvas bg-red-500" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </button>
        <DarkModeToggle />
        <Avatar initials={initials} size="md" color="teal" />
      </div>
    </header>
  );
}
