'use client'

import { useMemo, useState, useEffect } from 'react'
import { Check, Share2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { QuickAmountButton } from '@/components/ui/quick-amount-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { StepIndicator } from '@/components/ui/step-indicator'
import { currentEmployee } from '@/lib/mock/currentUser'
import { formatTHB } from '@/lib/utils/format'
import { DEFAULT_TRANSFER_FEE_THB, getNetTransferAmount } from '@/lib/utils/fees'
import { loadLiffClient } from '@/lib/liff-client'
import { withLiffLocale } from '@/lib/liff-routes'

const available = 3500
const quickAmounts = [1000, 2000, 3000]
const reasonChips = [
  { value: 'emergency' },
  { value: 'medical' },
  { value: 'education' },
  { value: 'utility' },
  { value: 'other' },
]

export function LiffRequestPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState(3000)
  const [reason, setReason] = useState('medical')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isInClient, setIsInClient] = useState(false)

  const amountValid = amount > 0 && amount <= available
  const remaining = Math.max(available - amount, 0)
  const transferFee = DEFAULT_TRANSFER_FEE_THB
  const netTransferAmount = getNetTransferAmount(amount, transferFee)
  const t = useTranslations('requestWizard')
  const tc = useTranslations('common')
  const pathname = usePathname()

  const reasonLabel = useMemo(
    () => t(`reasons.${reason}`),
    [reason, t],
  )

  useEffect(() => {
    let cancelled = false
    loadLiffClient().then((liff) => {
      if (!cancelled) setIsInClient(liff.isInClient())
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (step !== 3) return
    let cancelled = false
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      const shoot = (origin: { x: number; y: number }) =>
        confetti({
          particleCount: 80,
          spread: 70,
          origin,
          colors: ['#2dbd8f', '#a8e6cf', '#ffffff', '#ffd700', '#ff6b6b'],
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
    return () => { cancelled = true }
  }, [step])

  function confirmRequest() {
    if (otp !== '000000') {
      setOtp('')
      setOtpError(t('invalidOtp'))
      return
    }
    setStep(3)
  }

  async function handleShare() {
    const liff = await loadLiffClient()
    if (!liff.isInClient()) return
    await liff.shareTargetPicker([
      {
        type: 'text',
        text: t('shareReceiptText', {
          amount: formatTHB(amount),
          reference: 'EWA-20250501-041',
        }),
      },
    ])
  }

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">
          {t('step1')}
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">{tc('next')}</p>
      </header>

      <StepIndicator
        steps={[t('step1'), t('step2'), t('step3')]}
        currentStep={step}
        className="mb-4"
      />

      {step === 1 && (
        <section className="space-y-4">
          <div className="rounded-xl bg-primary-bg p-4">
            <p className="text-[16px] text-text-secondary">{t('availableBalance')}</p>
            <p className="mt-1 font-sans text-[28px] font-bold leading-tight text-primary">
              {formatTHB(available)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-semibold text-text-primary">
              {t('customAmount')}
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
              className={
                amount === available
                  ? 'mt-4 rounded-md bg-primary-bg px-3 py-1.5 text-[14px] font-medium text-primary border border-primary-light'
                  : 'mt-4 rounded-md bg-bg-secondary px-3 py-1.5 text-[14px] font-medium text-text-muted hover:text-text-secondary'
              }
            >
              {t('withdrawAll')} · {formatTHB(available)}
            </button>
          </div>

          <div>
            <label
              className="mb-2 block text-[16px] font-semibold text-text-primary"
              htmlFor="custom-amount"
            >
              {t('customAmount')}
            </label>
            <div className="flex h-14 items-center rounded-md border border-border bg-white px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="mr-2 text-[18px] font-semibold text-text-muted">THB</span>
              <input
                id="custom-amount"
                type="number"
                inputMode="numeric"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent font-sans text-[20px] font-semibold outline-none"
              />
            </div>
            <p className={amountValid ? 'mt-2 text-[16px] text-text-muted' : 'mt-2 text-[16px] font-medium text-red-600'}>
              {amountValid ? `${t('remainingBalance')}: ${formatTHB(remaining)}` : t('amountError')}
            </p>
          </div>

          <div>
            <div className="mb-2 text-[16px] font-semibold text-text-primary">{t('reason')}</div>
            <div className="flex flex-wrap gap-2">
              {reasonChips.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
                  className={
                    reason === item.value
                      ? 'rounded-full bg-primary-bg px-3 py-2 text-[16px] font-medium text-primary border border-primary'
                      : 'rounded-full border border-border bg-white px-3 py-2 text-[16px] font-medium text-text-secondary'
                  }
                >
                  {t(`reasons.${item.value}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!amountValid}
            onClick={() => setStep(2)}
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tc('next')} →
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-white shadow-card">
            <div className="border-b border-border-light p-4 text-[16px] font-semibold text-text-primary">
              {t('summaryCard')}
            </div>
            <div className="space-y-3 p-4 text-[16px]">
              <SummaryRow label={tc('employeeName')} value={currentEmployee.nameTh} />
              <SummaryRow label={tc('employeeId')} value={currentEmployee.id} />
              <SummaryRow label={t('requestedAmount')} value={formatTHB(amount)} highlight />
              <SummaryRow label={t('transferFee')} value={formatTHB(transferFee)} />
              <SummaryRow label={t('netTransferAmount')} value={formatTHB(netTransferAmount)} highlight />
              <SummaryRow label={t('reason')} value={reasonLabel} />
              <SummaryRow label={t('bankAccount')} value={currentEmployee.bankAccountMasked} />
              <SummaryRow label={tc('requestDate')} value="1 day" />
            </div>
          </div>

          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-[16px] text-amber-800">
            {t('deductionWarning', { date: '31/05/2025' })}
          </div>

          <div className="rounded-lg border border-border bg-white p-4 shadow-card">
            <div className="mb-4 text-center text-[16px] font-semibold text-text-primary">
              {t('otpLabel')}
            </div>
            {otpError && (
              <p className="mb-3 text-center text-[16px] font-medium text-red-600">{otpError}</p>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setOtpError('')
              }}
              placeholder="000000"
              className="w-full rounded-md border border-border bg-bg-secondary px-4 py-3 text-center font-mono text-[24px] tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-center text-[14px] text-text-muted">{t('otpHint')}</p>
          </div>

          <button
            type="button"
            disabled={otp.length < 6}
            onClick={confirmRequest}
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tc('confirm')}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex h-12 w-full items-center justify-center text-[16px] font-semibold text-text-secondary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            ← {t('editBack')}
          </button>
        </section>
      )}

      {step === 3 && (
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
            style={{ animationDelay: '350ms' }}
          >
            {t('successTitle')}
          </h2>
          <p
            className="animate-page-fade-in fill-mode-both mt-2 text-[16px] text-text-muted"
            style={{ animationDelay: '550ms' }}
          >
            {tc('success')}
          </p>

          <div
            className="animate-page-fade-in fill-mode-both mt-6 w-full rounded-lg bg-primary-bg p-4 text-left text-[16px]"
            style={{ animationDelay: '750ms' }}
          >
            <SummaryRow label={t('referenceNumber')} value="EWA-20250501-041" />
            <SummaryRow label={t('requestedAmount')} value={formatTHB(amount)} highlight />
            <SummaryRow label={t('transferFee')} value={formatTHB(transferFee)} />
            <SummaryRow label={t('netTransferAmount')} value={formatTHB(netTransferAmount)} highlight />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-text-secondary">{tc('status')}</span>
              <StatusBadge status="pending" />
            </div>
            <SummaryRow label={tc('requestDate')} value="01/05/2568 · 09:32" />
          </div>

          <Link
            href={withLiffLocale(pathname, '/')}
            className="animate-page-fade-in fill-mode-both mt-6 flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ animationDelay: '950ms' }}
          >
            {t('backToHome')}
          </Link>
          {isInClient && (
            <button
              type="button"
              onClick={handleShare}
              className="animate-page-fade-in fill-mode-both mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-md border border-primary bg-white text-[16px] font-semibold text-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ animationDelay: '1100ms' }}
            >
              <Share2 className="h-5 w-5" aria-hidden />
              {t('shareReceipt')}
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
      <span className={highlight ? 'text-right font-sans font-bold text-primary' : 'text-right font-medium text-text-primary'}>
        {value}
      </span>
    </div>
  )
}
