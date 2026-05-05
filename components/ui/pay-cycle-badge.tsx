import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type PayCycle = "monthly" | "weekly";

interface PayCycleBadgeProps {
  type: PayCycle;
  className?: string;
  size?: "sm" | "md";
}

const payCycleClassMap: Record<PayCycle, string> = {
  monthly: "border border-blue-200 bg-blue-100 text-blue-700",
  weekly: "border border-violet-200 bg-violet-100 text-violet-700",
};

export function PayCycleBadge({
  type,
  className,
  size = "md",
}: PayCycleBadgeProps) {
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-badge font-medium leading-none",
        size === "sm" ? "px-2 py-1 text-[12px]" : "px-2.5 py-1 text-[13px]",
        payCycleClassMap[type],
        className,
      )}
    >
      {t(`payCycle.${type}`)}
    </span>
  );
}
