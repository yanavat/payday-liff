"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getLiffLocalePrefix } from "@/lib/liff-routes";

/**
 * Handles deep-link routing from LINE push notifications and rich menu.
 * Expected query params:
 *   ?page=history&id=EWA-001   → /history?id=EWA-001
 *   ?page=home                 → /
 *   ?page=request              → /request
 *   ?page=profile              → /profile
 *
 * Removes the ?page param after routing to keep URLs clean.
 */
export function LiffDeepLinkHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const page = searchParams.get("page");
    if (!page) return;

    const id = searchParams.get("id");
    const url = new URL(window.location.href);
    const localePrefix = getLiffLocalePrefix(pathname);

    // Remove the deep-link params so they don't persist on refresh
    url.searchParams.delete("page");
    if (id) url.searchParams.delete("id");

    switch (page) {
      case "home":
        router.replace(`${localePrefix}/`);
        break;
      case "request":
        router.replace(`${localePrefix}/request${url.search}`);
        break;
      case "history":
        router.replace(
          `${localePrefix}/history${id ? `?id=${encodeURIComponent(id)}` : url.search}`,
        );
        break;
      case "profile":
        router.replace(`${localePrefix}/profile${url.search}`);
        break;
      default:
        // Unknown page — just clean the URL
        router.replace(url.pathname + url.search);
    }
  }, [pathname, searchParams, router]);

  return null;
}
