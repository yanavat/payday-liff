import type { DailyDisbursement, DepartmentReport, ReconciliationItem } from '@/types'

// 30 days of daily disbursement data for May 2025
export const dailyDisbursements: DailyDisbursement[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  const isWeekend = [4, 5, 11, 12, 18, 19, 25, 26].includes(day)
  return {
    date: `2025-05-${String(day).padStart(2, '0')}`,
    amount: isWeekend ? 0 : Math.floor(Math.random() * 40000 + 10000),
    count: isWeekend ? 0 : Math.floor(Math.random() * 12 + 3),
  }
})

// 52 weeks of weekly disbursement data
export const weeklyDisbursements = Array.from({ length: 52 }, (_, i) => ({
  week: `W${i + 1}`,
  amount: Math.floor(Math.random() * 80000 + 20000),
  count: Math.floor(Math.random() * 25 + 5),
}))

export const departmentReports: DepartmentReport[] = [
  { department: 'ไลน์ผลิต A', totalRequests: 45, totalAmount: 120000, approvedCount: 38, rejectedCount: 4, avgAmount: 3158 },
  { department: 'ไลน์ผลิต B', totalRequests: 38, totalAmount: 95000, approvedCount: 32, rejectedCount: 3, avgAmount: 2973 },
  { department: 'ควบคุมคุณภาพ', totalRequests: 12, totalAmount: 55000, approvedCount: 10, rejectedCount: 1, avgAmount: 5000 },
  { department: 'คลังสินค้า', totalRequests: 20, totalAmount: 48000, approvedCount: 17, rejectedCount: 2, avgAmount: 2823 },
  { department: 'ซ่อมบำรุง', totalRequests: 8, totalAmount: 36000, approvedCount: 7, rejectedCount: 1, avgAmount: 5142 },
  { department: 'HR & ธุรการ', totalRequests: 3, totalAmount: 15000, approvedCount: 3, rejectedCount: 0, avgAmount: 5000 },
  { department: 'การเงิน', totalRequests: 2, totalAmount: 12000, approvedCount: 2, rejectedCount: 0, avgAmount: 6000 },
]

export const reconciliationItems: ReconciliationItem[] = [
  { referenceNumber: 'REF-20250514-000001', employeeId: 'EMP-0001', amount: 3000, status: 'processing', attemptedAt: '2025-05-14T12:00:00' },
  { referenceNumber: 'REF-20250513-000002', employeeId: 'EMP-0002', amount: 5000, status: 'settled', attemptedAt: '2025-05-13T15:00:00', settledAt: '2025-05-13T15:30:00' },
  { referenceNumber: 'REF-20250510-000003', employeeId: 'EMP-0003', amount: 1500, status: 'settled', attemptedAt: '2025-05-10T14:00:00', settledAt: '2025-05-10T14:45:00' },
  { referenceNumber: 'REF-20250508-000007', employeeId: 'EMP-0009', amount: 1500, status: 'failed', attemptedAt: '2025-05-08T14:00:00', failureReason: 'ชื่อบัญชีไม่ตรงกัน' },
  { referenceNumber: 'REF-20250513-000006', employeeId: 'EMP-0008', amount: 8000, status: 'settled', attemptedAt: '2025-05-13T10:00:00', settledAt: '2025-05-13T10:30:00' },
]

// Monthly summary metrics
export const monthlySummary = {
  totalRequests: 128,
  totalApproved: 108,
  totalRejected: 12,
  totalPending: 8,
  totalDisbursed: 381000,
  avgAmount: 3527,
  enrolledEmployees: 133,
}
