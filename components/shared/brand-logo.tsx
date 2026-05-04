import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export function BrandLogo({ className, size = 48 }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center rounded-xl bg-primary text-white shadow-hover",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Avatar
        initials=""
        src="/images/logo.svg"
        className="h-full w-full"
        alt="PayDay+"
      />
    </div>
  );
}
