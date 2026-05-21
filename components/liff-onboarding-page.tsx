"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { getApiClient, setAuthToken } from "@/lib/api/client";
import type { CompanyDto, PaginatedResponse } from "@/lib/api/types";
import type {
  OnboardingStep,
  SendOtpResponse,
  VerifyEmployeeResponse,
  VerifyOtpResponse,
} from "@/types";

interface LiffOnboardingPageProps {
  lineProfile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };
  onComplete: (companyId: string, employeeId: string) => void;
}

const COMPANY_ID_STORAGE_KEY = "payday-company-id";
const DEFAULT_OTP_SECONDS = 300;

type CompanyCodeOption = {
  code: string;
  label: string;
};

export function LiffOnboardingPage({
  lineProfile,
  onComplete,
}: LiffOnboardingPageProps) {
  const searchParams = useSearchParams();
  const companyFromQr = searchParams.get("company") ?? "";
  const t = useTranslations("onboarding");
  const common = useTranslations("common");

  const [step, setStep] = useState<OnboardingStep>("company_verify");
  const [companyCode, setCompanyCode] = useState(companyFromQr);
  const [companyOptions, setCompanyOptions] = useState<CompanyCodeOption[]>([]);
  const [employeeCode, setEmployeeCode] = useState("");
  const [employee, setEmployee] = useState<VerifyEmployeeResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [loading, setLoading] = useState<"verify" | "send" | "otp" | null>(
    null,
  );
  const [error, setError] = useState("");

  const companyLocked = companyFromQr.length > 0;
  const canVerify =
    companyCode.trim().length > 0 && employeeCode.trim().length > 0;
  const canSubmitOtp = otp.length === 6 && !loading;

  const stepNumber = useMemo(() => {
    if (step === "otp_verify") return 2;
    if (step === "complete") return 3;
    return 1;
  }, [step]);

  useEffect(() => {
    if (step !== "otp_verify" || otpSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setOtpSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpSeconds, step]);

  useEffect(() => {
    let active = true;

    async function loadCompanies() {
      try {
        const response = await getApiClient().get<PaginatedResponse<CompanyDto>>(
          "/companies",
          { limit: 100, offset: 0 },
        );
        if (!active) return;

        setCompanyOptions(
          response.data
            .filter((company) => company.active && company.code)
            .map((company) => ({
              code: company.code,
              label: company.nameEn || company.name,
            })),
        );
      } catch {
        if (active) setCompanyOptions([]);
      }
    }

    loadCompanies();

    return () => {
      active = false;
    };
  }, []);

  async function sendOtp(employeeId: string) {
    setLoading("send");
    const response = await getApiClient().post<SendOtpResponse>(
      "/auth/otp/send",
      { employeeId },
    );
    setOtpSeconds(response.expiresInSeconds || DEFAULT_OTP_SECONDS);
    setLoading(null);
  }

  async function handleVerifyEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canVerify) return;

    setError("");
    setLoading("verify");
    try {
      const response = await getApiClient().post<VerifyEmployeeResponse>(
        "/employees/verify",
        {
          companyCode: companyCode.trim(),
          employeeCode: employeeCode.trim(),
        },
      );
      setEmployee(response);
      await sendOtp(response.employeeId);
      setStep("otp_verify");
    } catch {
      setError(t("verifyError"));
      setLoading(null);
    }
  }

  async function handleResendOtp() {
    if (!employee || otpSeconds > 0) return;
    setError("");
    try {
      await sendOtp(employee.employeeId);
    } catch {
      setError(common("error"));
      setLoading(null);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employee || !canSubmitOtp) return;

    setError("");
    setLoading("otp");
    try {
      const response = await getApiClient().post<VerifyOtpResponse>(
        "/auth/otp/verify",
        {
          employeeId: employee.employeeId,
          otp,
          lineUserId: lineProfile.userId,
        },
      );
      const companyId = response.companyId || employee.companyId;
      setAuthToken(response.authToken);
      localStorage.setItem(COMPANY_ID_STORAGE_KEY, companyId);
      getApiClient().setCompanyId(companyId);
      setStep("complete");
      onComplete(companyId, employee.employeeId);
    } catch {
      setError(t("otpError"));
      setLoading(null);
    }
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
  }

  function handleBackToVerify() {
    setOtp("");
    setError("");
    setOtpSeconds(0);
    setStep("company_verify");
  }

  return (
    <main className="employee-screen justify-center px-5 py-8">
      <section className="w-full rounded-lg border border-border bg-bg-canvas p-5 shadow-card">
        <div className="mb-5 flex items-center gap-3">
          {lineProfile.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              src={lineProfile.pictureUrl}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-bg text-sm font-semibold text-primary-dark">
              LINE
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-primary-dark">
              {t("lineConnected")}
            </p>
            <p className="text-base font-semibold text-text-primary">
              {lineProfile.displayName}
            </p>
          </div>
        </div>

        <p className="mb-2 text-sm font-medium text-text-muted">
          {t("stepIndicator", { current: stepNumber, total: 3 })}
        </p>

        {step === "company_verify" ? (
          <form className="space-y-5" onSubmit={handleVerifyEmployee}>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {t("step1Title")}
              </h1>
              <p className="mt-2 text-base leading-7 text-text-secondary">
                {t("step1Description")}
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-text-primary"
                htmlFor="company-code"
              >
                {t("companyCodeLabel")}
              </label>
              <input
                className="h-12 w-full rounded-md border border-border bg-bg-canvas px-4 text-base uppercase outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-primary-bg disabled:text-text-secondary"
                disabled={companyLocked}
                id="company-code"
                list="company-code-options"
                onChange={(event) =>
                  setCompanyCode(event.target.value.toUpperCase())
                }
                placeholder={t("companyCodePlaceholder")}
                value={companyCode}
              />
              <datalist id="company-code-options">
                {companyOptions.map((company) => (
                  <option key={company.code} label={company.label} value={company.code} />
                ))}
              </datalist>
              {companyLocked ? (
                <span className="inline-flex rounded-sm bg-primary-bg px-2 py-1 text-xs font-medium text-primary-dark">
                  {t("companyCodeAutoFilled")}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-text-primary"
                htmlFor="employee-code"
              >
                {t("employeeCodeLabel")}
              </label>
              <input
                className="h-12 w-full rounded-md border border-border bg-bg-canvas px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
                id="employee-code"
                onChange={(event) => setEmployeeCode(event.target.value)}
                placeholder={t("employeeCodePlaceholder")}
                value={employeeCode}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 font-medium text-white disabled:opacity-50"
              disabled={!canVerify || loading !== null}
              type="submit"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("verifyButton")}
            </button>
          </form>
        ) : null}

        {step === "otp_verify" && employee ? (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {t("step2Title")}
              </h1>
              <p className="mt-2 text-base leading-7 text-text-secondary">
                {t("step2Description", { phone: employee.phoneMasked })}
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-text-primary"
                htmlFor="otp"
              >
                {t("otpLabel")}
              </label>
              <input
                className="h-12 w-full rounded-md border border-border bg-bg-canvas px-4 text-center font-sans text-xl tabular-nums tracking-[0.3em] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                id="otp"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => handleOtpChange(event.target.value)}
                placeholder={t("otpPlaceholder")}
                value={otp}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3">
              <button
                className="h-12 flex-1 rounded-md border border-border bg-bg-canvas px-4 font-medium text-text-primary"
                onClick={handleBackToVerify}
                type="button"
              >
                {common("back")}
              </button>
              <button
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-md bg-primary px-5 font-medium text-white disabled:opacity-50"
                disabled={!canSubmitOtp}
                type="submit"
              >
                {loading === "otp" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t("otpButton")}
              </button>
            </div>

            <button
              className="h-11 w-full rounded-md text-sm font-medium text-primary-dark disabled:text-text-muted"
              disabled={otpSeconds > 0 || loading === "send"}
              onClick={handleResendOtp}
              type="button"
            >
              {loading === "send"
                ? common("loading")
                : otpSeconds > 0
                  ? `${t("otpResend")} (${otpSeconds}s)`
                  : t("otpResend")}
            </button>
          </form>
        ) : null}

        {step === "complete" && employee ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-text-primary">
                {t("step3Title")}
              </h1>
              <p className="mt-2 text-base leading-7 text-text-secondary">
                {t("step3Description")}
              </p>
            </div>

            <dl className="rounded-md border border-border">
              <SummaryRow
                label={t("summaryCompany")}
                value={employee.companyName}
              />
              <SummaryRow label={t("summaryEmployeeId")} value={employeeCode} />
              <SummaryRow label={t("summaryName")} value={employee.nameTh} />
              <SummaryRow
                label={t("summaryPayCycle")}
                value={common("payCycle.monthly")}
              />
            </dl>

            <button
              className="h-12 w-full rounded-md bg-primary px-5 font-medium text-white"
              onClick={() =>
                onComplete(employee.companyId, employee.employeeId)
              }
              type="button"
            >
              {t("enterAppButton")}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}
