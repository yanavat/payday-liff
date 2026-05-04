'use client'

import { useMemo, useState } from 'react'
import { Check, Share2, WalletCards } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PINPad } from '@/components/ui/pin-pad'
import { QuickAmountButton } from '@/components/ui/quick-amount-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { StepIndicator } from '@/components/ui/step-indicator'
import { currentEmployee } from '@/lib/mock/currentUser'
import { formatTHB } from '@/lib/utils/format'

const available = 3500
const quickAmounts = [1000, 2000, 3000]
const reasonChips = [
  { value: 'emergency', label: 'ค่าใช้จ่ายฉุกเฉิน' },
  { value: 'medical', label: 'ค่ารักษาพยาบาล' },
  { value: 'education', label: 'ค่าเล่าเรียนบุตร' },
  { value: 'utility', label: 'ค่าใช้จ่ายในบ้าน' },
  { value: 'other', label: 'อื่นๆ' },
]

export function EmployeeRequestPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState(3000)
  const [reason, setReason] = useState('medical')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const amountValid = amount > 0 && amount <= available
  const remaining = Math.max(available - amount, 0)
  const reasonLabel = useMemo(() => reasonChips.find((item) => item.value === reason)?.label ?? 'ไม่ระบุ', [reason])

  function confirmRequest() {
    if (pin.length < 4) return
    if (pin !== '1234') {
      setPin('')
      setPinError('PIN ไม่ถูกต้อง')
      return
    }
    setStep(3)
  }

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">ยื่นคำขอเบิก</h1>
        <p className="mt-1 text-[16px] text-text-muted">ทำรายการได้ภายในไม่กี่ขั้นตอน</p>
      </header>

      <StepIndicator steps={['เลือกจำนวน', 'ยืนยัน', 'เสร็จสิ้น']} currentStep={step} className="mb-4" />

      {step === 1 && (
        <section className="space-y-4">
          <div className="rounded-xl bg-primary-bg p-4">
            <p className="text-[16px] text-text-secondary">เบิกได้สูงสุดวันนี้</p>
            <p className="mt-1 font-sans text-[28px] font-bold leading-tight text-primary">{formatTHB(available)}</p>
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-semibold text-text-primary">เลือกจำนวนด่วน</label>
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
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-semibold text-text-primary" htmlFor="custom-amount">
              หรือพิมพ์จำนวนเอง
            </label>
            <div className="flex h-14 items-center rounded-md border border-border bg-white px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="mr-2 text-[18px] font-semibold text-text-muted">฿</span>
              <input
                id="custom-amount"
                type="number"
                inputMode="numeric"
                value={amount || ''}
                onChange={(event) => setAmount(Number(event.target.value))}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent font-sans text-[20px] font-semibold outline-none"
              />
            </div>
            <p className={amountValid ? 'mt-2 text-[16px] text-text-muted' : 'mt-2 text-[16px] font-medium text-red-600'}>
              {amountValid ? `คงเหลือเบิกได้: ${formatTHB(remaining)}` : `เกินวงเงิน กรุณาใส่ไม่เกิน ${formatTHB(available)}`}
            </p>
          </div>

          <div>
            <div className="mb-2 text-[16px] font-semibold text-text-primary">เหตุผล (ไม่บังคับ)</div>
            <div className="flex flex-wrap gap-2">
              {reasonChips.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
                  className={reason === item.value
                    ? 'rounded-full bg-primary px-3 py-2 text-[16px] font-medium text-white'
                    : 'rounded-full border border-border bg-white px-3 py-2 text-[16px] font-medium text-text-secondary'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!amountValid}
            onClick={() => setStep(2)}
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            ถัดไป →
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-white shadow-card">
            <div className="border-b border-border-light p-4 text-[16px] font-semibold text-text-primary">สรุปคำขอเบิก EWA</div>
            <div className="space-y-3 p-4 text-[16px]">
              <SummaryRow label="ชื่อพนักงาน" value={currentEmployee.nameTh} />
              <SummaryRow label="รหัสพนักงาน" value={currentEmployee.id} />
              <SummaryRow label="จำนวนที่ขอ" value={formatTHB(amount)} highlight />
              <SummaryRow label="เหตุผล" value={reasonLabel} />
              <SummaryRow label="บัญชีรับเงิน" value={currentEmployee.bankAccountMasked} />
              <SummaryRow label="ประมาณวันโอน" value="ภายใน 1 วันทำการ" />
            </div>
          </div>

          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-[16px] text-amber-800">
            จำนวน {formatTHB(amount)} จะถูกหักออกจากเงินเดือนวันที่ 31 พ.ค. 2568
          </div>

          <div className="rounded-lg border border-border bg-white p-4 shadow-card">
            <div className="mb-4 text-center text-[16px] font-semibold text-text-primary">ยืนยันตัวตนด้วย PIN 4 หลัก</div>
            {pinError && <p className="mb-3 text-center text-[16px] font-medium text-red-600">{pinError}</p>}
            <PINPad value={pin} onChange={(value) => { setPin(value); setPinError('') }} onComplete={setPin} />
          </div>

          <button
            type="button"
            disabled={pin.length < 4}
            onClick={confirmRequest}
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            ยืนยันการขอเบิก
          </button>
          <button type="button" onClick={() => setStep(1)} className="h-12 w-full text-[16px] font-semibold text-text-secondary">
            ← แก้ไข
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="flex min-h-[calc(100dvh-180px)] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-20 w-20 animate-fade-in items-center justify-center rounded-full bg-primary text-white shadow-hover">
            <Check className="h-10 w-10" strokeWidth={2.4} aria-hidden />
          </div>
          <h2 className="text-[22px] font-bold text-text-primary">ส่งคำขอสำเร็จ!</h2>
          <p className="mt-2 text-[16px] text-text-muted">HR จะตรวจสอบและแจ้งผลภายใน 2 ชั่วโมง</p>

          <div className="mt-6 w-full rounded-lg bg-primary-bg p-4 text-left text-[16px]">
            <SummaryRow label="เลขที่อ้างอิง" value="EWA-20250501-041" />
            <SummaryRow label="จำนวน" value={formatTHB(amount)} highlight />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-text-secondary">สถานะ</span>
              <StatusBadge status="pending" />
            </div>
            <SummaryRow label="วันที่" value="01/05/2568 · 09:32 น." />
          </div>

          <Link href="/employee/home" className="mt-6 flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-card">
            กลับหน้าหลัก
          </Link>
          <button type="button" className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-md border border-primary bg-white text-[16px] font-semibold text-primary">
            <Share2 className="h-5 w-5" aria-hidden />
            แชร์ใบรับคำขอ
          </button>
        </section>
      )}
    </div>
  )
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3 first:mt-0">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span className={highlight ? 'text-right font-sans font-bold text-primary' : 'text-right font-medium text-text-primary'}>{value}</span>
    </div>
  )
}
