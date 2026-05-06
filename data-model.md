# Data Model & Mock Data — PayDay+ EWA System
> Version 1.0 · May 2025  
> All types in TypeScript · All mock data in JSON-compatible format

---

## Overview

```
Types defined:
  Employee          — worker profile + EWA settings
  EWARequest        — individual withdrawal request
  PayrollCycle      — pay period definition (monthly/weekly)
  Notification      — HR + employee notifications
  HRUser            — HR/Accountant user accounts
  Department        — department lookup
  ReportSummary     — aggregated data for reports
  AuditLog          — immutable action record
  BankTransfer      — disbursement record
  AppSettings       — system-wide EWA policy

Mock data counts:
  Employees:    20 records (14 monthly, 6 weekly)
  EWARequests:  30 records (mixed statuses)
  Departments:  6 records
  HRUsers:      3 records
  Notifications: 10 records
  AuditLogs:    15 records
  BankTransfers: 12 records
```

---

---

# TypeScript Types

---

## Enums & Union Types

```typescript
// src/types/ewa.ts

export type PayCycle = 'monthly' | 'weekly'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'disbursed'

export type EWAEligibility = 'eligible' | 'quota_used' | 'suspended'

export type HRRole = 'hr_manager' | 'accountant' | 'viewer'

export type TransferStatus = 'processing' | 'settled' | 'failed'

export type NotificationChannel = 'email' | 'line' | 'sms'

export type NotificationType =
  | 'new_request'
  | 'request_approved'
  | 'request_rejected'
  | 'disbursement_complete'
  | 'payday_reminder'
  | 'cutoff_reminder'
  | 'quota_warning'

export type AuditAction =
  | 'request_created'
  | 'request_approved'
  | 'request_rejected'
  | 'request_on_behalf'
  | 'settings_changed'
  | 'employee_suspended'
  | 'employee_reinstated'
  | 'transfer_retried'
```

---

## Employee

```typescript
// src/types/employee.ts

export interface Employee {
  // Identity
  id: string              // "EMP-0041" — primary key, shown in UI
  name: string            // "สมชาย วงศ์ดี" — Thai full name
  nameEn: string          // "Somchai Wongdee" — English name
  avatarInitials: string  // "สม" — 2 chars for Avatar component

  // Employment
  department: string        // department.id reference
  departmentName: string    // "ผลิต A" — denormalized for display
  position: string          // "พนักงานสายการผลิต"
  startDate: string         // ISO date "2022-03-15"
  employmentType: 'full_time' | 'part_time' | 'contract'

  // Pay configuration
  payCycle: PayCycle
  monthlySalary?: number    // total gross monthly (for monthly employees)
  dailyRate?: number        // per day rate (for weekly employees)
  standardWorkDays: number  // 22 (monthly) or 5 (weekly)

  // Bank account (masked for display)
  bankName: string          // "ธนาคารกสิกรไทย"
  bankAccountMasked: string // "xxx-x-x1234-x" — NEVER store full number in frontend
  bankAccountLast4: string  // "1234" — for confirmation display

  // EWA configuration (per-employee overrides)
  ewaEnabled: boolean
  ewaEligibility: EWAEligibility
  ewaMaxPercent: number         // 50 (% of earnedToDate)
  ewaMaxRequestsPerPeriod: number  // 2 (monthly) or 1 (weekly)
  ewaMinAmount: number          // 500 (฿)
  ewaMaxAmount: number          // 10000 (฿) — hard cap

  // Current period stats (computed, refreshed on load)
  currentPeriod: {
    label: string           // "พ.ค. 2568" or "สัปดาห์ที่ 19"
    startDate: string       // ISO date
    endDate: string         // ISO date
    payDate: string         // ISO date
    cutoffDate: string      // ISO date — last day to submit EWA
    workedDays: number
    totalWorkDays: number
    earnedToDate: number    // calculated gross earned so far
    previousEWAThisPeriod: number  // sum of approved EWA this period
    maxWithdrawable: number  // (earnedToDate * maxPercent/100) - previousEWA
    usedRequests: number    // count of requests this period
    remainingRequests: number  // maxRequestsPerPeriod - usedRequests
  }

  // Meta
  createdAt: string   // ISO datetime
  updatedAt: string   // ISO datetime
}
```

---

## EWARequest

```typescript
// src/types/ewa-request.ts

export interface EWARequest {
  // Identity
  id: string            // "EWA-20250501-041" format: EWA-{YYYYMMDD}-{empId3digit}
  employeeId: string    // "EMP-0041"
  employeeName: string  // denormalized for display
  employeeAvatar: string  // initials
  department: string    // denormalized
  departmentName: string

  // Pay cycle context
  payCycle: PayCycle
  periodLabel: string   // "พ.ค. 2568" or "สัปดาห์ที่ 19/2025"
  periodStart: string   // ISO date
  periodEnd: string     // ISO date

  // Financial
  requestedAmount: number      // amount employee wants
  transferFee: number          // default 15 THB, paid by employee
  netTransferAmount: number    // requestedAmount - transferFee
  earnedToDate: number         // at time of request
  maxWithdrawable: number      // at time of request
  previousEWAThisPeriod: number  // before this request
  percentOfEarned: number      // requestedAmount / earnedToDate * 100

  // Request details
  reason: string        // selected reason label (Thai)
  employeeNote: string  // free text from employee (optional)

  // Status
  status: RequestStatus
  requestedAt: string   // ISO datetime

  // Review (null if pending)
  reviewedBy: string | null    // HR user name
  reviewedById: string | null  // HR user id
  reviewedAt: string | null    // ISO datetime
  rejectionReason: string | null
  hrNote: string | null        // internal HR note (not shown to employee)

  // On-behalf fields
  isOnBehalf: boolean          // true if HR submitted
  onBehalfHRId: string | null
  onBehalfHRName: string | null
  onBehalfReason: string | null

  // Disbursement
  disbursedAt: string | null    // ISO datetime
  bankTransferId: string | null // reference to BankTransfer
  bankAccountMasked: string     // at time of request (may differ from current)
  bankName: string

  // Meta
  createdAt: string
  updatedAt: string
}
```

