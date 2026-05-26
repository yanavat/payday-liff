"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

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
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (cancelled) return;

        if (!response.ok) {
          setState("redirecting");
          push("/hr/login");
          return;
        }

        const session = (await response.json()) as AuthMeResponse;
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
