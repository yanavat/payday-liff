export type Locale = 'th' | 'en' | 'my'

export type PayCycle = 'monthly' | 'weekly'

export type WorkType = 'remote' | 'onsite' | 'hybrid'

export type EWAStatus = 'pending' | 'approved' | 'rejected' | 'disbursed'

export type EmployeeEWAStatus = 'eligible' | 'limit_reached' | 'suspended'

export type ApprovalChain = 'single' | 'two_step'

export type NotificationChannel = 'email' | 'line' | 'sms'

export interface Employee {
  id: string
  name: string
  nameTh: string
  department: string
  position: string
  payCycle: PayCycle
  workType: WorkType
  baseSalary: number
  bankAccountMasked: string
  bankName: string
  ewaStatus: EmployeeEWAStatus
  enrolledAt: string
  avatarUrl?: string
}

export interface EWARequest {
  id: string
  employeeId: string
  employee?: Employee
  amount: number
  transferFee: number
  netTransferAmount: number
  reason: EWAReason
  status: EWAStatus
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  disbursedAt?: string
  approvedBy?: string
  employeeNote?: string
  hrNote?: string
  payCycle: PayCycle
  isOnBehalf: boolean
  onBehalfBy?: string
  referenceNumber: string
}

export type EWAReason = 'medical' | 'education' | 'emergency' | 'utility' | 'other'

export interface PayCycleInfo {
  type: PayCycle
  periodStart: string
  periodEnd: string
  paydayDate: string
  cutoffDate: string
  daysElapsed: number
  totalDays: number
}

export interface FinancialBreakdown {
  earnedWage: number
  previousAdvance: number
  maxAllowed: number
  requestedAmount: number
  remainingAfterRequest: number
}

export interface Department {
  id: string
  name: string
  nameTh: string
  headCount: number
}

export interface HRUser {
  id: string
  name: string
  email: string
  role: 'hr_manager' | 'hr_officer' | 'accountant'
  avatarUrl?: string
}

export interface EWAPolicy {
  payCycle: PayCycle
  maxPercent: number
  maxRequestsPerPeriod: number
  minAmount: number
  autoApproval: boolean
  autoApprovalThreshold: number
  approvalChain: ApprovalChain
  weeklyPayday?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
  ewaCutoffDays: number
  blackoutDates: string[]
}

export interface NotificationSettings {
  onApproval: {
    email: boolean
    line: boolean
  }
  onPayday: {
    email: boolean
    line: boolean
  }
  onRejection: {
    email: boolean
    line: boolean
  }
}

export interface DailyDisbursement {
  date: string
  amount: number
  count: number
}

export interface DepartmentReport {
  department: string
  totalRequests: number
  totalAmount: number
  approvedCount: number
  rejectedCount: number
  avgAmount: number
}

export interface ReconciliationItem {
  referenceNumber: string
  employeeId: string
  amount: number
  status: 'processing' | 'settled' | 'failed'
  attemptedAt: string
  settledAt?: string
  failureReason?: string
}
