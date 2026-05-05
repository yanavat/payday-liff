"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "underline" | "pill";
  className?: string;
}

export function TabBar({
  tabs,
  value,
  onChange,
  variant = "pill",
  className,
}: TabBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        variant === "pill" && "rounded-md bg-bg-sidebar p-1",
        variant === "underline" && "border-b border-border",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition ",
              variant === "pill" &&
                (active
                  ? "rounded-full bg-primary text-white shadow-sm"
                  : "rounded-full bg-white text-text-muted hover:text-text-primary hover:border-text-muted"),
              variant === "underline" &&
                (active
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-text-muted hover:text-text-primary"),
            )}
          >
            <span>{tab.label}</span>
            {!!tab.count && tab.count > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-800">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
