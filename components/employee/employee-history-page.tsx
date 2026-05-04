'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { TabBar, type TabItem } from '@/components/ui/tab-bar'
import { Link } from '@/i18n/navigation'
import { currentEmployee } from '@/lib/mock/currentUser'
import { getRequestsByEmployee } from '@/lib/mock/requests'
import { cn } from '@/lib/utils'
import { formatTHB } from '@/lib/utils/format'

const tabs: TabItem[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รออนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'disbursed', label: 'โอนแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธ' },
]

const reasonLabels: Record<string, string> = {
  medical: 'ค่ารักษาพยาบาล',
  education: 'ค่าเล่าเรียนบุตร',
  emergency: 'ค่าใช้จ่ายฉุกเฉิน',
  utility: 'ค่าใช้จ่ายในบ้าน',
  other: 'อื่นๆ',
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function EmployeeHistoryPage() {
  const [tab, setTab] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>('EWA-2025-000014')
  const requests = useMemo(
    () => getRequestsByEmployee(currentEmployee.id).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [],
  )
  const filtered = tab === 'all' ? requests : requests.filter((request) => request.status === tab)

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">ประวัติการเบิก</h1>
        <p className="mt-1 text-[16px] text-text-muted">ตรวจสอบสถานะและรายละเอียดคำขอ</p>
      </header>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2">
          <SummaryCard label="รอบนี้" value="฿5,500 · 2 รายการ" />
          <SummaryCard label="เดือนที่แล้ว" value="฿5,500 · 2 รายการ" />
          <SummaryCard label="รวมทั้งหมด" value="฿24,000 · 9 รายการ" />
        </div>
      </div>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <TabBar tabs={tabs} value={tab} onChange={setTab} className="w-max" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message="ไม่มีคำขอในสถานะนี้"
          description="ลองเปลี่ยนตัวกรอง หรือเริ่มยื่นคำขอใหม่"
          action={<Link href="/employee/request" className="rounded-md bg-primary px-4 py-2 text-[16px] font-semibold text-white">ยื่นคำขอเลย</Link>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 10).map((request) => {
            const dateParts = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short' }).format(new Date(request.requestedAt)).split(' ')
            const expanded = expandedId === request.id

            return (
              <article key={request.id} className="overflow-hidden rounded-lg border border-border bg-white shadow-card">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : request.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <div className="w-11 text-center">
                    <div className="font-sans text-[20px] font-bold leading-none text-primary">{dateParts[0]}</div>
                    <div className="mt-1 text-[13px] text-text-muted">{dateParts[1]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-text-primary">คำขอ EWA</p>
                    <p className="truncate font-mono text-[12px] text-text-muted">{request.referenceNumber}</p>
                    <p className="truncate text-[14px] text-text-muted">{reasonLabels[request.reason]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[16px] font-bold text-text-primary">{formatTHB(request.amount)}</p>
                    <StatusBadge status={request.status} size="sm" />
                  </div>
                  <ChevronDown className={cn('h-5 w-5 text-text-muted transition', expanded && 'rotate-180')} aria-hidden />
                </button>
                {expanded && (
                  <div className="border-t border-border-light bg-bg-secondary p-4 text-[16px]">
                    <DetailRow label="วันที่ขอ" value={formatDate(request.requestedAt)} />
                    <DetailRow label="วันที่อนุมัติ" value={formatDate(request.approvedAt)} />
                    <DetailRow label="อนุมัติโดย" value={request.approvedBy ?? '-'} />
                    <DetailRow label="วันที่โอน" value={formatDate(request.disbursedAt)} />
                    <DetailRow label="บัญชีที่รับ" value={currentEmployee.bankAccountMasked} />
                    <DetailRow label="หมายเหตุ HR" value={request.hrNote ?? request.employeeNote ?? '-'} />
                  </div>
                )}
              </article>
            )
          })}
          <button type="button" className="mt-3 h-11 w-full rounded-md border border-border bg-white text-[16px] font-semibold text-text-secondary">
            โหลดเพิ่ม
          </button>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] rounded-lg border border-border bg-white p-3 shadow-card">
      <p className="text-[16px] text-text-muted">{label}</p>
      <p className="mt-1 whitespace-nowrap font-sans text-[16px] font-bold text-text-primary">{value}</p>
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
