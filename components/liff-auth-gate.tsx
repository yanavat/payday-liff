"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import { ActivationScreen } from "@/components/activation-screen";
import { BrowserLoginScreen } from "@/components/browser-login-screen";
import { LinkLineScreen } from "@/components/link-line-screen";
import { getAuthEmployeeId } from "@/lib/auth/get-auth-employee-id";
import { loadLiffClient } from "@/lib/liff-client";
import { getApiClient } from "@/lib/api/client";
import type { Employee, HRUser } from "@/lib/api";

type AuthState = "loading" | "ready" | "login" | "activation" | "linking" | "error";

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

export interface AuthContextType {
  employee: Employee | null;
  hrUser: HRUser | null;
  isInLiff: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pin: string) => Promise<void>;
  hrLogin: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
}

type AuthMeResponse = {
  employee?: Employee | null;
  hrUser?: HRUser | null;
  companyId?: string;
};

type LineLoginResponse = {
  status?: "authenticated" | "needs_activation" | "needs_linking";
  companyId?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);
const LiffProfileContext = createContext<LiffProfile | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthGate");
  }
  return context;
}

export function useLiffProfile() {
  return useContext(LiffProfileContext);
}

export function useLinkedEmployeeId(): string {
  const { employee } = useAuth();
  return getAuthEmployeeId(employee);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [hrUser, setHrUser] = useState<HRUser | null>(null);
  const [isInLiff, setIsInLiff] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const t = useTranslations("auth");

  const applySession = useCallback((session: AuthMeResponse) => {
    const employee = session.employee ?? null;
    const companyId = session.companyId ?? getAuthCompanyId();
    if (companyId && typeof window !== "undefined") {
      localStorage.setItem("payday-company-id", companyId);
      getApiClient().setCompanyId(companyId);
    }
    setEmployee(employee);
    setHrUser(session.hrUser ?? null);
    setAuthState("ready");
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await authFetch("/api/auth/me");
    if (!response.ok) {
      throw response;
    }
    applySession((await response.json()) as AuthMeResponse);
  }, [applySession]);

  const login = useCallback(
    async (identifier: string, pin: string) => {
      const response = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, pin }),
      });
      if (!response.ok) throw response;
      const payload = (await response.json().catch(() => ({}))) as { companyId?: string };
      if (payload.companyId && typeof window !== "undefined") {
        localStorage.setItem("payday-company-id", payload.companyId);
        getApiClient().setCompanyId(payload.companyId);
      }
      await refreshSession();
    },
    [refreshSession],
  );

  const hrLogin = useCallback(
    async (email: string, pass: string) => {
      const response = await authFetch("/api/auth/hr/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      if (!response.ok) throw response;
      await refreshSession();
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    const response = await authFetch("/api/auth/logout?scope=employee", { method: "POST" });
    if (!response.ok) throw response;
    setEmployee(null);
    setHrUser(null);
    setAuthState("login");
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const response = await authFetch("/api/auth/verify-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    if (response.status === 429) throw response;
    return response.ok;
  }, []);

  const authContext = useMemo<AuthContextType>(
    () => ({
      employee,
      hrUser,
      isInLiff,
      isAuthenticated: Boolean(employee || hrUser),
      login,
      hrLogin,
      logout,
      verifyPin,
    }),
    [employee, hrLogin, hrUser, isInLiff, login, logout, verifyPin],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const sessionResponse = await authFetch("/api/auth/me");

      if (cancelled) return;

      if (sessionResponse.ok) {
        applySession((await sessionResponse.json()) as AuthMeResponse);
        return;
      }

      // 400 means x-company-id header is missing (not yet known on first load)
      // treat it like 401 so the LIFF auth flow can proceed and set the company ID
      if (sessionResponse.status !== 401 && sessionResponse.status !== 400) {
        setAuthState("error");
        return;
      }

      if (!shouldRunLiffAuth()) {
        setAuthState("login");
        return;
      }

      await initializeLiffAuth(cancelled);
    }

    async function initializeLiffAuth(wasCancelled: boolean) {
      try {
        const liff = await loadLiffClient();
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID ?? "mock-liff-id";

        await liff.init({ liffId });
        const nextIsInLiff = liff.isInClient() || shouldRunLiffAuth();

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const nextProfile = await liff.getProfile();
        const email = liff.getDecodedIDToken?.()?.email;

        if (wasCancelled || cancelled) return;

        setIsInLiff(nextIsInLiff);
        setProfile({ ...nextProfile, email });

        const lineLoginResponse = await authFetch("/api/auth/line-login", {
          method: "POST",
          body: JSON.stringify({ lineUserId: nextProfile.userId }),
        });

        if (wasCancelled || cancelled) return;

        if (!lineLoginResponse.ok) {
          setAuthState("error");
          return;
        }

        const payload = (await lineLoginResponse.json()) as LineLoginResponse;

        if (payload.status === "needs_activation") {
          setAuthState("activation");
          return;
        }

        if (payload.status === "needs_linking") {
          setAuthState("linking");
          return;
        }

        if (payload.companyId && typeof window !== "undefined") {
          localStorage.setItem("payday-company-id", payload.companyId);
          getApiClient().setCompanyId(payload.companyId);
        }

        await refreshSession();
      } catch {
        if (!wasCancelled && !cancelled) {
          setAuthState("error");
        }
      }
    }

    initialize().catch(() => {
      if (!cancelled) {
        setAuthState("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [applySession, refreshSession]);

  return (
    <AuthContext.Provider value={authContext}>
      <LiffProfileContext.Provider value={profile}>
        {authState === "loading" ? (
          <AuthShell>{t("loading")}</AuthShell>
        ) : null}
        {authState === "login" ? (
          <BrowserLoginScreen onActivate={() => setAuthState("activation")} />
        ) : null}
        {authState === "activation" ? (
          <ActivationScreen
            onActivated={refreshSession}
            onBackToLogin={() => setAuthState("login")}
          />
        ) : null}
        {authState === "linking" ? (
          profile ? <LinkLineScreen lineProfile={profile} onLinked={refreshSession} /> : null
        ) : null}
        {authState === "error" ? (
          <AuthShell>
            <h1 className="text-[22px] font-semibold text-text-primary">
              {t("errorTitle")}
            </h1>
            <p className="mt-2 text-text-muted">{t("errorDescription")}</p>
          </AuthShell>
        ) : null}
        {authState === "ready" ? children : null}
      </LiffProfileContext.Provider>
    </AuthContext.Provider>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return <main className="employee-screen p-5">{children}</main>;
}

function shouldRunLiffAuth() {
  if (process.env.NEXT_PUBLIC_LIFF_MOCK === "true") return true;
  if (typeof navigator === "undefined") return false;
  return /Line\//i.test(navigator.userAgent);
}

function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const companyId = getAuthCompanyId();
  if (companyId && !headers.has("x-company-id")) {
    headers.set("x-company-id", companyId);
  }

  return fetch(path, {
    ...init,
    credentials: "include",
    headers,
    method: init.method ?? "GET",
  });
}

function getAuthCompanyId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("payday-company-id") ?? process.env.NEXT_PUBLIC_COMPANY_ID;
  }

  return process.env.NEXT_PUBLIC_COMPANY_ID;
}