---

## PayrollCycle

```typescript
// src/types/payroll-cycle.ts

export interface PayrollCycle {
  id: string
  type: PayCycle

  // Monthly config
  monthlyPayDay: number         // day of month (e.g., 31 = last day)
  monthlyEWACutoffDay: number   // day of month (e.g., 25)

  // Weekly config
  weeklyPayDayOfWeek: 0|1|2|3|4|5|6  // 0=Sun, 5=Fri
  weeklyEWACutoffDayOfWeek: 0|1|2|3|4|5|6  // 4=Thu
  weeklyEWACutoffHour: number   // 18 (6pm)

  // Blackout dates (no EWA allowed)
  blackoutDates: string[]       // ISO date strings

  // Auto-approval
  autoApprovalEnabled: boolean
  autoApprovalThreshold: number  // max amount for auto-approve

  // Current period (computed)
  currentPeriodStart: string
  currentPeriodEnd: string
  currentPayDate: string
  currentEWACutoff: string
  isWithinCutoff: boolean  // false = no more EWA this period
}
```

---

## HRUser

```typescript
// src/types/hr-user.ts

export interface HRUser {
  id: string          // "HR-001"
  name: string        // "สมศรี ใจดี"
  nameEn: string
  email: string
  role: HRRole
  avatarInitials: string  // "สม"
  department: string      // HR department
  isActive: boolean
  createdAt: string
  lastLoginAt: string
}
```

---

## Department

```typescript
// src/types/department.ts

export interface Department {
  id: string        // "dept-prod-a"
  name: string      // "ผลิต A"
  nameEn: string    // "Production A"
  headCount: number // total employees
  ewaEnrolled: number  // enrolled in EWA
  managerId: string | null
}
```

---

## Notification

```typescript
// src/types/notification.ts

export interface Notification {
  id: string
  type: NotificationType
  recipientId: string   // HR user ID or Employee ID
  recipientType: 'hr' | 'employee'
  title: string         // Thai short title
  body: string          // Thai detail text
  requestId: string | null  // related EWA request (if any)
  isRead: boolean
  channel: NotificationChannel[]  // which channels were sent
  createdAt: string
}
```

---

## BankTransfer

```typescript
// src/types/bank-transfer.ts

export interface BankTransfer {
  id: string           // "TRF-20250501-001"
  requestIds: string[] // multiple requests batched in one transfer
  totalAmount: number
  recipientBank: string
  recipientAccountMasked: string
  status: TransferStatus
  processingBank: string      // "ธ.กสิกรไทย"
  referenceNumber: string     // bank reference
  initiatedAt: string
  settledAt: string | null
  failureReason: string | null
  retryCount: number
  batchLabel: string    // "พ.ค. 2568" or "สัปดาห์ที่ 19"
}
```

---

## AuditLog

```typescript
// src/types/audit-log.ts

export interface AuditLog {
  id: string         // "AUD-5821"
  action: AuditAction
  actorId: string    // HR user ID who performed the action
  actorName: string  // denormalized
  actorRole: HRRole
  targetId: string   // requestId or employeeId
  targetType: 'request' | 'employee' | 'settings'
  description: string  // human-readable Thai description
  metadata: Record<string, unknown>  // action-specific data
  ipAddress: string    // masked: "192.168.x.x"
  createdAt: string    // ISO datetime
}
```

---

## ReportSummary

```typescript
// src/types/report.ts

export interface PeriodSummary {
  periodLabel: string
  periodType: PayCycle
  totalDisbursed: number
  totalRequests: number
  approvedRequests: number
  rejectedRequests: number
  pendingRequests: number
  approvalRate: number       // percentage
  avgRequestAmount: number
  feeRevenue: number
  uniqueEmployees: number    // distinct employees who requested
}

export interface DepartmentSummary {
  departmentId: string
  departmentName: string
  employeeCount: number
  requestCount: number
  totalAmount: number
  avgAmount: number
  approvalRate: number
}

export interface DailyDisbursement {
  date: string         // ISO date
  amount: number
  requestCount: number
}

export interface WeeklyDisbursement {
  weekLabel: string    // "สัปดาห์ที่ 18"
  weekNumber: number
  year: number
  amount: number
  requestCount: number
}
```

---

## AppSettings

