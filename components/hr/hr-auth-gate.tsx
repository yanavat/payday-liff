"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getApiClient } from "@/lib/api/client";

type GuardState = "loading" | "authorized" | "redirecting";
export type HRRole = "hr_manager" | "accountant" | "viewer";

type AuthMeResponse = {
  hrUserId?: string;
  kind?: string;
  role?: HRRole;
};

type HRRoleContextValue = {
  role: HRRole;
};

export const HRRoleContext = createContext<HRRoleContextValue | null>(null);

export function useHRRole() {
  const context = useContext(HRRoleContext);
  if (!context) {
    throw new Error("useHRRole must be used within HRAuthGate");
  }
  return context;
}

export function HRAuthGate({ children }: { children: ReactNode }) {
  const { push } = useRouter();
  const t = useTranslations("common");
  const [state, setState] = useState<GuardState>("loading");
  const [role, setRole] = useState<HRRole>("viewer");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await getApiClient().get<AuthMeResponse>("/api/auth/me");

        if (cancelled) return;

        if (session.hrUserId && session.kind === "hr") {
          setRole(session.role ?? "viewer");
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

  if (state === "authorized") {
    return (
      <HRRoleContext.Provider value={{ role }}>
        {children}
      </HRRoleContext.Provider>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page text-sm font-medium text-text-secondary">
      {t("loading")}
    </main>
  );
}
