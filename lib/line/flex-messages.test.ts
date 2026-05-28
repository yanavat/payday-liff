import { describe, it, expect } from 'vitest'
import {
  approvedFlexMessage,
  rejectedFlexMessage,
  disbursedFlexMessage,
  paydayReminderFlexMessage,
  cutoffWarningFlexMessage,
  monthlySummaryFlexMessage,
} from './flex-messages'
import type { EWARequest, Employee, PayCycleInfo } from '@/lib/api'

const mockRequest: EWARequest = {
  id: 'EWA-2025-000001',
  employeeId: 'EMP-0001',
  amount: 3000,
  transferFee: 15,
  netTransferAmount: 2985,
  reason: 'medical',
  status: 'approved',
  requestedAt: '2025-05-14T09:00:00',
  payCycle: 'monthly',
  isOnBehalf: false,
  referenceNumber: 'REF-20250514-001',
}

const mockEmployee: Employee = {
  id: 'EMP-0001',
  name: 'Somchai Jaidee',
  nameTh: 'สมชาย ใจดี',
  department: 'ไลน์ผลิต A',
  position: 'พนักงานสายการผลิต',
  payCycle: 'monthly',
  workType: 'onsite',
  baseSalary: 15000,
  bankAccountMasked: 'กสิกรไทย xxx-x-xx891-2',
  bankName: 'KBANK',
  ewaStatus: 'eligible',
  enrolledAt: '2024-01-15',
}

const mockPayCycle: PayCycleInfo = {
  type: 'monthly',
  periodStart: '2025-05-01',
  periodEnd: '2025-05-31',
  paydayDate: '2025-05-31',
  cutoffDate: '2025-05-25',
  daysElapsed: 14,
  totalDays: 31,
}

describe('flex-messages', () => {
  it('approvedFlexMessage returns a flex bubble', () => {
    const msg = approvedFlexMessage(mockRequest, mockEmployee, 'th', 'https://liff.line.me/123')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('คำขอได้รับการอนุมัติ') })
    const content = msg as Record<string, unknown>
    const bubble = content.contents as Record<string, unknown>
    expect(bubble.type).toBe('bubble')
  })

  it('rejectedFlexMessage returns a flex bubble with red header', () => {
    const msg = rejectedFlexMessage(mockRequest, mockEmployee, 'th', 'https://liff.line.me/123')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('คำขอถูกปฏิเสธ') })
  })

  it('disbursedFlexMessage returns a flex bubble', () => {
    const msg = disbursedFlexMessage(mockRequest, mockEmployee, 'th', 'https://liff.line.me/123')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('โอนเงินเสร็จสิ้น') })
  })

  it('paydayReminderFlexMessage returns a flex bubble', () => {
    const msg = paydayReminderFlexMessage(mockPayCycle, mockEmployee, 'th')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('แจ้งเตือนวันจ่ายเงิน') })
  })

  it('cutoffWarningFlexMessage returns a flex bubble with amber header', () => {
    const msg = cutoffWarningFlexMessage(mockPayCycle, mockEmployee, 'th')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('ใกล้ถึงวันปิดรับคำขอ') })
  })

  it('monthlySummaryFlexMessage returns a flex bubble', () => {
    const msg = monthlySummaryFlexMessage('May 2025', 15000, 3000, 12000, 1, mockEmployee, 'th')
    expect(msg).toMatchObject({ type: 'flex', altText: expect.stringContaining('สรุปรายเดือน') })
  })

  it('supports English locale', () => {
    const msg = approvedFlexMessage(mockRequest, mockEmployee, 'en', 'https://liff.line.me/123')
    const contents = (msg as Record<string, unknown>).contents as Record<string, unknown>
    const header = contents.header as Record<string, unknown>
    const contentsArr = header.contents as Array<Record<string, unknown>>
    const textBox = contentsArr[1] as Record<string, unknown>
    const texts = textBox.contents as Array<Record<string, unknown>>
    expect(texts[0]).toMatchObject({ text: 'Request Approved' })
  })
})
