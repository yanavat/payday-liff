"use client";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Headphones,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/hr/dashboard", label: "แดชบอร์ด", icon: Gauge },
  { href: "/hr/requests", label: "คำร้องขอ", icon: FileText },
  { href: "/hr/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/hr/employees", label: "พนักงาน", icon: Users },
  { href: "/hr/settings", label: "การตั้งค่า", icon: Settings },
];

const footerNav = [
  // { href: "/hr/support", label: "สนับสนุน", icon: Headphones },
  { href: "/", label: "ออกจากระบบ", icon: LogOut },
];

export function HRSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      setCollapsed(window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-bg-sidebar py-4 transition-all duration-200 ease-in-out",
        collapsed ? "w-[72px] px-2" : "w-[200px] px-0",
      )}
    >
      <div
        className={cn(
          "flex items-center pb-6",
          collapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-bold text-white">
            E
          </div>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-200",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            <div className="text-[18px] font-bold leading-[22.5px] text-emerald-600">
              EWA Pro
            </div>
            <div className="truncate text-[10px] leading-[15px] text-text-muted">
              แผงควบคุมผู้ดูแลระบบ HR
            </div>
          </div>
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded text-text-muted transition hover:bg-bg-secondary hover:text-text-secondary"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="absolute right-[-10px] top-5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-bg-canvas text-text-secondary shadow-card transition hover:text-primary-dark"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-[6px]",
          collapsed ? "px-2" : "px-3",
        )}
        aria-label="HR navigation"
      >
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-[38px] items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                collapsed && "justify-center px-0",
                active
                  ? "bg-emerald-500 text-white shadow-card"
                  : "text-text-secondary hover:bg-primary-bg hover:text-primary-dark",
              )}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={1.8}
                aria-hidden
              />
              <span
                className={cn(
                  "transition-opacity duration-200",
                  collapsed ? "hidden" : "inline",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-border pt-[18px]",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {footerNav.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-[38px] items-center gap-3 rounded-md px-3 text-sm font-medium text-text-secondary transition hover:bg-primary-bg hover:text-primary-dark",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={1.8}
                aria-hidden
              />
              <span
                className={cn(
                  "transition-opacity duration-200",
                  collapsed ? "hidden" : "inline",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
