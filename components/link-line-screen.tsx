"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import type { LiffProfile } from "@/components/liff-auth-gate";

interface LinkLineScreenProps {
  lineProfile: LiffProfile;
  onLinked: () => Promise<void>;
}

export function LinkLineScreen({ lineProfile, onLinked }: LinkLineScreenProps) {
  const t = useTranslations("auth");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/link-line", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          pin,
          lineUserId: lineProfile.userId,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            t("errorTooManyAttempts", {
              seconds: response.headers.get("Retry-After") ?? "60",
            }),
          );
        } else {
          setError(t("errorInvalidCredentials"));
        }
        setPin("");
        return;
      }

      await onLinked();
    } catch {
      setError(t("errorDescription"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employee-screen min-h-dvh bg-bg-page px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-[390px] flex-col justify-center">
        <div className="mb-6 text-center">
          {lineProfile.pictureUrl ? (
            <img
              alt={lineProfile.displayName}
              className="mx-auto h-20 w-20 rounded-full border-4 border-white object-cover shadow-card"
              src={lineProfile.pictureUrl}
            />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-[24px] font-bold text-white shadow-card">
              {lineProfile.displayName.slice(0, 1)}
            </div>
          )}
          <h1 className="mt-4 text-[24px] font-bold leading-tight text-text-primary">
            {t("lineLinkTitle")}
          </h1>
          <p className="mt-2 text-[16px] text-text-secondary">
            {t("lineLinkGreeting", { name: lineProfile.displayName })}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-[15px] font-semibold text-text-primary">
            {t("phoneLabel")}
            <input
              autoComplete="tel"
              className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-[16px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("phonePlaceholder")}
              value={phone}
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-[14px] font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <button
            className="h-12 w-full rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!phone.trim() || pin.length !== 6 || isSubmitting}
            type="submit"
          >
            {t("lineLinkButton")}
          </button>
        </form>
      </section>
    </main>
  );
}
