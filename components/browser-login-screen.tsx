"use client";

import { type FormEvent, useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/components/liff-auth-gate";

interface BrowserLoginScreenProps {
  onActivate: () => void;
}

export function BrowserLoginScreen({ onActivate }: BrowserLoginScreenProps) {
  const t = useTranslations("auth");
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lineClientId =
    process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LIFF_ID;
  const [lineLoginUrl, setLineLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lineClientId) return;

    const params = new URLSearchParams({
      client_id: lineClientId,
      redirect_uri: window.location.href,
      response_type: "code",
      scope: "profile openid",
      state: createStateNonce(),
    });

    setLineLoginUrl(
      `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`,
    );
  }, [lineClientId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(identifier.trim(), pin);
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        setError(t("errorInvalidCredentials"));
      } else if (error instanceof Response && error.status === 429) {
        setError(
          t("errorTooManyAttempts", {
            seconds: error.headers.get("Retry-After") ?? "60",
          }),
        );
      } else {
        setError(t("errorDescription"));
      }
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employee-screen min-h-dvh bg-bg-page px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-[390px] flex-col justify-center">
        <div className="mb-6">
          <p className="text-[15px] font-semibold text-primary">PayDay+</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight text-text-primary">
            {t("loginTitle")}
          </h1>
        </div>

        {lineLoginUrl ? (
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
            href={lineLoginUrl}
          >
            <LogIn className="h-5 w-5" strokeWidth={1.8} />
            {t("lineLoginButton")}
          </a>
        ) : null}

        <div className="my-5 flex items-center gap-3 text-[14px] text-text-muted">
          <span className="h-px flex-1 bg-border" />
          <span>{t("dividerOr")}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-[15px] font-semibold text-text-primary">
            {t("identifierLabel")}
            <input
              autoComplete="username"
              className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-[16px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t("identifierPlaceholder")}
              value={identifier}
            />
          </label>

          <label className="block text-[15px] font-semibold text-text-primary">
            {t("pinLabel")}
            <input
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 font-sans text-[18px] tracking-[0.24em] text-text-primary outline-none transition placeholder:tracking-normal placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={t("pinPlaceholder")}
              type="password"
              value={pin}
            />
          </label>

          {error ? (
            <p className="rounded-md bg-[var(--color-error-bg)] px-3 py-2 text-[14px] font-medium text-[var(--color-error-text)]">
              {error}
            </p>
          ) : null}

          <button
            className="h-12 w-full rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!identifier.trim() || pin.length !== 6 || isSubmitting}
            type="submit"
          >
            {t("loginButton")}
          </button>
        </form>

        <button
          className="mt-5 h-11 text-[15px] font-semibold text-primary"
          onClick={onActivate}
          type="button"
        >
          {t("activationLink")}
        </button>
      </section>
    </main>
  );
}

function createStateNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