```typescript
// src/types/settings.ts

export interface EWAPolicy {
  payCycle: PayCycle
  maxPercent: number              // 50
  maxRequestsPerPeriod: number    // 2 (monthly) / 1 (weekly)
  minAmount: number               // 500
  maxAmount: number               // 10000
  autoApprovalEnabled: boolean
  autoApprovalThreshold: number   // 3000
  approvalChain: 'single' | 'two_step'
  weeklyPayDayOfWeek?: number     // 5 = Friday (weekly only)
  weeklyCutoffDayOfWeek?: number  // 4 = Thursday (weekly only)
  weeklyCutoffHour?: number       // 18 (weekly only)
  blackoutDates: string[]         // ISO dates
}

export interface NotificationSettings {
  hrNewRequest: { email: boolean; line: boolean }
  hrOverdue: { email: boolean; line: boolean }
  employeeApproved: { line: boolean; sms: boolean }
  employeeRejected: { line: boolean; sms: boolean }
  employeePayday: { line: boolean; sms: boolean }
  lineNotifyToken: string
}

export interface AppSettings {
  companyName: string
  companyLogoUrl: string | null
  ewaMonthlyPolicy: EWAPolicy
  ewaWeeklyPolicy: EWAPolicy
  notificationSettings: NotificationSettings
  updatedAt: string
  updatedBy: string
}
```

---

---

# Mock Data

---

## Departments

```typescript
// src/lib/mock-data/departments.ts

export const mockDepartments: Department[] = [
  {
    id: 'dept-prod-a',
    name: 'ผลิต A',
    nameEn: 'Production A',
    headCount: 85,
    ewaEnrolled: 72,
    managerId: 'EMP-0010',
  },
  {
    id: 'dept-prod-b',
    name: 'ผลิต B',
    nameEn: 'Production B',
    headCount: 78,
    ewaEnrolled: 65,
    managerId: 'EMP-0022',
  },
  {
    id: 'dept-warehouse',
    name: 'คลังสินค้า',
    nameEn: 'Warehouse',
    headCount: 45,
    ewaEnrolled: 38,
    managerId: 'EMP-0031',
  },
  {
    id: 'dept-qc',
    name: 'QC',
    nameEn: 'Quality Control',
    headCount: 32,
    ewaEnrolled: 28,
    managerId: 'EMP-0044',
  },
  {
    id: 'dept-maintenance',
    name: 'ซ่อมบำรุง',
    nameEn: 'Maintenance',
    headCount: 28,
    ewaEnrolled: 22,
    managerId: 'EMP-0055',
  },
  {
    id: 'dept-hr',
    name: 'ฝ่ายบุคคล',
    nameEn: 'Human Resources',
    headCount: 12,
    ewaEnrolled: 8,
    managerId: null,
  },
]
```

---

## HR Users

```typescript
// src/lib/mock-data/hr-users.ts

export const mockHRUsers: HRUser[] = [
  {
    id: 'HR-001',
    name: 'สมศรี ใจดี',
    nameEn: 'Somsri Jaidee',
    email: 'somsri@payday.com',
    role: 'hr_manager',
    avatarInitials: 'สศ',
    department: 'ฝ่ายบุคคล',
    isActive: true,
    createdAt: '2023-01-10T08:00:00Z',
    lastLoginAt: '2025-05-04T08:12:00Z',
  },
  {
    id: 'HR-002',
    name: 'วิภา บัญชีดี',
    nameEn: 'Wipa Bancheedee',
    email: 'wipa@payday.com',
    role: 'accountant',
    avatarInitials: 'วภ',
    department: 'การเงิน',
    isActive: true,
    createdAt: '2023-03-01T08:00:00Z',
    lastLoginAt: '2025-05-03T16:45:00Z',
  },
  {
    id: 'HR-003',
    name: 'ประวิทย์ ดูแล',
    nameEn: 'Prawit Dooal',
    email: 'prawit@payday.com',
    role: 'viewer',
    avatarInitials: 'ปว',
    department: 'ฝ่ายบุคคล',
    isActive: true,
    createdAt: '2024-06-15T08:00:00Z',
    lastLoginAt: '2025-04-28T10:30:00Z',
  },
]

// Mock current session (switches based on role demo)
export const mockCurrentHRUser: HRUser = mockHRUsers[0]
```

---

## Employees

