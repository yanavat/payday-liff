import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { loadLocaleMessages, type AppLocale } from "@/lib/i18n/load-locale-messages";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "PayDay+ | Earned Wage Access",
    template: "%s | PayDay+",
  },
  description: "Earned Wage Access Platform — Factory Edition",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "th" | "en" | "my")) {
    notFound();
  }

  const messages = await loadLocaleMessages(locale as AppLocale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider>{children}</ToastProvider>
    </NextIntlClientProvider>
  );
}
