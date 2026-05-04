'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, CheckCircle2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Avatar } from '@/components/ui/avatar'
import { PayCycleBadge } from '@/components/ui/pay-cycle-badge'
import { QuickAmountButton } from '@/components/ui/quick-amount-button'
import { useToast } from '@/components/ui/toast'
import { employees, hrUser } from '@/lib/mock'
import { formatTHB } from '@/lib/utils/format'
import { generateRefNumber } from '@/lib/utils/format'
import type { Employee, EWAReason } from '@/types'
import { cn } from '@/lib/utils'

const reasonOptions: Array<{ value: EWAReason; label: string }> = [
  { value: 'emergency', label: 'ค่าใช้จ่ายฉุกเฉิน' },
  { value: 'medical', label: 'ค่ารักษาพยาบาล' },
  { value: 'education', label: 'ค่าเล่าเรียนบุตร' },
  { value: 'utility', label: 'ค่าใช้จ่ายในบ้าน' },
  { value: 'other', label: 'อื่นๆ' },
]

export function OnBehalfRequestPage({ employeeId }: { employeeId: string }) {
  const employee = employees.find((item) => item.id === employeeId)

  if (!employee) {
    return (
      <div className="max-w-[640px]">
        <h1 className="text-[22px] font-semibold">ไม่พบพนักงาน</h1>
        <Link href="/hr/employees" className="mt-4 inline-flex text-primary">กลับรายชื่อพนักงาน</Link>
      </div>
    )
  }

  return <OnBehalfForm employee={employee} />
}

function OnBehalfForm({ employee }: { employee: Employee }) {
  const { toast } = useToast()
  const [amount, setAmount] = useState(1000)
  const [reason, setReason] = useState<EWAReason>('emergency')
  const [hrNote, setHrNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const maxAmount = employee.payCycle === 'monthly' ? Math.round(employee.baseSalary * 0.25) : Math.round(employee.baseSalary * 0.5)
  const earned = employee.payCycle === 'monthly' ? Math.round(employee.baseSalary * 0.5) : employee.baseSalary
  const overLimit = amount > maxAmount
  const canSubmit = employee.ewaStatus === 'eligible' && !overLimit && amount >= 500 && hrNote.trim().length >= 10
  const ref = useMemo(() => generateRefNumber(new Date('2025-05-14T09:00:00')), [])

  if (submitted) {
    return (
      <div className="mx-auto max-w-[640px] space-y-4">
        <section className="rounded-xl border border-border bg-bg-canvas p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-[22px] font-semibold text-text-primary">ส่งคำขอสำเร็จ</h1>
          <p className="mt-1 text-sm text-text-secondary">HR จะตรวจสอบและดำเนินการอนุมัติต่อไป</p>
          <div className="mx-auto mt-6 max-w-sm rounded-lg bg-bg-secondary p-4 text-left text-sm">
            <Info label="เลขอ้างอิง" value={ref} />
            <Info label="จำนวน" value={formatTHB(amount)} />
            <Info label="พนักงาน" value={employee.nameTh} />
            <Info label="ยื่นโดย HR" value={hrUser.name} />
            <Info label="Audit Log #" value="5821" />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/hr/employees" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">กลับรายชื่อพนักงาน</Link>
            <Link href="/hr/employees" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">ยื่นคำขอสำหรับพนักงานคนอื่น</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">ยื่นคำขอแทนพนักงาน</h1>
        <p className="mt-1 text-[13px] text-text-secondary">หน้าหลัก / พนักงาน / ยื่นคำขอแทน</p>
      </header>

      <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>HR กำลังยื่นคำขอแทนพนักงาน — รายการนี้จะบันทึกชื่อ HR ใน Audit Log</span>
      </div>

      <section className="rounded-xl border border-border bg-bg-canvas p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar initials={employee.nameTh.slice(0, 2)} size="md" />
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">{employee.nameTh}</h2>
            <p className="text-caption text-text-muted">{employee.id} · {employee.department}</p>
          </div>
          <PayCycleBadge type={employee.payCycle} />
        </div>
        <div className="mt-5 rounded-xl bg-primary p-5 text-white">
          <p className="text-sm text-white/80">เบิกได้สูงสุดวันนี้</p>
          <p className="font-number text-4xl font-bold">{formatTHB(maxAmount)}</p>
          <p className="mt-1 text-sm text-white/80">50% ของ {formatTHB(earned)} รายได้สะสม</p>
        </div>
      </section>

      {employee.ewaStatus !== 'eligible' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          พนักงานไม่มีสิทธิ์เบิกในขณะนี้
        </div>
      )}

      <section className="space-y-5 rounded-xl border border-border bg-bg-canvas p-5 shadow-card">
        <div>
          <h2 className="text-section-title text-text-primary">จำนวนเงินที่ขอเบิก</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[1000, 2000, 3000].map((quickAmount) => (
              <QuickAmountButton key={quickAmount} amount={quickAmount} selected={amount === quickAmount} disabled={quickAmount > maxAmount} onClick={setAmount} />
            ))}
          </div>
          <label className="mt-4 block">
            <span className="text-label text-text-muted">หรือระบุจำนวนเอง</span>
            <div className={cn('mt-2 flex h-11 items-center rounded-md border bg-bg-secondary px-3', overLimit ? 'border-red-400' : 'border-border')}>
              <span className="text-text-muted">฿</span>
              <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent px-2 font-number outline-none" />
            </div>
            {overLimit ? <p className="mt-1 text-caption text-red-600">เกินวงเงินที่เบิกได้</p> : <p className="mt-1 text-caption text-text-muted">คงเหลือ: {formatTHB(maxAmount - amount)}</p>}
          </label>
        </div>

        <div>
          <h2 className="text-section-title text-text-primary">เหตุผลของพนักงาน</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasonOptions.map((option) => (
              <button key={option.value} onClick={() => setReason(option.value)} className={cn('rounded-full border px-3 py-1 text-sm', reason === option.value ? 'border-primary bg-primary-subtle text-primary-dark' : 'border-border text-text-secondary')}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-label text-text-muted">เหตุผลที่ HR ยื่นคำขอแทนพนักงาน</span>
          <textarea value={hrNote} onChange={(event) => setHrNote(event.target.value)} rows={3} placeholder="เช่น พนักงานไม่มีโทรศัพท์ / ขอด้วยวาจา / อื่นๆ" className="mt-2 w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {hrNote && hrNote.trim().length < 10 && <p className="mt-1 text-caption text-red-600">กรุณาระบุอย่างน้อย 10 ตัวอักษร</p>}
        </label>

        <div className="flex gap-3 rounded-md bg-bg-secondary p-4">
          <Building2 className="h-5 w-5 text-text-muted" />
          <div>
            <p className="text-sm font-medium">โอนเงินเข้า: {employee.bankAccountMasked}</p>
            <p className="text-caption text-text-muted">แจ้ง HR ฝ่ายบุคคลหากต้องการเปลี่ยนบัญชี</p>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => {
            setSubmitted(true)
            toast({ variant: 'success', message: 'ส่งคำขอแทนพนักงานสำเร็จ' })
          }}
          className="h-12 w-full rounded-md bg-primary text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ยืนยันและส่งคำขอ (ไม่ต้องใช้ PIN พนักงาน)
        </button>
        <Link href="/hr/employees" className="flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-text-secondary hover:bg-bg-secondary">
          ← ยกเลิก กลับรายชื่อพนักงาน
        </Link>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  )
}
