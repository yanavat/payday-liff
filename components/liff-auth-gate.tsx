"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import { LiffOnboardingPage } from "@/components/liff-onboarding-page";
import { loadLiffClient } from "@/lib/liff-client";

type AuthState = "loading" | "ready" | "linking" | "external" | "error";
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

const EMPLOYEE_LINKS_STORAGE_KEY = "payday-liff-employee-links";
const COMPANY_ID_STORAGE_KEY = "payday-company-id";
const LiffProfileContext = createContext<LiffProfile | null>(null);

export function useLiffProfile() {
  return useContext(LiffProfileContext);
}

export function useLinkedEmployeeId(): string {
  const profile = useLiffProfile();
  if (!profile?.userId) return "";
  return readEmployeeLinks()[profile.userId] ?? "";
}

export function LIFFAuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [lineUserId, setLineUserId] = useState("");
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const isMockMode = process.env.NEXT_PUBLIC_LIFF_MOCK === "true";

  useEffect(() => {
    let cancelled = false;

    async function initializeLiff() {
      try {
        const liff = await loadLiffClient();

        if (!liffId && !isMockMode) {
          throw new Error("NEXT_PUBLIC_LIFF_ID is required");
        }

        await liff.init({ liffId: liffId ?? "mock-liff-id" });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const profile = await liff.getProfile();
        const email = liff.getDecodedIDToken?.()?.email;

        if (!getLinkedEmployeeId(profile.userId)) {
          if (!cancelled) {
            setProfile({ ...profile, email });
            setLineUserId(profile.userId);
            setAuthState("linking");
          }
          return;
        }

        if (!cancelled) {
          setProfile({ ...profile, email });
          setAuthState("ready");
        }
      } catch {
        if (!cancelled) {
          setAuthState("error");
        }
      }
    }

    initializeLiff();

    return () => {
      cancelled = true;
    };
  }, [isMockMode, liffId]);

  const t = useTranslations("liff");

  if (authState === "loading") {
    return <main className="employee-screen p-5">{t("loading")}</main>;
  }

  if (authState === "external") {
    return (
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">{t("openInLine")}</h1>
        <p className="mt-2 text-text-secondary">{t("openInLineDescription")}</p>
        <a
          className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 font-medium text-white"
          href={`https://liff.line.me/${liffId}`}
        >
          {t("openInLineButton")}
        </a>
      </main>
    );
  }

  if (authState === "linking") {
    return (
      <LiffOnboardingPage
        lineProfile={profile!}
        onComplete={(companyId, employeeId) => {
          saveLinkedEmployee(lineUserId, employeeId, companyId);
          setAuthState("ready");
        }}
      />
    );
  }

  if (authState === "error") {
    return (
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">{t("openInLine")}</h1>
        <p className="mt-2 text-text-secondary">{t("openInLineDescription")}</p>
        {liffId ? (
          <a
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 font-medium text-white"
            href={`https://liff.line.me/${liffId}`}
          >
            {t("openInLineButton")}
          </a>
        ) : null}
      </main>
    );
  }

  return (
    <LiffProfileContext.Provider value={profile}>
      {children}
    </LiffProfileContext.Provider>
  );
}

function getLinkedEmployeeId(lineUserId: string): string | null {
  return readEmployeeLinks()[lineUserId] ?? null;
}

function saveLinkedEmployee(
  lineUserId: string,
  employeeId: string,
  companyId: string,
) {
  const links = readEmployeeLinks();
  links[lineUserId] = employeeId;
  localStorage.setItem(EMPLOYEE_LINKS_STORAGE_KEY, JSON.stringify(links));
  localStorage.setItem(COMPANY_ID_STORAGE_KEY, companyId);
}

function readEmployeeLinks(): Record<string, string> {
  try {
    return JSON.parse(
      localStorage.getItem(EMPLOYEE_LINKS_STORAGE_KEY) ?? "{}",
    ) as Record<string, string>;
  } catch {
    return {};
  }
}
