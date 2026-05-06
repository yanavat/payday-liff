import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendBadge } from "./trend-badge";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "hero";
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  trendLabel,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-bg-canvas  p-5 shadow-card transition-all duration-200 hover:shadow-hover",
        variant === "hero" && "rounded-xl border-0 bg-primary-bg px-6 py-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label text-text-muted">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-tight text-text-primary">
            {value}
          </p>
          <div className="flex items-center gap-2">
            {sub && <p className="text-caption text-text-muted">{sub}</p>}

            {typeof trend === "number" && (
              <div className="">
                <TrendBadge value={trend} label={trendLabel} />
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            {icon}
          </div>
        )}
      </div>

      {variant === "hero" && icon && (
        <div className="pointer-events-none absolute -bottom-4 -right-4 text-primary opacity-10 [&_svg]:h-20 [&_svg]:w-20">
          {icon}
        </div>
      )}
    </section>
  );
}
