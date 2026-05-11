'use client'

import { AlertTriangle, WalletCards } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useLiffProfile } from '@/components/liff-auth-gate'
import { ProgressBar } from '@/components/ui/progress-bar'
import { currentEmployee } from '@/lib/mock/currentUser'
import { payCycles } from '@/lib/mock/payrollCycles'
import { getRequestsByEmployee } from '@/lib/mock/requests'
import { formatTHB } from '@/lib/utils/format'
import type { EWAStatus } from '@/types'

const earnedWage = 9200
const maxAllowed = 4600
const previousAdvance = 1100
const available = maxAllowed - previousAdvance

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

const statusLabels: Record<EWAStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  disbursed: 'โอนแล้ว',
}

const statusClasses: Record<EWAStatus, string> = {
  pending: 'bg-status-pending-bg text-status-pending-text',
  approved: 'bg-status-approved-bg text-status-approved-text',
  rejected: 'bg-status-rejected-bg text-status-rejected-text',
  disbursed: 'bg-status-disbursed-bg text-status-disbursed-text',
}

export function LiffHomePage() {
  const profile = useLiffProfile()
  const cycle = payCycles[currentEmployee.payCycle]
  const recentRequests = getRequestsByEmployee(currentEmployee.id)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .slice(0, 3)

  return (
    <div className="bg-bg-page pb-5">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-text-primary">
            สวัสดี, {currentEmployee.nameTh}
          </h1>
          <p className="mt-1 text-[16px] text-text-muted">
            {new Intl.DateTimeFormat('th-TH', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </p>
        </div>
        <Link
          aria-label="โปรไฟล์"
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-bg transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          href="/profile"
        >
          {profile?.pictureUrl ? (
            <Image
              alt={profile.displayName}
              className="h-full w-full object-cover"
              height={48}
              src={profile.pictureUrl}
              unoptimized
              width={48}
            />
          ) : (
            <span className="text-sm font-semibold text-primary-dark">
              {currentEmployee.nameTh.slice(0, 2)}
            </span>
          )}
        </Link>
      </header>

      <section className="mx-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
        <p className="text-[16px] text-white/80">วงเงินที่เบิกได้</p>
        <div className="mt-1 font-sans text-[36px] font-bold leading-tight">{formatTHB(available)}</div>
        <div className="my-4 h-px bg-white/20" />
        <div className="grid grid-cols-2 gap-3 text-[16px]">
          <div>
            <p className="text-white/70">รายได้สะสม</p>
            <p className="font-semibold">{formatTHB(earnedWage)}</p>
          </div>
          <div>
            <p className="text-white/70">เบิกได้สูงสุด</p>
            <p className="font-semibold">{formatTHB(maxAllowed)}</p>
          </div>
          <div>
            <p className="text-white/70">เบิกไปแล้ว</p>
            <p className="font-semibold">{formatTHB(previousAdvance)}</p>
          </div>
          <div>
            <p className="text-white/70">คงเหลือ</p>
            <p className="font-semibold">{formatTHB(available)}</p>
          </div>
        </div>
        <Link
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-[16px] font-semibold text-primary"
          href="/request"
        >
          <WalletCards className="h-5 w-5" aria-hidden />
          ยื่นคำขอเบิกเงิน
        </Link>
      </section>

      <section className="mx-4 mt-4 rounded-lg border border-border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">รอบการจ่ายเงิน</h2>
          <span className="text-[16px] font-medium text-primary">จ่ายเงินในอีก 17 วัน</span>
        </div>
        <ProgressBar value={cycle.daysElapsed} max={cycle.totalDays} height="8px" />
        <div className="mt-2 flex items-center justify-between text-[16px] text-text-muted">
          <span>
            Day {cycle.daysElapsed} / {cycle.totalDays}
          </span>
          <span>ปิดรับคำขอในอีก 17 วัน</span>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[16px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>ปิดรับคำขอในอีก 24 วัน</span>
        </div>
      </section>

      <section className="mx-4 mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">คำขอล่าสุด</h2>
          <Link className="flex items-center text-[16px] font-medium text-primary" href="/history">
            ดูประวัติทั้งหมด
          </Link>
        </div>
        <div className="space-y-2">
          {recentRequests.map((request) => {
            const [day, month] = formatRequestDate(request.requestedAt).split(' ')

            return (
              <Link
                className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-card transition-shadow duration-200 hover:shadow-hover"
                href={`/history?id=${request.id}`}
                key={request.id}
              >
                <div className="w-11 text-center">
                  <div className="font-sans text-[20px] font-bold leading-none text-primary">{day}</div>
                  <div className="mt-1 text-[16px] text-text-muted">{month}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium text-text-primary">คำขอเบิกเงิน</p>
                  <p className="truncate font-mono text-[14px] text-text-muted">{request.referenceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[16px] font-bold text-text-primary">{formatTHB(request.amount)}</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
