"use client"

import { useMemo, useState, useEffect } from "react"
import { AlertTriangle, Check, Share2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { QuickAmountButton } from "@/components/ui/quick-amount-button"
import { StatusBadge, type RequestStatus } from "@/components/ui/status-badge"
import { StepIndicator } from "@/components/ui/step-indicator"
import {
  useAuth,
  useLiffProfile,
} from "@/components/liff-auth-gate"
import {
  useEmployee,
  useEmployeeCurrentPeriod,
  useEmployeeEffectivePolicy,
} from "@/lib/api/hooks/use-employees"
import {
  useEWARequestActions,
  usePreviewEWARequest,
} from "@/lib/api/hooks/use-ewa-requests"
import type {
  CreateRequestDto,
  EWARequestDto,
  PreviewRequestDto,
  PreviewResultDto,
} from "@/lib/api/types"
import { formatTHB } from "@/lib/utils/format"
import { getAuthEmployeeId } from "@/lib/auth/get-auth-employee-id"
import {
  DEFAULT_TRANSFER_FEE_THB,
  getNetTransferAmount,
} from "@/lib/utils/fees"
import { loadLiffClient } from "@/lib/liff-client"
import { withLiffLocale } from "@/lib/liff-routes"

const quickAmounts = [1000, 2000, 3000]
const reasonChips = [
  { value: "emergency" },
  { value: "medical" },
  { value: "education" },
  { value: "utility" },
  { value: "other" },
] as const

const dateLocales: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  my: "my-MM",
}

function formatPayDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatRequestDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function LiffRequestPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState(3000)
  const [reason, setReason] = useState<string>("medical")
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinLoading, setPinLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [previewData, setPreviewData] = useState<PreviewResultDto | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<EWARequestDto | null>(
    null,
  )

  const { employee: authEmployee, isInLiff, verifyPin } = useAuth()
  const employeeId = getAuthEmployeeId(authEmployee)
  const profile = useLiffProfile()
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations("requestWizard")
  const tc = useTranslations("common")

  const {
    data: currentPeriod,
    loading: periodLoading,
    error: periodError,
  } = useEmployeeCurrentPeriod(employeeId)
  const { data: employee } = useEmployee(employeeId)
  const { data: effectivePolicy } = useEmployeeEffectivePolicy(employeeId)
  const { preview } = usePreviewEWARequest()
  const {
    create,
    loading: createLoading,
    error: createError,
  } = useEWARequestActions()

  const available = currentPeriod
    ? Math.max(
        0,
        currentPeriod.maxWithdrawable - currentPeriod.previousEWAThisPeriod,
      )
    : 0
  const isSuspended =
    effectivePolicy?.effective.enabled === false ||
    effectivePolicy?.effective.eligibility === "suspended"
  const limitReached =
    !isSuspended &&
    !!currentPeriod &&
    !!effectivePolicy &&
    currentPeriod.usedRequests >= effectivePolicy.effective.maxRequests
  const minAmount = previewData?.policy?.minAmount ?? 500
  const amountValid =
    amount > 0 &&
    Number.isInteger(amount) &&
    amount >= minAmount &&
    amount <= available
  const remaining = Math.max(available - amount, 0)
  const transferFee =
    previewData?.transferFee ??
    createdRequest?.transferFee ??
    DEFAULT_TRANSFER_FEE_THB
  const netTransferAmount =
    previewData?.netAmount ??
    createdRequest?.netAmount ??
    getNetTransferAmount(amount, transferFee)

  const reasonLabel = useMemo(() => t(`reasons.${reason}`), [reason, t])

  const payDateLabel = currentPeriod?.payDate
    ? formatPayDate(currentPeriod.payDate, locale)
    : ""

  useEffect(() => {
    if (step !== 3) return
    let cancelled = false
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return
      const shoot = (origin: { x: number; y: number }) =>
        confetti({
          particleCount: 80,
          spread: 70,
          origin,
          colors: ["#2dbd8f", "#a8e6cf", "#ffffff", "#ffd700", "#ff6b6b"],
          scalar: 1.1,
          gravity: 1.2,
          ticks: 200,
        })
      const t1 = setTimeout(() => {
        shoot({ x: 0.3, y: 0.5 })
        shoot({ x: 0.7, y: 0.5 })
      }, 300)
      const t2 = setTimeout(() => {
        shoot({ x: 0.5, y: 0.4 })
      }, 600)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    })
    return () => {
      cancelled = true
    }
  }, [step])

  useEffect(() => {
    if (step !== 2 || !employeeId) return
    let cancelled = false
    setPinError("")
    setSubmitError("")
    setPreviewData(null)
    setPreviewLoading(true)

    preview({
      employeeId,
      amount,
      reason: reason as PreviewRequestDto["reason"],
    })
      .then((result) => {
        if (!cancelled) setPreviewData(result)
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [step, employeeId, amount, reason, preview])

  async function submitRequest() {
    const request = await create({
      amount,
      reason: reason as CreateRequestDto["reason"],
      employeeNote: "",
    })

    if (!request) {
      setSubmitError(createError?.message ?? tc("error"))
      return
    }

    setCreatedRequest(request)
    setStep(3)
  }

  async function confirmPinAndSubmit() {
    if (pin.length < 6) return
    setPinLoading(true)
    setPinError("")
    setSubmitError("")
    try {
      const verified = await verifyPin(pin)
      if (!verified) {
        setPin("")
        setPinError(t("invalidPin"))
        return
      }
      setPinModalOpen(false)
      setPin("")
      await submitRequest()
    } catch (error) {
      setPin("")
      if (error instanceof Response && error.status === 429) {
        setPinError(
          t("pinRateLimited", {
            seconds: error.headers.get("Retry-After") ?? "60",
          }),
        )
        return
      }
      setPinError(tc("error"))
    } finally {
      setPinLoading(false)
    }
  }

  async function handleShare() {
    if (!createdRequest || !isInLiff) return
    const liff = await loadLiffClient()
    await liff.shareTargetPicker([
      {
        type: "text",
        text: t("shareReceiptText", {
          amount: formatTHB(createdRequest.requestedAmount),
          reference: createdRequest.id,
        }),
      },
    ])
  }

  const showStep1Skeleton = periodLoading && !currentPeriod
  const confirmDisabled =
    pinLoading ||
    createLoading ||
    previewLoading ||
    !previewData

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">
          {t("step1")}
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">{tc("next")}</p>
      </header>

      <StepIndicator
        steps={[t("step1"), t("step2"), t("step3")]}
        currentStep={step}
        className="mb-4"
      />

      {showStep1Skeleton && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {periodError && step === 1 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <AlertTriangle
            className="mx-auto mb-2 h-8 w-8 text-amber-500"
            aria-hidden
          />
          <p className="text-[16px] font-semibold text-amber-800">
            {tc("error")}
          </p>
          <p className="text-[16px] text-amber-600">{tc("errorLoadingData")}</p>
        </div>
      )}

      {step === 1 && !showStep1Skeleton && isSuspended && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-[16px] font-semibold text-red-700">
            {t("suspendedError")}
          </p>
        </div>
      )}

      {step === 1 && !showStep1Skeleton && limitReached && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-[16px] font-semibold text-red-700">
            {t("requestLimitError")}
          </p>
        </div>
      )}

      {step === 1 && !showStep1Skeleton && (
        <section className="space-y-4">
          <div className="rounded-xl bg-primary-bg p-4">
            <p className="text-[16px] text-text-secondary">
              {t("availableBalance")}
            </p>
            <p className="mt-1 font-sans text-[28px] font-bold leading-tight text-primary">
              {formatTHB(available)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-semibold text-text-primary">
              {t("customAmount")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((item) => (
                <QuickAmountButton
                  key={item}
                  amount={item}
                  selected={amount === item}
                  disabled={item > available}
                  onClick={setAmount}
                  className="text-[16px]"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAmount(available)}
              disabled={available <= 0}
              className={
                amount === available
                  ? "mt-4 rounded-md bg-primary-bg px-3 py-1.5 text-[14px] font-medium text-primary border border-primary-light"
                  : "mt-4 rounded-md bg-bg-secondary px-3 py-1.5 text-[14px] font-medium text-text-muted hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {t("withdrawAll")} · {formatTHB(available)}
            </button>
          </div>

          <div>
            <label
              className="mb-2 block text-[16px] font-semibold text-text-primary"
              htmlFor="custom-amount"
            >
              {t("customAmount")}
            </label>
            <div className="flex h-14 items-center rounded-md border border-border bg-white px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="mr-2 text-[18px] font-semibold text-text-muted">
                THB
              </span>
              <input
                id="custom-amount"
                type="number"
                inputMode="numeric"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent font-sans text-[20px] font-semibold outline-none"
              />
            </div>
            <p
              className={
                amountValid
                  ? "mt-2 text-[16px] text-text-muted"
                  : "mt-2 text-[16px] font-medium text-[var(--color-error-text)]"
              }
            >
              {amountValid
                ? `${t("remainingBalance")}: ${formatTHB(remaining)}`
                : t("amountError")}
            </p>
          </div>

          <div>
            <div className="mb-2 text-[16px] font-semibold text-text-primary">
              {t("reason")}
            </div>
            <div className="flex flex-wrap gap-2">
              {reasonChips.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
                  className={
                    reason === item.value
                      ? "rounded-full bg-primary-bg px-3 py-2 text-[16px] font-medium text-primary border border-primary"
                      : "rounded-full border border-border bg-white px-3 py-2 text-[16px] font-medium text-text-secondary"
                  }
                >
                  {t(`reasons.${item.value}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!amountValid || !employeeId || limitReached || isSuspended}
            onClick={() => setStep(2)}
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tc("next")} →
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          {previewLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {!previewLoading && !previewData && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-[16px] text-amber-800">
              {t("amountError")}
            </div>
          )}

          {previewData && (
            <>
              <div className="rounded-lg border border-border bg-white shadow-card">
                <div className="border-b border-border-light p-4 text-[16px] font-semibold text-text-primary">
                  {t("summaryCard")}
                </div>
                <div className="space-y-3 p-4 text-[16px]">
                  <SummaryRow
                    label={tc("employeeName")}
                    value={
                      employee?.name ??
                      ("nameTh" in (employee ?? {})
                        ? (employee as { nameTh?: string }).nameTh
                        : undefined) ??
                      profile?.displayName ??
                      "—"
                    }
                  />
                  <SummaryRow
                    label={tc("employeeId")}
                    value={employee?.employeeCode ?? employeeId}
                  />
                  <SummaryRow
                    label={t("requestedAmount")}
                    value={formatTHB(amount)}
                    highlight
                  />
                  <SummaryRow
                    label={t("transferFee")}
                    value={formatTHB(transferFee)}
                  />
                  <SummaryRow
                    label={t("netTransferAmount")}
                    value={formatTHB(netTransferAmount)}
                    highlight
                  />
                  <SummaryRow label={t("reason")} value={reasonLabel} />
                  <SummaryRow
                    label={t("bankAccount")}
                    value={employee?.bankAccountMasked ?? "—"}
                  />
                  <SummaryRow
                    label={tc("requestDate")}
                    value={formatRequestDateTime(
                      new Date().toISOString(),
                      locale,
                    )}
                  />
                </div>
              </div>

              <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-[16px] text-amber-800">
                {t("deductionWarning", { date: payDateLabel || "—" })}
              </div>

              {submitError && (
                <p className="rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-center text-[16px] font-medium text-[var(--color-error-text)]">
                  {submitError}
                </p>
              )}

              <button
                type="button"
                disabled={confirmDisabled}
                onClick={() => {
                  setPin("")
                  setPinError("")
                  setSubmitError("")
                  setPinModalOpen(true)
                }}
                className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tc("confirm")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setPin("")
                  setPinError("")
                  setSubmitError("")
                }}
                className="flex h-12 w-full items-center justify-center text-[16px] font-semibold text-text-secondary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                ← {t("editBack")}
              </button>
            </>
          )}
        </section>
      )}

      {pinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-4 pt-16"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-step-up-title"
        >
          <div className="w-full rounded-xl bg-white p-4 shadow-modal">
            <h2
              id="pin-step-up-title"
              className="text-[20px] font-semibold text-text-primary"
            >
              {t("pinConfirmTitle")}
            </h2>
            <p className="mt-2 text-[16px] text-text-secondary">
              {t("pinConfirmDescription")}
            </p>
            <label
              className="mt-4 block text-[16px] font-semibold text-text-primary"
              htmlFor="transaction-pin"
            >
              {t("pinStepUpLabel")}
            </label>
            <input
              id="transaction-pin"
              type="text"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                setPinError("")
                setSubmitError("")
              }}
              placeholder="000000"
              className="mt-2 w-full rounded-md border border-border bg-bg-secondary px-4 py-3 text-center font-mono text-[24px] tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {pinError && (
              <p className="mt-3 text-center text-[16px] font-medium text-[var(--color-error-text)]">
                {pinError}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPinModalOpen(false)
                  setPin("")
                  setPinError("")
                }}
                className="flex h-12 items-center justify-center rounded-md border border-border bg-white text-[16px] font-semibold text-text-secondary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                disabled={pin.length < 6 || pinLoading || createLoading}
                onClick={() => {
                  void confirmPinAndSubmit()
                }}
                className="flex h-12 items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pinLoading || createLoading ? tc("loading") : t("enterPin")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && createdRequest && (
        <section className="flex min-h-[calc(100dvh-180px)] flex-col items-center justify-center text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-10 [animation-delay:300ms]" />
            <div className="relative flex h-20 w-20 animate-pop-in items-center justify-center rounded-full bg-primary text-white shadow-hover">
              <Check className="h-10 w-10" strokeWidth={2.4} aria-hidden />
            </div>
          </div>
          <h2
            className="animate-page-fade-in fill-mode-both text-[22px] font-bold text-text-primary"
            style={{ animationDelay: "350ms" }}
          >
            {t("successTitle")}
          </h2>
          <p
            className="animate-page-fade-in fill-mode-both mt-2 text-[16px] text-text-muted"
            style={{ animationDelay: "550ms" }}
          >
            {tc("success")}
          </p>

          <div
            className="animate-page-fade-in fill-mode-both mt-6 w-full rounded-lg bg-primary-bg p-4 text-left text-[16px]"
            style={{ animationDelay: "750ms" }}
          >
            <SummaryRow
              label={t("referenceNumber")}
              value={createdRequest.id}
            />
            <SummaryRow
              label={t("requestedAmount")}
              value={formatTHB(createdRequest.requestedAmount)}
              highlight
            />
            <SummaryRow
              label={t("transferFee")}
              value={formatTHB(createdRequest.transferFee)}
            />
            <SummaryRow
              label={t("netTransferAmount")}
              value={formatTHB(createdRequest.netAmount)}
              highlight
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-text-secondary">{tc("status")}</span>
              <StatusBadge status={createdRequest.status as RequestStatus} />
            </div>
            <SummaryRow
              label={tc("requestDate")}
              value={formatRequestDateTime(createdRequest.createdAt, locale)}
            />
          </div>

          <Link
            href={withLiffLocale(pathname, "/")}
            className="animate-page-fade-in fill-mode-both mt-6 flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ animationDelay: "950ms" }}
          >
            {t("backToHome")}
          </Link>
          {isInLiff && (
            <button
              type="button"
              onClick={() => {
                void handleShare()
              }}
              className="animate-page-fade-in fill-mode-both mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-md border border-primary bg-white text-[16px] font-semibold text-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ animationDelay: "1100ms" }}
            >
              <Share2 className="h-5 w-5" aria-hidden />
              {t("shareReceipt")}
            </button>
          )}
        </section>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3 first:mt-0">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span
        className={
          highlight
            ? "text-right font-sans font-bold text-primary"
            : "text-right font-medium text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  )
}
