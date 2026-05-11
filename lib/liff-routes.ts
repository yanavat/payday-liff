const LIFF_LOCALES = new Set(["th", "en", "my"]);

export function getLiffLocalePrefix(pathname: string | null) {
  if (!pathname) return "";
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return LIFF_LOCALES.has(firstSegment) ? `/${firstSegment}` : "";
}

export function withLiffLocale(pathname: string | null, href: string) {
  const localePrefix = getLiffLocalePrefix(pathname);
  if (!localePrefix || !href.startsWith("/")) return href;
  if (href === "/") return localePrefix;
  return `${localePrefix}${href}`;
}

export function isLiffPathActive(pathname: string | null, href: string) {
  if (!pathname) return href === "/";
  const localePrefix = getLiffLocalePrefix(pathname);
  const pathWithoutLocale = localePrefix
    ? pathname.slice(localePrefix.length) || "/"
    : pathname;

  return pathWithoutLocale === href;
}
