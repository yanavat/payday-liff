import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

export async function loadLocaleMessages(locale: AppLocale) {
  return (await import(`../../messages/${locale}.json`)).default;
}
