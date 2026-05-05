"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
  { code: "my", label: "MM" },
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
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        className={cn(
          "h-12 w-full rounded-md border border-border bg-bg-secondary px-3 text-[16px] font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          className,
        )}
      >
        {LOCALES.map((item) => (
          <option key={item.code} value={item.code}>
            {LOCALE_NAMES[item.code]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className={cn(
        "flex rounded-full border border-border bg-bg-secondary p-1",
        className,
      )}
    >
      {LOCALES.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => handleChange(item.code)}
          className={cn(
            "h-8 min-w-8 rounded-full px-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transition",
            locale === item.code
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
