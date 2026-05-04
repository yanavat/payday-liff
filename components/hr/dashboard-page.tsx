'use client'

import { useMemo, useState } from 'react'
import { Banknote, CheckCircle2, Clock3, Users } from 'lucide-react'
import { MetricCard } from '@/components/ui/metric-card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SectionHeader } from '@/components/ui/section-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar } from '@/components/ui/avatar'
import { RequestDetailDrawer } from './request-detail-drawer'
import { employees, monthlyPayCycle, requests, weeklyPayCycle } from '@/lib/mock'
import type { EWARequest } from '@/types'
import dayjs from '@/lib/dayjs'
import { formatTHB, formatTHBCompact } from '@/lib/utils/format'

const statusSegments = [
  { status: 'approved' as const, label: 'อนุมัติ', className: 'bg-primary' },
  { status: 'pending' as const, label: 'รออนุมัติ', className: 'bg-amber-400' },
  { status: 'rejected' as const, label: 'ปฏิเสธ', className: 'bg-red-400' },
]

export function DashboardPageContent() {
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const recentRows = requests
    .slice()
    .sort((a, b) => dayjs(b.requestedAt).valueOf() - dayjs(a.requestedAt).valueOf())
    .slice(0, 5)
    .map((request) => ({ request, employee: employees.find((employee) => employee.id === request.employeeId) }))
    .filter((row): row is { request: EWARequest; employee: typeof employees[number] } => !!row.employee)
  const activeRow = recentRows.find((row) => row.request.id === activeRequestId)
  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === 'pending').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      rejected: requests.filter((request) => request.status === 'rejected').length,
      disbursed: requests.filter((request) => request.status === 'disbursed').length,
    }
  }, [])
  const disbursedAmount = requests
    .filter((request) => request.status === 'disbursed' || request.status === 'approved')
    .reduce((sum, request) => sum + request.amount, 0)
  const totalForChart = statusSegments.reduce((sum, segment) => sum + statusCounts[segment.status], 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="คำขอรออนุมัติ"
          value={String(statusCounts.pending)}
          trend={3}
          trendLabel="จากเมื่อวาน"
          icon={<Clock3 className="h-[18px] w-[18px]" />}
          variant="hero"
        />
        <MetricCard
          label="อนุมัติแล้ววันนี้"
          value={String(statusCounts.approved)}
          sub={`${formatTHBCompact(disbursedAmount)} รวม`}
          trend={8}
          trendLabel="วันนี้"
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="เบิกจ่ายเดือนนี้"
          value={formatTHBCompact(disbursedAmount)}
          sub="จาก ฿500K วงเงิน"
          icon={<Banknote className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="พนักงานลงทะเบียน"
          value={String(employees.length)}
          sub="ข้อมูลตัวอย่าง Phase 2"
          icon={<Users className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-3">
        <section className="overflow-hidden rounded-lg border border-border bg-white shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <SectionHeader
              title="คำขอ EWA ล่าสุด"
              action={
                <a href="/th/hr/requests" className="text-sm font-medium text-primary hover:text-primary-dark">
                  ดูทั้งหมด →
                </a>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="h-10 border-b border-border bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                  <th className="px-4">ชื่อพนักงาน</th>
                  <th className="px-4">แผนก</th>
                  <th className="px-4 text-right">จำนวนเงิน</th>
                  <th className="px-4">วันที่ขอ</th>
                  <th className="px-4">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map(({ request, employee }) => (
                  <tr
                    key={request.id}
                    onClick={() => setActiveRequestId(request.id)}
                    className="h-[52px] cursor-pointer border-b border-border-light transition last:border-0 hover:bg-primary-subtle"
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={employee.nameTh.slice(0, 2)} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{employee.nameTh}</div>
                          <div className="text-caption text-text-muted">{employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-text-secondary">{employee.department}</td>
                    <td className="px-4 text-right font-number text-sm font-semibold">{formatTHB(request.amount)}</td>
                    <td className="px-4 text-sm text-text-muted">{dayjs(request.requestedAt).format('DD/MM/YY')}</td>
                    <td className="px-4"><StatusBadge status={request.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-3">
          <section className="rounded-lg border border-border bg-white p-4 shadow-card">
            <h2 className="text-section-title text-text-primary">รอบปัจจุบัน</h2>
            <div className="mt-4 space-y-4">
              <CycleProgress label="รายเดือน · พ.ค. 2568" value={monthlyPayCycle.daysElapsed} max={monthlyPayCycle.totalDays} />
              <CycleProgress label="รายสัปดาห์ · สัปดาห์ที่ 19" value={weeklyPayCycle.daysElapsed} max={weeklyPayCycle.totalDays} />
            </div>
            <div className="mt-4 space-y-2 text-caption text-text-secondary">
              <DateLine label="วันตัดรอบ EWA (รายสัปดาห์)" value="พรุ่งนี้" highlight />
              <DateLine label="วันจ่ายเงิน (รายสัปดาห์)" value="ศุกร์นี้" />
              <DateLine label="วันตัดรอบ EWA (รายเดือน)" value="28 พ.ค." />
              <DateLine label="วันจ่ายเงิน (รายเดือน)" value="31 พ.ค." />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4 shadow-card">
            <h2 className="text-section-title text-text-primary">สถานะคำขอเดือนนี้</h2>
            <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[conic-gradient(#2DBD8F_0_60%,#F59E0B_60%_88%,#EF4444_88%_100%)]">
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
                <span className="font-number text-2xl font-bold">{totalForChart}</span>
                <span className="text-[11px] text-text-muted">รายการ</span>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {statusSegments.map((segment) => (
                <div key={segment.status} className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className={`h-2.5 w-2.5 rounded-full ${segment.className}`} />
                    {segment.label}
                  </span>
                  <span className="font-number font-semibold text-text-primary">{statusCounts[segment.status]}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <RequestDetailDrawer
        request={activeRow?.request ?? null}
        employee={activeRow?.employee}
        history={requests.filter((request) => request.employeeId === activeRow?.request.employeeId)}
        open={!!activeRequestId}
        confirmAction={confirmAction}
        onClose={() => {
          setActiveRequestId(null)
          setConfirmAction(null)
        }}
        onApprove={() => setConfirmAction('approve')}
        onReject={() => setConfirmAction('reject')}
        onCancelConfirm={() => setConfirmAction(null)}
        onConfirmApprove={() => setConfirmAction(null)}
        onConfirmReject={() => setConfirmAction(null)}
      />
    </div>
  )
}

function CycleProgress({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-caption">
        <span className="text-text-primary">{label}</span>
        <span className="font-number font-medium text-text-secondary">{value}/{max}</span>
      </div>
      <ProgressBar value={value} max={max} />
    </div>
  )
}

function DateLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={highlight ? 'rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700' : 'font-medium text-text-primary'}>{value}</span>
    </div>
  )
}