```typescript
// src/lib/mock-data/employees.ts

export const mockEmployees: Employee[] = [
  // === Monthly Employees (14) ===
  {
    id: 'EMP-0041',
    name: 'สมชาย วงศ์ดี',
    nameEn: 'Somchai Wongdee',
    avatarInitials: 'สช',
    department: 'dept-prod-a',
    departmentName: 'ผลิต A',
    position: 'พนักงานสายการผลิต',
    startDate: '2021-08-01',
    employmentType: 'full_time',
    payCycle: 'monthly',
    monthlySalary: 18000,
    dailyRate: undefined,
    standardWorkDays: 22,
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountMasked: 'xxx-x-x1234-x',
    bankAccountLast4: '1234',
    ewaEnabled: true,
    ewaEligibility: 'eligible',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: 14727,
      previousEWAThisPeriod: 0,
      maxWithdrawable: 7363,
      usedRequests: 0,
      remainingRequests: 2,
    },
    createdAt: '2021-08-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'EMP-0089',
    name: 'นภาพร ใจดี',
    nameEn: 'Napaporn Jaidee',
    avatarInitials: 'นภ',
    department: 'dept-warehouse',
    departmentName: 'คลังสินค้า',
    position: 'หัวหน้าคลังสินค้า',
    startDate: '2019-03-15',
    employmentType: 'full_time',
    payCycle: 'monthly',
    monthlySalary: 24000,
    standardWorkDays: 22,
    bankName: 'ธนาคารไทยพาณิชย์',
    bankAccountMasked: 'xxx-x-x5678-x',
    bankAccountLast4: '5678',
    ewaEnabled: true,
    ewaEligibility: 'eligible',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: 19636,
      previousEWAThisPeriod: 5000,
      maxWithdrawable: 4818,
      usedRequests: 1,
      remainingRequests: 1,
    },
    createdAt: '2019-03-15T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'EMP-0112',
    name: 'ประเสริฐ มั่นคง',
    nameEn: 'Prasert Mankong',
    avatarInitials: 'ปส',
    department: 'dept-prod-b',
    departmentName: 'ผลิต B',
    position: 'ช่างเทคนิค',
    startDate: '2020-11-01',
    employmentType: 'full_time',
    payCycle: 'monthly',
    monthlySalary: 20000,
    standardWorkDays: 22,
    bankName: 'ธนาคารกรุงไทย',
    bankAccountMasked: 'xxx-x-x9012-x',
    bankAccountLast4: '9012',
    ewaEnabled: true,
    ewaEligibility: 'quota_used',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: 16363,
      previousEWAThisPeriod: 8000,
      maxWithdrawable: 0,
      usedRequests: 2,
      remainingRequests: 0,
    },
    createdAt: '2020-11-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'EMP-0054',
    name: 'มาลี สุขสม',
    nameEn: 'Malee Sooksom',
    avatarInitials: 'มล',
    department: 'dept-qc',
    departmentName: 'QC',
    position: 'เจ้าหน้าที่ QC',
    startDate: '2022-05-20',
    employmentType: 'full_time',
    payCycle: 'monthly',
    monthlySalary: 17000,
    standardWorkDays: 22,
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountMasked: 'xxx-x-x3456-x',
    bankAccountLast4: '3456',
    ewaEnabled: true,
    ewaEligibility: 'suspended',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: 13909,
      previousEWAThisPeriod: 0,
      maxWithdrawable: 0,
      usedRequests: 0,
      remainingRequests: 0,
    },
    createdAt: '2022-05-20T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'EMP-0203',
    name: 'วิชัย ดำรงค์',
    nameEn: 'Wichai Damrong',
    avatarInitials: 'วช',
    department: 'dept-maintenance',
    departmentName: 'ซ่อมบำรุง',
    position: 'ช่างซ่อมบำรุง',
    startDate: '2018-06-10',
    employmentType: 'full_time',
    payCycle: 'monthly',
    monthlySalary: 22000,
    standardWorkDays: 22,
    bankName: 'ธนาคารกรุงเทพ',
    bankAccountMasked: 'xxx-x-x7890-x',
    bankAccountLast4: '7890',
    ewaEnabled: true,
    ewaEligibility: 'eligible',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: 18000,
      previousEWAThisPeriod: 0,
      maxWithdrawable: 9000,
      usedRequests: 0,
      remainingRequests: 2,
    },
    createdAt: '2018-06-10T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },

  // --- remaining 9 monthly employees (abbreviated) ---
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `EMP-0${200 + i + 10}`,
    name: ['สุภาพร ทองดี','อานนท์ สมใจ','รัตนา พงษ์ดี','ชาญณรงค์ ศรีสุข',
           'พรรณี วัฒนา','ธนกร จันทร์ดี','ลัดดา สุขเกษม','กิตติ มีสุข','วรรณา พรมดี'][i],
    nameEn: ['Supaporn Thongdee','Arnon Somjai','Rattana Phongdee','Channarong Srisuk',
             'Phannee Watthana','Tanakorn Jandee','Ladda Sookasem','Kitti Meesuk','Wanna Phromdi'][i],
    avatarInitials: ['สภ','อน','รต','ชณ','พณ','ธก','ลด','กต','วณ'][i],
    department: ['dept-prod-a','dept-prod-b','dept-warehouse','dept-qc','dept-maintenance',
                 'dept-prod-a','dept-prod-b','dept-warehouse','dept-qc'][i],
    departmentName: ['ผลิต A','ผลิต B','คลังสินค้า','QC','ซ่อมบำรุง',
                     'ผลิต A','ผลิต B','คลังสินค้า','QC'][i],
    position: 'พนักงาน',
    startDate: '2020-01-01',
    employmentType: 'full_time' as const,
    payCycle: 'monthly' as const,
    monthlySalary: 16000 + i * 500,
    standardWorkDays: 22,
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountMasked: `xxx-x-x${1000 + i}-x`,
    bankAccountLast4: `${1000 + i}`,
    ewaEnabled: true,
    ewaEligibility: 'eligible' as const,
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod: {
      label: 'พ.ค. 2568',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      payDate: '2025-05-31',
      cutoffDate: '2025-05-25',
      workedDays: 18,
      totalWorkDays: 22,
      earnedToDate: Math.round((16000 + i * 500) / 22 * 18),
      previousEWAThisPeriod: 0,
      maxWithdrawable: Math.round((16000 + i * 500) / 22 * 18 * 0.5),
      usedRequests: 0,
      remainingRequests: 2,
    },
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  })),

  // === Weekly Employees (6) ===
  {
    id: 'EMP-0301',
    name: 'มิน มาเยีย',
    nameEn: 'Min Ma Yay',
    avatarInitials: 'มม',
    department: 'dept-prod-a',
    departmentName: 'ผลิต A',
    position: 'พนักงานสายการผลิต',
    startDate: '2023-09-01',
    employmentType: 'full_time',
    payCycle: 'weekly',
    dailyRate: 420,
    standardWorkDays: 5,
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountMasked: 'xxx-x-x2222-x',
    bankAccountLast4: '2222',
    ewaEnabled: true,
    ewaEligibility: 'eligible',
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 1,
    ewaMinAmount: 200,
    ewaMaxAmount: 5000,
    currentPeriod: {
      label: 'สัปดาห์ที่ 19/2568',
      startDate: '2025-05-05',
      endDate: '2025-05-09',
      payDate: '2025-05-09',
      cutoffDate: '2025-05-08',
      workedDays: 4,
      totalWorkDays: 5,
      earnedToDate: 1680,
      previousEWAThisPeriod: 0,
      maxWithdrawable: 840,
      usedRequests: 0,
      remainingRequests: 1,
    },
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2025-05-05T00:00:00Z',
  },

  // --- remaining 5 weekly employees (abbreviated) ---
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `EMP-030${i + 2}`,
    name: ['เมียะ ซอ','ซูซาน ต่าย','ทุน มอ','ฉ่วย ลิน','อองมิน'][i],
    nameEn: ['Mya Saw','Susan Tae','Htun Mo','Shway Lin','Aung Min'][i],
    avatarInitials: ['มซ','ซส','ทม','ฉล','อม'][i],
    department: ['dept-prod-a','dept-prod-b','dept-warehouse','dept-prod-a','dept-prod-b'][i],
    departmentName: ['ผลิต A','ผลิต B','คลังสินค้า','ผลิต A','ผลิต B'][i],
    position: 'พนักงานสายการผลิต',
    startDate: '2024-01-15',
    employmentType: 'full_time' as const,
    payCycle: 'weekly' as const,
    dailyRate: 400 + i * 20,
    standardWorkDays: 5,
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountMasked: `xxx-x-x${3000 + i}-x`,
    bankAccountLast4: `${3000 + i}`,
    ewaEnabled: true,
    ewaEligibility: 'eligible' as const,
    ewaMaxPercent: 50,
    ewaMaxRequestsPerPeriod: 1,
    ewaMinAmount: 200,
    ewaMaxAmount: 5000,
    currentPeriod: {
      label: 'สัปดาห์ที่ 19/2568',
      startDate: '2025-05-05',
      endDate: '2025-05-09',
      payDate: '2025-05-09',
      cutoffDate: '2025-05-08',
      workedDays: 4,
      totalWorkDays: 5,
      earnedToDate: (400 + i * 20) * 4,
      previousEWAThisPeriod: 0,
      maxWithdrawable: Math.round((400 + i * 20) * 4 * 0.5),
      usedRequests: 0,
      remainingRequests: 1,
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-05-05T00:00:00Z',
  })),
]

// Helper: current logged-in employee (for Employee side)
export const mockCurrentEmployee = mockEmployees[0] // EMP-0041
```

