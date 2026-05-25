import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type RequestStatus = "pending" | "approved" | "rejected" | "disbursed" | "cancelled";

interface StatusBadgeProps {
  status: RequestStatus;
  size?: "sm" | "md";
  className?: string;
}

const statusClassMap: Record<RequestStatus, string> = {
  pending: "bg-status-pending-bg text-status-pending-text animate-pulse-badge",
  approved: "bg-status-approved-bg text-status-approved-text",
  rejected: "bg-status-rejected-bg text-status-rejected-text",
  disbursed: "bg-status-disbursed-bg text-status-disbursed-text",
  cancelled: "bg-status-rejected-bg text-status-rejected-text",
};

export function StatusBadge({
  status,
  size = "md",
  className,
}: StatusBadgeProps) {
  const t = useTranslations("status");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none",
        size === "sm" ? "px-2 py-1 text-[12px]" : "px-2.5 py-1 text-[13px]",
        statusClassMap[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
