"use client";

import React from "react";
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
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0]; // "th" | "en" | "my"
  const base = `/${locale}/hr`;

  // Skip "hr" root — only show segments from the page level onward,
  // and filter out dynamic ID params (not in SEGMENT_LABELS) and the
  // dashboard segment since it is already represented by the fixed root crumb
  const segments = parts
    .slice(2)
    .filter((seg) => seg in SEGMENT_LABELS && seg !== "dashboard");

  // Build dynamic crumbs for labeled segments
  const dynamicCrumbs = segments.map((seg, i) => {
    // Build href up to this labeled segment within the full path
    let accumulated = base;
    let labeledCount = 0;
    for (const part of parts.slice(2)) {
      accumulated += `/${part}`;
      if (part in SEGMENT_LABELS) {
        labeledCount++;
        if (labeledCount === i + 1) break;
      }
    }
    return {
      label: SEGMENT_LABELS[seg],
      href: accumulated,
      isLast: i === segments.length - 1,
    };
  });

  // Prepend fixed Dashboard root crumb
  const crumbs = [
    {
      label: SEGMENT_LABELS.hr,
      href: `${base}/dashboard`,
      isLast: dynamicCrumbs.length === 0,
    },
    ...dynamicCrumbs,
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.href}-${index}`}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="font-semibold text-text-primary">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={crumb.href}
                  className="text-text-muted hover:text-text-primary"
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
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