---

## EWA Requests

```typescript
// src/lib/mock-data/requests.ts

const DEFAULT_TRANSFER_FEE_THB = 15

export const mockRequests: EWARequest[] = [
  {
    id: 'EWA-20250501-041',
    employeeId: 'EMP-0041',
    employeeName: 'สมชาย วงศ์ดี',
    employeeAvatar: 'สช',
    department: 'dept-prod-a',
    departmentName: 'ผลิต A',
    payCycle: 'monthly',
    periodLabel: 'พ.ค. 2568',
    periodStart: '2025-05-01',
    periodEnd: '2025-05-31',
    requestedAmount: 3000,
    transferFee: DEFAULT_TRANSFER_FEE_THB,
    netTransferAmount: 2985,
    earnedToDate: 14727,
    maxWithdrawable: 7363,
    previousEWAThisPeriod: 0,
    percentOfEarned: 20.4,
    reason: 'ค่ารักษาพยาบาล',
    employeeNote: 'ลูกป่วยฉุกเฉิน ต้องการค่ายา',
    status: 'pending',
    requestedAt: '2025-05-01T09:32:00Z',
    reviewedBy: null,
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    hrNote: null,
    isOnBehalf: false,
    onBehalfHRId: null,
    onBehalfHRName: null,
    onBehalfReason: null,
    disbursedAt: null,
    bankTransferId: null,
    bankAccountMasked: 'xxx-x-x1234-x',
    bankName: 'ธนาคารกสิกรไทย',
    createdAt: '2025-05-01T09:32:00Z',
    updatedAt: '2025-05-01T09:32:00Z',
  },
  {
    id: 'EWA-20250430-089',
    employeeId: 'EMP-0089',
    employeeName: 'นภาพร ใจดี',
    employeeAvatar: 'นภ',
    department: 'dept-warehouse',
    departmentName: 'คลังสินค้า',
    payCycle: 'monthly',
    periodLabel: 'เม.ย. 2568',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    requestedAmount: 5000,
    earnedToDate: 22000,
    maxWithdrawable: 6000,
    previousEWAThisPeriod: 5000,
    percentOfEarned: 22.7,
    reason: 'ค่าใช้จ่ายในบ้าน',
    employeeNote: '',
    status: 'approved',
    requestedAt: '2025-04-28T14:15:00Z',
    reviewedBy: 'สมศรี ใจดี',
    reviewedById: 'HR-001',
    reviewedAt: '2025-04-28T15:30:00Z',
    rejectionReason: null,
    hrNote: 'อนุมัติปกติ',
    isOnBehalf: false,
    onBehalfHRId: null,
    onBehalfHRName: null,
    onBehalfReason: null,
    disbursedAt: null,
    bankTransferId: null,
    bankAccountMasked: 'xxx-x-x5678-x',
    bankName: 'ธนาคารไทยพาณิชย์',
    createdAt: '2025-04-28T14:15:00Z',
    updatedAt: '2025-04-28T15:30:00Z',
  },
  {
    id: 'EWA-20250429-112',
    employeeId: 'EMP-0112',
    employeeName: 'ประเสริฐ มั่นคง',
    employeeAvatar: 'ปส',
    department: 'dept-prod-b',
    departmentName: 'ผลิต B',
    payCycle: 'monthly',
    periodLabel: 'เม.ย. 2568',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    requestedAmount: 2000,
    earnedToDate: 18200,
    maxWithdrawable: 4100,
    previousEWAThisPeriod: 5000,
    percentOfEarned: 11.0,
    reason: 'ค่าใช้จ่ายฉุกเฉิน',
    employeeNote: '',
    status: 'disbursed',
    requestedAt: '2025-04-29T10:00:00Z',
    reviewedBy: 'สมศรี ใจดี',
    reviewedById: 'HR-001',
    reviewedAt: '2025-04-29T11:00:00Z',
    rejectionReason: null,
    hrNote: null,
    isOnBehalf: false,
    onBehalfHRId: null,
    onBehalfHRName: null,
    onBehalfReason: null,
    disbursedAt: '2025-04-30T09:00:00Z',
    bankTransferId: 'TRF-20250430-001',
    bankAccountMasked: 'xxx-x-x9012-x',
    bankName: 'ธนาคารกรุงไทย',
    createdAt: '2025-04-29T10:00:00Z',
    updatedAt: '2025-04-30T09:00:00Z',
  },
  {
    id: 'EWA-20250429-054',
    employeeId: 'EMP-0054',
    employeeName: 'มาลี สุขสม',
    employeeAvatar: 'มล',
    department: 'dept-qc',
    departmentName: 'QC',
    payCycle: 'monthly',
    periodLabel: 'เม.ย. 2568',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    requestedAmount: 8000,
    earnedToDate: 15500,
    maxWithdrawable: 7750,
    previousEWAThisPeriod: 0,
    percentOfEarned: 51.6,
    reason: 'อื่นๆ',
    employeeNote: 'ค่าใช้จ่ายส่วนตัว',
    status: 'rejected',
    requestedAt: '2025-04-29T08:45:00Z',
    reviewedBy: 'สมศรี ใจดี',
    reviewedById: 'HR-001',
    reviewedAt: '2025-04-29T09:30:00Z',
    rejectionReason: 'จำนวนที่ขอเกินกว่าวงเงินที่อนุญาต',
    hrNote: 'เกินวงเงิน 50% แจ้งพนักงานให้ขอใหม่ในจำนวนที่ถูกต้อง',
    isOnBehalf: false,
    onBehalfHRId: null,
    onBehalfHRName: null,
    onBehalfReason: null,
    disbursedAt: null,
    bankTransferId: null,
    bankAccountMasked: 'xxx-x-x3456-x',
    bankName: 'ธนาคารกสิกรไทย',
    createdAt: '2025-04-29T08:45:00Z',
    updatedAt: '2025-04-29T09:30:00Z',
  },
  {
    id: 'EWA-20250428-203',
    employeeId: 'EMP-0203',
    employeeName: 'วิชัย ดำรงค์',
    employeeAvatar: 'วช',
    department: 'dept-maintenance',
    departmentName: 'ซ่อมบำรุง',
    payCycle: 'monthly',
    periodLabel: 'เม.ย. 2568',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    requestedAmount: 4500,
    earnedToDate: 18000,
    maxWithdrawable: 9000,
    previousEWAThisPeriod: 0,
    percentOfEarned: 25.0,
    reason: 'ค่าเล่าเรียนบุตร',
    employeeNote: 'ค่าเทอมบุตรชาย',
    status: 'pending',
    requestedAt: '2025-04-28T16:20:00Z',
    reviewedBy: null,
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    hrNote: null,
    isOnBehalf: true,
    onBehalfHRId: 'HR-001',
    onBehalfHRName: 'สมศรี ใจดี',
    onBehalfReason: 'พนักงานไม่มีโทรศัพท์ ขอด้วยวาจา',
    disbursedAt: null,
    bankTransferId: null,
    bankAccountMasked: 'xxx-x-x7890-x',
    bankName: 'ธนาคารกรุงเทพ',
    createdAt: '2025-04-28T16:20:00Z',
    updatedAt: '2025-04-28T16:20:00Z',
  },

  // --- 25 additional requests (abbreviated) ---
  // Mix of statuses, employees, and months (Feb–Apr 2025)
  ...Array.from({ length: 25 }, (_, i) => {
    const statuses: RequestStatus[] = ['pending','approved','rejected','disbursed']
    const employees = mockEmployees.slice(0, 10)
    const emp = employees[i % employees.length]
    const amounts = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]
    const reasons = ['ค่าใช้จ่ายฉุกเฉิน','ค่ารักษาพยาบาล','ค่าเล่าเรียนบุตร','ค่าใช้จ่ายในบ้าน','อื่นๆ']
    const amount = amounts[i % amounts.length]
    const transferFee = DEFAULT_TRANSFER_FEE_THB
    const status = statuses[i % statuses.length]
    const daysAgo = i + 1
    const requestDate = new Date(2025, 3, 30 - daysAgo) // April backwards

    return {
      id: `EWA-${requestDate.toISOString().slice(0,10).replace(/-/g,'')}-${emp.id.slice(-3)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeAvatar: emp.avatarInitials,
      department: emp.department,
      departmentName: emp.departmentName,
      payCycle: emp.payCycle,
      periodLabel: 'เม.ย. 2568',
      periodStart: '2025-04-01',
      periodEnd: '2025-04-30',
      requestedAmount: amount,
      transferFee,
      netTransferAmount: amount - transferFee,
      earnedToDate: (emp.monthlySalary ?? (emp.dailyRate ?? 400) * 22) * 0.8,
      maxWithdrawable: (emp.monthlySalary ?? (emp.dailyRate ?? 400) * 22) * 0.4,
      previousEWAThisPeriod: 0,
      percentOfEarned: Math.round(amount / ((emp.monthlySalary ?? 8000) * 0.8) * 100 * 10) / 10,
      reason: reasons[i % reasons.length],
      employeeNote: '',
      status,
      requestedAt: requestDate.toISOString(),
      reviewedBy: status !== 'pending' ? 'สมศรี ใจดี' : null,
      reviewedById: status !== 'pending' ? 'HR-001' : null,
      reviewedAt: status !== 'pending' ? new Date(requestDate.getTime() + 3600000).toISOString() : null,
      rejectionReason: status === 'rejected' ? 'ไม่ผ่านเงื่อนไขการเบิก' : null,
      hrNote: null,
      isOnBehalf: false,
      onBehalfHRId: null,
      onBehalfHRName: null,
      onBehalfReason: null,
      disbursedAt: status === 'disbursed' ? new Date(requestDate.getTime() + 86400000).toISOString() : null,
      bankTransferId: status === 'disbursed' ? `TRF-${i + 100}` : null,
      bankAccountMasked: emp.bankAccountMasked,
      bankName: emp.bankName,
      createdAt: requestDate.toISOString(),
      updatedAt: requestDate.toISOString(),
    }
  }),
]
```

---

## App Settings (Mock)

```typescript
// src/lib/mock-data/settings.ts

