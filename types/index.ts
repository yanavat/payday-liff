// ============================================================
// EWA PAYDAY+ — Shared TypeScript Types
// ============================================================

export type Locale = 'th' | 'en' | 'my'

export type PayCycle = 'monthly' | 'weekly'

export type WorkType = 'remote' | 'onsite' | 'hybrid'

export type EWAStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'cancelled'

export type EmployeeEWAStatus = 'eligible' | 'limit_reached' | 'suspended'

export type ApprovalChain = 'single' | 'two_step'

export type NotificationChannel = 'email' | 'line' | 'sms'

// ── Employee ────────────────────────────────────────────────

export interface Employee {
  id: string                   // e.g. "EMP-0041"
  name: string
  nameTh: string
  department: string
  position: string
  payCycle: PayCycle
  workType: WorkType
  baseSalary: number           // monthly salary in THB
  bankAccountMasked: string    // e.g. "xxx-x-xx123-4"
  bankName: string
  ewaStatus: EmployeeEWAStatus
  enrolledAt: string           // ISO date
  avatarUrl?: string
}

// ── EWA Request ─────────────────────────────────────────────

export interface EWARequest {
  id: string                   // e.g. "EWA-2025-001234"
  employeeId: string
  employee?: Employee
  amount: number               // THB
  transferFee: number          // THB, paid by employee per transaction
  netTransferAmount: number    // amount - transferFee
  reason: EWAReason
  status: EWAStatus
  requestedAt: string          // ISO datetime
  approvedAt?: string
  rejectedAt?: string
  disbursedAt?: string
  approvedBy?: string          // HR user name
  employeeNote?: string
  hrNote?: string
  payCycle: PayCycle
  isOnBehalf: boolean          // true if HR submitted for employee
  onBehalfBy?: string          // HR user name if isOnBehalf
  referenceNumber: string      // e.g. "REF-20250501-001234"
}

export type EWAReason =
  | 'medical'
  | 'education'
  | 'emergency'
  | 'utility'
  | 'other'

// ── Pay Cycle Info ──────────────────────────────────────────

export interface PayCycleInfo {
  type: PayCycle
  periodStart: string          // ISO date
  periodEnd: string            // ISO date
  paydayDate: string           // ISO date
  cutoffDate: string           // ISO date
  daysElapsed: number
  totalDays: number            // 31 for monthly, 5 for weekly
}

// ── Financial Breakdown ─────────────────────────────────────

export interface FinancialBreakdown {
  earnedWage: number
  previousAdvance: number
  maxAllowed: number           // earnedWage × maxPercent - previousAdvance
  requestedAmount: number
  remainingAfterRequest: number
}

// ── Department ──────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  nameTh: string
  headCount: number
}

// ── HR User ─────────────────────────────────────────────────

export interface HRUser {
  id: string
  name: string
  email: string
  role: 'hr_manager' | 'hr_officer' | 'accountant'
  avatarUrl?: string
}

// ── EWA Policy ──────────────────────────────────────────────

export interface EWAPolicy {
  payCycle: PayCycle
  maxPercent: number           // 0–70, default 50
  maxRequestsPerPeriod: number
  minAmount: number            // minimum request amount
  autoApproval: boolean
  autoApprovalThreshold: number
  approvalChain: ApprovalChain
  weeklyPayday?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
  ewaCutoffDays: number        // days before payday when requests close
  blackoutDates: string[]      // ISO dates
}

// ── Notification Settings ───────────────────────────────────

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

// ── Report Data ─────────────────────────────────────────────

export interface DailyDisbursement {
  date: string                 // ISO date
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

// ── Onboarding ──────────────────────────────────────────────

export type OnboardingStep = 'company_verify' | 'otp_verify' | 'complete'

export interface OnboardingState {
  step: OnboardingStep
  companyCode: string
  employeeCode: string
  employeeId?: string
  employeeName?: string
  phoneMasked?: string
  companyName?: string
  companyId?: string
  lineUserId: string
}

export interface VerifyEmployeeRequest {
  companyCode: string
  employeeCode: string
}

export interface VerifyEmployeeResponse {
  employeeId: string
  nameTh: string
  phoneMasked: string
  companyName: string
  companyId: string
}

export interface SendOtpRequest {
  employeeId: string
}

export interface SendOtpResponse {
  sent: boolean
  expiresInSeconds: number
}

export interface VerifyOtpRequest {
  employeeId: string
  otp: string
  lineUserId: string
}

export interface VerifyOtpResponse {
  success: boolean
  authToken: string
  companyId: string
}
