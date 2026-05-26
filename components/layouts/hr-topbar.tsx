"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Building2, HelpCircle, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/session";
import { hrUser, companyName } from "@/lib/mock";
import { cn } from "@/lib/utils";

const SEGMENT_KEYS: Record<string, string> = {
  hr: "dashboard",
  dashboard: "dashboard",
  requests: "requests",
  reports: "reports",
  settings: "settings",
  employees: "employees",
  request: "requestOnBehalf",
};

function HRBreadcrumb() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0]; // "th" | "en" | "my"
  const base = `/${locale}/hr`;

  // Skip "hr" root — only show segments from the page level onward,
  // and filter out dynamic ID params (not in SEGMENT_KEYS) and the
  // dashboard segment since it is already represented by the fixed root crumb
  const segments = parts
    .slice(2)
    .filter((seg) => seg in SEGMENT_KEYS && seg !== "dashboard");

  // Build dynamic crumbs for labeled segments
  const dynamicCrumbs = segments.map((seg, i) => {
    // Build href up to this labeled segment within the full path
    let accumulated = base;
    let labeledCount = 0;
    for (const part of parts.slice(2)) {
      accumulated += `/${part}`;
      if (part in SEGMENT_KEYS) {
        labeledCount++;
        if (labeledCount === i + 1) break;
      }
    }
    return {
      label: t(SEGMENT_KEYS[seg] as keyof typeof t),
      href: accumulated,
      isLast: i === segments.length - 1,
    };
  });

  // Prepend fixed Dashboard root crumb
  const crumbs = [
    {
      label: t("dashboard"),
      href: `${base}/dashboard`,
      isLast: dynamicCrumbs.length === 0,
    },
    ...dynamicCrumbs,
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1.5 text-xs sm:gap-2">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.href}-${index}`}>
            <BreadcrumbItem className="min-w-0">
              {crumb.isLast ? (
                <BreadcrumbPage className="max-w-[28ch] truncate text-sm font-semibold text-text-primary">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={crumb.href}
                  className="max-w-[18ch] truncate text-text-muted hover:text-text-primary"
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

const roleLabels: Record<typeof hrUser.role, string> = {
  hr_manager: "HR Manager",
  hr_officer: "HR Officer",
  accountant: "Accountant",
};

const TopbarIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ children, className, label, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-primary-subtle hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30",
      className,
    )}
    aria-label={label}
    title={label}
    {...props}
  >
    {children}
  </button>
));
TopbarIconButton.displayName = "TopbarIconButton";

export function HRTopbar() {
  const t = useTranslations("common");
  const router = useRouter();
  const displayCompanyName = companyName.trim();
  const initials = hrUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border [background-color:color-mix(in_srgb,var(--color-bg-canvas)_95%,transparent)] px-5 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur supports-[backdrop-filter]:[background-color:color-mix(in_srgb,var(--color-bg-canvas)_85%,transparent)] lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-primary-subtle text-primary-dark">
          <Building2 className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="min-w-0">
          <HRBreadcrumb />
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate text-caption text-text-muted">
              {displayCompanyName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-1 rounded-lg   sm:flex">
          <TopbarIconButton label="Notifications">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-bg-secondary bg-red-500" />
          </TopbarIconButton>
          <TopbarIconButton label="Help">
            <HelpCircle
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
              aria-hidden
            />
          </TopbarIconButton>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TopbarIconButton label="Settings">
              <Settings className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            </TopbarIconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[16rem] p-2">
            <DropdownMenuLabel className="px-2 font-semibold">
              {t("language")}
            </DropdownMenuLabel>
            <div className="px-1 py-2">
              <LocaleSwitcher />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2 font-semibold">
              {t("appearance")}
            </DropdownMenuLabel>
            <div className="flex items-center justify-between rounded-md bg-bg-secondary px-3 py-2">
              <span className="text-sm font-medium text-text-secondary">
                {t("darkMode")}
              </span>
              <DarkModeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void signOut("hr", router);
              }}
              className="text-red-600 focus:text-red-700"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2 rounded-lg bg-bg-canvas py-1 pl-1 pr-3 ">
          <Avatar
            initials={initials}
            src={hrUser.avatarUrl}
            alt={hrUser.name}
            size="md"
            color="teal"
          />
          <div className="hidden min-w-0 leading-none md:block">
            <div className="max-w-[140px] truncate text-sm font-semibold text-text-primary">
              {hrUser.name}
            </div>
            <div className="mt-1 text-[11px] leading-none text-text-muted">
              {roleLabels[hrUser.role]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