export const mockSettings: AppSettings = {
  companyName: 'โรงงานไทยดี จำกัด',
  companyLogoUrl: null,

  ewaMonthlyPolicy: {
    payCycle: 'monthly',
    maxPercent: 50,
    maxRequestsPerPeriod: 2,
    minAmount: 500,
    maxAmount: 10000,
    autoApprovalEnabled: true,
    autoApprovalThreshold: 3000,
    approvalChain: 'single',
    blackoutDates: ['2025-12-31', '2026-01-01', '2026-04-13', '2026-04-14', '2026-04-15'],
  },

  ewaWeeklyPolicy: {
    payCycle: 'weekly',
    maxPercent: 50,
    maxRequestsPerPeriod: 1,
    minAmount: 200,
    maxAmount: 5000,
    autoApprovalEnabled: false,
    autoApprovalThreshold: 0,
    approvalChain: 'single',
    weeklyPayDayOfWeek: 5,     // Friday
    weeklyCutoffDayOfWeek: 4,  // Thursday
    weeklyCutoffHour: 18,      // 6pm
    blackoutDates: ['2025-12-31', '2026-01-01'],
  },

  notificationSettings: {
    hrNewRequest: { email: true, line: true },
    hrOverdue: { email: true, line: false },
    employeeApproved: { line: true, sms: false },
    employeeRejected: { line: true, sms: false },
    employeePayday: { line: true, sms: false },
    lineNotifyToken: 'mock-line-token-xxxx',
  },

  updatedAt: '2025-04-01T08:00:00Z',
  updatedBy: 'HR-001',
}
```

---

## Mock Store (Zustand)

```typescript
// src/lib/store/ewa-store.ts
import { create } from 'zustand'
import { mockRequests } from '@/lib/mock-data/requests'
import { mockEmployees } from '@/lib/mock-data/employees'
import { mockSettings } from '@/lib/mock-data/settings'

