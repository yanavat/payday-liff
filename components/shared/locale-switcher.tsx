"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "th", label: "ไทย", name: "Thai" },
  { code: "en", label: "EN", name: "English" },
  { code: "my", label: "မြန်မာ", name: "Myanmar" },
];

const LOCALE_NAMES: Record<string, string> = {
  th: "Thai / ไทย",
  en: "English",
  my: "မြန်မာ",
};

interface LocaleSwitcherProps {
  variant?: "pill" | "select";
  className?: string;
}

export function LocaleSwitcher({
  variant = "pill",
  className,
}: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  function handleChange(nextLocale: string) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  if (variant === "select") {
    return (
      <div className={cn("relative w-full", className)}>
        <select
          value={locale}
          onChange={(event) => handleChange(event.target.value)}
          aria-label="Language"
          className="h-11 w-full appearance-none rounded-md bg-bg-secondary px-3 pr-10 text-[16px] font-medium text-text-primary outline-none transition hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {LOCALES.map((item) => (
            <option key={item.code} value={item.code}>
              {LOCALE_NAMES[item.code]}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          strokeWidth={1.8}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-lg  bg-bg-secondary p-1 ",
        className,
      )}
    >
      {LOCALES.map((item) => {
        const isActive = locale === item.code;

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => handleChange(item.code)}
            aria-label={`Switch language to ${item.name}`}
            aria-pressed={isActive}
            className={cn(
              "flex h-9 min-w-0 items-center justify-center rounded-md px-2 text-center text-xs font-semibold leading-none transition focus:outline-none focus:ring-2 focus:ring-primary/30",
              isActive
                ? "bg-primary/85 text-canvas shadow-card"
                : "text-text-muted hover:bg-bg-canvas hover:text-text-primary",
            )}
          >
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
