"use client";

import { ClipboardList, Home, User, WalletCards } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getRequestsByEmployee } from "@/lib/mock/requests";
import { currentEmployee } from "@/lib/mock/currentUser";

const tabs = [
  { labelKey: "home", href: "/employee/home", icon: Home },
  { labelKey: "request", href: "/employee/request", icon: WalletCards },
  { labelKey: "history", href: "/employee/history", icon: ClipboardList },
  { labelKey: "profile", href: "/employee/profile", icon: User },
] as const;

export function BottomTabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const pendingCount = getRequestsByEmployee(currentEmployee.id).filter(
    (request) => request.status === "pending",
  ).length;

  return (
    <nav className="employee-bottom-tab z-20" aria-label={t("home")}>
      <div className="mx-auto flex w-full max-w-[390px] justify-around">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          const showBadge =
            tab.href === "/employee/request" && pendingCount > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium leading-none transition hover:text-primary",
                active ? "text-primary " : "text-text-muted",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                {showBadge && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[12px] font-bold text-bg-canvas">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className="!text-[14px]">
                {t(tab.labelKey as keyof typeof t)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