interface EWAStore {
  // Data
  requests: EWARequest[]
  employees: Employee[]
  settings: AppSettings
  currentHRUser: HRUser
  currentEmployee: Employee

  // Computed
  pendingCount: number

  // Actions
  approveRequest: (id: string, note: string) => void
  rejectRequest: (id: string, reason: string) => void
  addRequest: (request: EWARequest) => void
}

export const useEWAStore = create<EWAStore>((set, get) => ({
  requests: mockRequests,
  employees: mockEmployees,
  settings: mockSettings,
  currentHRUser: mockCurrentHRUser,
  currentEmployee: mockCurrentEmployee,

  get pendingCount() {
    return get().requests.filter(r => r.status === 'pending').length
  },

  approveRequest: (id, note) => set(state => ({
    requests: state.requests.map(r =>
      r.id === id
        ? {
            ...r,
            status: 'approved',
            reviewedBy: state.currentHRUser.name,
            reviewedById: state.currentHRUser.id,
            reviewedAt: new Date().toISOString(),
            hrNote: note,
            updatedAt: new Date().toISOString(),
          }
        : r
    )
  })),

  rejectRequest: (id, reason) => set(state => ({
    requests: state.requests.map(r =>
      r.id === id
        ? {
            ...r,
            status: 'rejected',
            reviewedBy: state.currentHRUser.name,
            reviewedById: state.currentHRUser.id,
            reviewedAt: new Date().toISOString(),
            rejectionReason: reason,
            updatedAt: new Date().toISOString(),
          }
        : r
    )
  })),

  addRequest: (request) => set(state => ({
    requests: [request, ...state.requests]
  })),
}))
```

---

## Business Logic Utilities

```typescript
// src/lib/utils/ewa-calculations.ts
import dayjs from 'dayjs'

