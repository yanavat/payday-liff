import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/utils/format";

interface QuickAmountButtonProps {
  amount: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (amount: number) => void;
  className?: string;
}

export function QuickAmountButton({
  amount,
  selected = false,
  disabled = false,
  onClick,
  className,
}: QuickAmountButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick?.(amount)}
      className={cn(
        "h-12 rounded-md border px-4 text-[16px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30",
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-white text-text-primary hover:bg-primary-subtle",
        disabled && "cursor-not-allowed opacity-50 hover:bg-white",
        className,
      )}
    >
      {formatTHB(amount)}
    </button>
  );
}
