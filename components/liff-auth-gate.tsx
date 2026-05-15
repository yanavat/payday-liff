"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";

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
const LiffProfileContext = createContext<LiffProfile | null>(null);

export function useLiffProfile() {
  return useContext(LiffProfileContext);
}

export function useLinkedEmployeeId(): string {
  const profile = useLiffProfile();
  if (!profile?.userId) return "";
  try {
    const links = JSON.parse(
      localStorage.getItem(EMPLOYEE_LINKS_STORAGE_KEY) ?? "{}"
    ) as Record<string, string>;
    return links[profile.userId] ?? "";
  } catch {
    return "";
  }
}

export function LIFFAuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [lineUserId, setLineUserId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
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

  function handleLinkEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmployeeId = employeeId.trim();
    if (!trimmedEmployeeId || !lineUserId) {
      return;
    }

    saveLinkedEmployeeId(lineUserId, trimmedEmployeeId);
    setAuthState("ready");
  }

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
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">{t("linkTitle")}</h1>
        <p className="mt-2 text-text-secondary">{t("linkDescription")}</p>
        <form className="mt-6 space-y-4" onSubmit={handleLinkEmployee}>
          <label
            className="block text-sm font-medium text-text-primary"
            htmlFor="employee-id"
          >
            {t("employeeIdLabel")}
          </label>
          <input
            className="h-12 w-full rounded-md border border-border bg-bg-canvas px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            id="employee-id"
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder={t("employeeIdPlaceholder")}
            value={employeeId}
          />
          <button
            className="h-12 w-full rounded-md bg-primary px-5 font-medium text-white disabled:opacity-50"
            disabled={!employeeId.trim()}
            type="submit"
          >
            {t("linkButton")}
          </button>
        </form>
      </main>
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

function saveLinkedEmployeeId(lineUserId: string, employeeId: string) {
  const links = readEmployeeLinks();
  links[lineUserId] = employeeId;
  localStorage.setItem(EMPLOYEE_LINKS_STORAGE_KEY, JSON.stringify(links));
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