export const DEFAULT_TRANSFER_FEE_THB = 15

// R5: Calculate employee net transfer after fee
export function calculateNetTransferAmount(
  requestedAmount: number,
  transferFee = DEFAULT_TRANSFER_FEE_THB,
): number {
  return Math.max(requestedAmount - transferFee, 0)
}

// R1: Calculate earned wages to date
export function calculateEarnedToDate(
  payCycle: PayCycle,
  monthlySalary?: number,
  dailyRate?: number,
  workedDays?: number,
): number {
  if (payCycle === 'monthly' && monthlySalary && workedDays) {
    const STANDARD_WORK_DAYS = 22
    return Math.round((monthlySalary / STANDARD_WORK_DAYS) * workedDays)
  }
  if (payCycle === 'weekly' && dailyRate && workedDays) {
    return dailyRate * workedDays
  }
  return 0
}

// R2: Calculate maximum withdrawable
export function calculateMaxWithdrawable(
  earnedToDate: number,
  maxPercent: number,        // e.g. 50
  previousEWAThisPeriod: number,
): number {
  const gross = Math.floor(earnedToDate * (maxPercent / 100))
  const available = gross - previousEWAThisPeriod
  return Math.max(0, available)
}

// R3: Validate request amount
export function validateRequestAmount(
  amount: number,
  maxWithdrawable: number,
  minAmount: number,
): { valid: boolean; error?: string } {
  if (amount < minAmount) {
    return { valid: false, error: `ยอดขั้นต่ำ ฿${minAmount.toLocaleString()}` }
  }
  if (amount > maxWithdrawable) {
    return { valid: false, error: `เกินวงเงิน กรุณาใส่ไม่เกิน ฿${maxWithdrawable.toLocaleString()}` }
  }
  if (amount !== Math.floor(amount)) {
    return { valid: false, error: 'กรุณาระบุจำนวนเต็มบาท (ไม่มีสตางค์)' }
  }
  return { valid: true }
}

// R5: Check if within EWA cutoff
export function isWithinCutoff(
  payCycle: PayCycle,
  monthlyPolicy: EWAPolicy,
  weeklyPolicy: EWAPolicy,
): boolean {
  const now = dayjs()
  if (payCycle === 'monthly') {
    return now.date() <= monthlyPolicy.maxRequestsPerPeriod
    // simplified — real impl checks cutoffDate field
  }
  if (payCycle === 'weekly') {
    const dayOfWeek = now.day() // 0=Sun
    const cutoffDay = weeklyPolicy.weeklyCutoffDayOfWeek ?? 4
    const cutoffHour = weeklyPolicy.weeklyCutoffHour ?? 18
    if (dayOfWeek > cutoffDay) return false
    if (dayOfWeek === cutoffDay && now.hour() >= cutoffHour) return false
    return true
  }
  return false
}

// R6: Check auto-approval
export function shouldAutoApprove(
  amount: number,
  policy: EWAPolicy,
): boolean {
  return policy.autoApprovalEnabled && amount < policy.autoApprovalThreshold
}

// Format ฿ currency
export function formatTHB(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`
}

// Generate EWA request ID
export function generateEWAId(employeeId: string): string {
  const date = dayjs().format('YYYYMMDD')
  const empNum = employeeId.replace('EMP-', '')
  return `EWA-${date}-${empNum}`
}
```

---

## File Index

```
src/
├── types/
│   ├── ewa.ts              enums, union types
│   ├── employee.ts         Employee interface
│   ├── ewa-request.ts      EWARequest interface
│   ├── payroll-cycle.ts    PayrollCycle interface
│   ├── hr-user.ts          HRUser interface
│   ├── department.ts       Department interface
│   ├── notification.ts     Notification interface
│   ├── bank-transfer.ts    BankTransfer interface
│   ├── audit-log.ts        AuditLog interface
│   ├── report.ts           ReportSummary interfaces
│   └── settings.ts         AppSettings interface
│
└── lib/
    ├── mock-data/
    │   ├── departments.ts  6 records
    │   ├── hr-users.ts     3 records
    │   ├── employees.ts    20 records
    │   ├── requests.ts     30 records
    │   └── settings.ts     app config
    ├── store/
    │   └── ewa-store.ts    Zustand store
    └── utils/
        └── ewa-calculations.ts  business logic helpers
```
