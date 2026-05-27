"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getApiClient } from "@/lib/api/client";

type GuardState = "loading" | "authorized" | "redirecting";

type AuthMeResponse = {
  hrUser?: unknown;
};

export function HRAuthGate({ children }: { children: ReactNode }) {
  const { push } = useRouter();
  const t = useTranslations("common");
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getApiClient().get<AuthMeResponse>("/api/auth/me");

        if (cancelled) return;

        if (session.hrUser) {
          setState("authorized");
          return;
        }

        setState("redirecting");
        push("/hr/login");
      } catch {
        if (!cancelled) {
          setState("redirecting");
          push("/hr/login");
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [push]);

  if (state === "authorized") return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page text-sm font-medium text-text-secondary">
      {t("loading")}
    </main>
  );
}
