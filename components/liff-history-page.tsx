'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { TabBar, type TabItem } from '@/components/ui/tab-bar'
import { useAuth } from '@/components/liff-auth-gate'
import { getAuthEmployeeId } from '@/lib/auth/get-auth-employee-id'
import { useEmployee } from '@/lib/api/hooks/use-employees'
import { useEWARequests } from '@/lib/api/hooks/use-ewa-requests'
import { withLiffLocale } from '@/lib/liff-routes'
import { cn } from '@/lib/utils'
import { formatTHB } from '@/lib/utils/format'
import type { EWARequestDto } from '@/lib/api/types'

const dateLocales: Record<string, string> = {
  th: 'th-TH',
  en: 'en-US',
  my: 'my-MM',
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(dateLocales[locale] ?? 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getRequestAmount(request: EWARequestDto) {
  return request.requestedAmount ?? request.amount
}

function getNetTransferAmount(request: EWARequestDto) {
  return request.netTransferAmount ?? request.netAmount
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function summarizeRequests(requests: EWARequestDto[]) {
  const now = new Date()
  const thisMonthKey = getMonthKey(now)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = getMonthKey(lastMonthDate)

  return requests.reduce(
    (summary, request) => {
      const amount = getRequestAmount(request)
      const requestMonthKey = getMonthKey(new Date(request.requestedAt))

      summary.total.amount += amount
      summary.total.count += 1

      if (requestMonthKey === thisMonthKey) {
        summary.thisMonth.amount += amount
        summary.thisMonth.count += 1
      }

      if (requestMonthKey === lastMonthKey) {
        summary.lastMonth.amount += amount
        summary.lastMonth.count += 1
      }

      return summary
    },
    {
      thisMonth: { amount: 0, count: 0 },
      lastMonth: { amount: 0, count: 0 },
      total: { amount: 0, count: 0 },
    },
  )
}

export function LiffHistoryPage() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const deepLinkId = searchParams.get('id')
  const { employee: authEmployee } = useAuth()
  const employeeId = getAuthEmployeeId(authEmployee)
  const { data: employee } = useEmployee(employeeId)
  const {
    data: requestsData,
    loading,
    error,
  } = useEWARequests({ employeeId, limit: 10 })

  const tabs: TabItem[] = [
    { value: 'all', label: t('status.all') },
    { value: 'pending', label: t('status.pending') },
    { value: 'approved', label: t('status.approved') },
    { value: 'disbursed', label: t('status.disbursed') },
    { value: 'rejected', label: t('status.rejected') },
  ]

  const [tab, setTab] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const requests = useMemo(
    () =>
      (requestsData?.data ?? []).slice().sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [requestsData],
  )

  useEffect(() => {
    let cancelled = false
    if (deepLinkId !== null && requests.some((r) => r.id === deepLinkId)) {
      if (!cancelled) setExpandedId(deepLinkId)
    }
    return () => { cancelled = true }
  }, [deepLinkId, requests])

  const filtered =
    tab === 'all' ? requests : requests.filter((r) => r.status === tab)
  const summary = summarizeRequests(requests)

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">
          {t('history.title')}
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">{t('history.total')}</p>
      </header>

      <div className="mb-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
        <div className="flex divide-x divide-border">
          <SummaryCell
            label={t('history.thisMonth')}
            value={formatTHB(summary.thisMonth.amount)}
            sub={t('history.requestCount', { count: summary.thisMonth.count })}
          />
          <SummaryCell
            label={t('history.lastMonth')}
            value={formatTHB(summary.lastMonth.amount)}
            sub={t('history.requestCount', { count: summary.lastMonth.count })}
          />
          <SummaryCell
            label={t('history.total')}
            value={formatTHB(summary.total.amount)}
            sub={t('history.requestCount', { count: summary.total.count })}
          />
        </div>
      </div>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <TabBar
          tabs={tabs}
          value={tab}
          onChange={setTab}
          className="w-max"
          variant="pill"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg border border-border bg-white shadow-card"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          message={t('common.error')}
          description={error.message}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={t('common.noData')}
          description={t('home.requestCta')}
          action={
            <Link
              href={withLiffLocale(pathname, '/request')}
              className="rounded-md bg-primary px-4 py-2 text-[16px] font-semibold text-white"
            >
              {t('requestWizard.step1')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 10).map((request) => {
            const dateParts = new Intl.DateTimeFormat(dateLocales[locale] ?? 'en-US', {
              day: '2-digit',
              month: 'short',
            })
              .format(new Date(request.requestedAt))
              .split(' ')
            const expanded = expandedId === request.id

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-lg border border-border bg-white shadow-card"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : request.id)}
                  className="flex h-20 w-full items-center gap-3 p-3 text-left"
                >
                  <div className="w-11 text-center">
                    <div className="font-sans text-[20px] font-bold leading-none text-primary">
                      {dateParts[0]}
                    </div>
                    <div className="mt-1 text-[12px] text-text-muted">
                      {dateParts[1]}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-text-primary">
                      {t('requests.title')}
                    </p>
                    <p className="truncate font-mono text-[12px] text-text-muted">
                      {request.referenceNumber}
                    </p>
                    <p className="truncate text-[12px] font-bold text-text-muted">
                      {t(`requestWizard.reasons.${request.reason}`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[16px] font-bold text-text-primary">
                      {formatTHB(getRequestAmount(request))}
                    </p>
                    <StatusBadge status={request.status} size="sm" />
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-text-muted transition',
                      expanded && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>
                {expanded && (
                  <div className="border-t border-border-light bg-bg-secondary p-4 text-[16px]">
                    <DetailRow
                      label={t('history.requestedDate')}
                      value={formatDate(request.requestedAt, locale)}
                    />
                    <DetailRow
                      label={t('history.approvedDate')}
                      value={formatDate(request.approvedAt, locale)}
                    />
                    <DetailRow
                      label={t('history.approvedBy')}
                      value={request.approvedBy ?? '-'}
                    />
                    <DetailRow
                      label={t('history.transferDate')}
                      value={formatDate(request.disbursedAt, locale)}
                    />
                    <DetailRow
                      label={t('profile.bankAccount')}
                      value={employee?.bankAccountMasked ?? '-'}
                    />
                    <DetailRow
                      label={t('history.transferFee')}
                      value={formatTHB(request.transferFee)}
                    />
                    <DetailRow
                      label={t('history.netTransferAmount')}
                      value={formatTHB(getNetTransferAmount(request))}
                    />
                    <DetailRow
                      label={t('requestDetail.hrNote')}
                      value={request.hrNote ?? request.employeeNote ?? '-'}
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCell({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-2 py-3 text-center">
      <p className="text-[12px] leading-tight text-text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-sans text-[15px] font-bold leading-tight text-primary-text">
        {value}
      </p>
      <p className="text-[12px] text-text-muted-foreground">{sub}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between gap-3 last:mb-0">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  )
}
