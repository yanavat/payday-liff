import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type PayCycle = "monthly" | "weekly";

interface PayCycleBadgeProps {
  type: PayCycle;
  className?: string;
}

const payCycleClassMap: Record<PayCycle, string> = {
  monthly: "border-blue-200 bg-blue-50 text-blue-700",
  weekly: "border-violet-200 bg-violet-50 text-violet-700",
};

export function PayCycleBadge({ type, className }: PayCycleBadgeProps) {
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-badge font-medium leading-none",
        payCycleClassMap[type],
        className,
      )}
    >
      {t(`payCycle.${type}`)}
    </span>
  );
}
