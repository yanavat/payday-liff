"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

interface ActivationScreenProps {
  onActivated: () => Promise<void>;
  onBackToLogin: () => void;
}

export function ActivationScreen({
  onActivated,
  onBackToLogin,
}: ActivationScreenProps) {
  const t = useTranslations("auth");
  const [phone, setPhone] = useState(() => getInitialPhone());
  const [invitationCode, setInvitationCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (pin !== confirmPin) {
      setError(t("errorPinMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          invitationCode,
          pin,
        }),
      });

      if (!response.ok) {
        setError(getActivationErrorMessage(response.status, t));
        return;
      }

      await onActivated();
    } catch {
      setError(t("errorDescription"));
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
            {t("activationTitle")}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField
            autoComplete="tel"
            inputMode="tel"
            label={t("phoneLabel")}
            onChange={setPhone}
            placeholder={t("phonePlaceholder")}
            value={phone}
          />
          <TextField
            inputMode="numeric"
            label={t("invitationCodeLabel")}
            maxLength={6}
            onChange={(value) => setInvitationCode(toDigits(value))}
            placeholder="000000"
            value={invitationCode}
          />
          <TextField
            autoComplete="new-password"
            inputMode="numeric"
            label={t("newPinLabel")}
            maxLength={6}
            onChange={(value) => setPin(toDigits(value))}
            placeholder={t("pinPlaceholder")}
            type="password"
            value={pin}
          />
          <TextField
            autoComplete="new-password"
            inputMode="numeric"
            label={t("confirmPinLabel")}
            maxLength={6}
            onChange={(value) => setConfirmPin(toDigits(value))}
            placeholder={t("pinPlaceholder")}
            type="password"
            value={confirmPin}
          />

          {error ? (
            <p className="rounded-md bg-[var(--color-error-bg)] px-3 py-2 text-[14px] font-medium text-[var(--color-error-text)]">
              {error}
            </p>
          ) : null}

          <button
            className="h-12 w-full rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              !phone.trim() ||
              invitationCode.length !== 6 ||
              pin.length !== 6 ||
              confirmPin.length !== 6 ||
              isSubmitting
            }
            type="submit"
          >
            {t("activationSubmit")}
          </button>
        </form>

        <button
          className="mt-5 h-11 text-[15px] font-semibold text-primary"
          onClick={onBackToLogin}
          type="button"
        >
          {t("activationBackToLogin")}
        </button>
      </section>
    </main>
  );
}

interface TextFieldProps {
  autoComplete?: string;
  inputMode?: "numeric" | "tel";
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "password" | "text";
  value: string;
}

function TextField({
  autoComplete,
  inputMode,
  label,
  maxLength,
  onChange,
  placeholder,
  type = "text",
  value,
}: TextFieldProps) {
  return (
    <label className="block text-[15px] font-semibold text-text-primary">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-[16px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function getInitialPhone() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("phone") ?? "";
}

function toDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function getActivationErrorMessage(
  status: number,
  t: (key: string) => string,
) {
  if (status === 410) return t("errorExpiredInvitation");
  if (status === 401) return t("errorInvalidInvitation");
  if (status === 400) return t("errorAlreadyActivated");
  return t("errorDescription");
}
