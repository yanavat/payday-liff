// ============================================================
// API Types - Generated from Backend OpenAPI Spec
// Backend: http://localhost:4000/docs-json
// ============================================================

export interface ApiError {
  message: string
  statusCode: number
  details?: unknown
}

// ── Companies ──────────────────────────────────────────────

export interface CompanyDto {
  id: string
  name: string
  nameEn?: string | null
  code?: string | null
  active?: boolean
  nameTh?: string
  taxId?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyDto {
  name: string
  nameTh: string
  taxId: string
  address?: string
}

export interface UpdateCompanyDto {
  name?: string
  nameTh?: string
  taxId?: string
  address?: string
}

// ── Employees ───────────────────────────────────────────────

export interface EmployeeDto {
  id: string
  companyId: string
  employeeCode: string | null
  name: string
  nameEn: string | null
  avatarInitials: string | null
  phoneNumber: string | null
  lineUserId: string | null
  email: string | null
  invitationCode: string | null
  activated: number
  department: string
  departmentName: string | null
  position: string | null
  startDate: string
  employmentType: "full_time" | "part_time" | "contract"
  payCycle: "monthly" | "weekly"
  monthlySalary: number | null
  dailyRate: number | null
  standardWorkDays: number
  bankAccountMasked: string | null
  bankName: string | null
  bankAccountLast4: string | null
  ewaEnabled: boolean | null
  ewaEligibility: "eligible" | "quota_used" | "suspended" | null
  ewaMaxPercent: number | null
  ewaMaxRequests: number | null
  ewaMinAmount: number | null
  ewaMaxAmount: number | null
  currentPeriod: CurrentPeriodSnapshot | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CurrentPeriodSnapshot {
  label: string
  startDate: string
  endDate: string
  payDate: string
  cutoffDate: string
  workedDays: number
  totalWorkDays: number
  earnedToDate: number
  previousEWAThisPeriod: number
  maxWithdrawable: number
  usedRequests: number
  remainingRequests: number
}

export interface CreateEmployeeDto {
  id: string
  employeeCode?: string
  name: string
  nameEn?: string
  avatarInitials?: string
  phoneNumber?: string
  email?: string
  department: string
  departmentName?: string
  position?: string
  startDate: string
  employmentType: "full_time" | "part_time" | "contract"
  payCycle: "monthly" | "weekly"
  monthlySalary?: number
  dailyRate?: number
  standardWorkDays: number
  bankName?: string
  bankAccountMasked?: string
  bankAccountLast4?: string
}

export interface UpdateEmployeeDto {
  employeeCode?: string
  name?: string
  nameEn?: string
  avatarInitials?: string
  phoneNumber?: string
  email?: string
  department?: string
  departmentName?: string
  position?: string
  startDate?: string
  employmentType?: "full_time" | "part_time" | "contract"
  payCycle?: "monthly" | "weekly"
  monthlySalary?: number
  dailyRate?: number
  standardWorkDays?: number
  bankName?: string
  bankAccountMasked?: string
  bankAccountLast4?: string
}

export interface EmployeeImportErrorDto {
  row: number
  reason: string
}

export interface EmployeeImportSummaryDto {
  total: number
  success: number
  failed: number
  errors: EmployeeImportErrorDto[]
}

export interface EwaOverridesDto {
  ewaEnabled?: boolean | null
  ewaEligibility?: "eligible" | "quota_used" | "suspended" | null
  ewaMaxPercent?: number | null
  ewaMaxRequests?: number | null
  ewaMinAmount?: number | null
  ewaMaxAmount?: number | null
}

// ── EWA Requests ─────────────────────────────────────────────

export interface EWARequestDto {
  id: string
  companyId: string
  employeeId: string
  employee?: EmployeeDto
  status: "pending" | "approved" | "rejected" | "disbursed" | "cancelled"
  requestedAmount: number
  transferFee: number
  netAmount: number
  earnedToDate: number
  maxWithdrawable: number
  payCycle: "monthly" | "weekly"
  periodLabel: string
  periodStart: string
  periodEnd: string
  workedDays: number
  reason: string | null
  employeeNote: string | null
  hrNote: string | null
  referenceNumber: string | null
  isOnBehalf: boolean
  autoApproved: boolean
  actorId: string
  actorName: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  disbursedAt: string | null
  exported?: boolean
  exportedAt?: string | null
  exportedBy?: string | null
  createdAt: string
  requestedAt: string
  updatedAt: string
}

export interface EWAHistoryRequestDto {
  id: string
  companyId: string
  employeeId: string
  status: "pending" | "approved" | "rejected" | "disbursed" | "cancelled"
  requestedAmount: number
  transferFee: number
  netAmount: number
  earnedToDate: number
  maxWithdrawable: number
  periodLabel: string
  periodStart: string
  periodEnd: string
  workedDays: number
  isOnBehalf: boolean
  autoApproved: boolean
  actorId: string
  actorName: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  disbursedAt: string | null
  createdAt: string
  updatedAt: string
  requestedAt?: string | null
  amount?: number
  referenceNumber?: string | null
  reason?: "medical" | "education" | "emergency" | "utility" | "other" | null
  netTransferAmount?: number
  hrNote?: string | null
  employeeNote?: string | null
  payCycle?: "monthly" | "weekly"
  employee?: EmployeeDto
}

export interface CreateRequestDto {
  amount: number
  reason?: "medical" | "education" | "emergency" | "utility" | "other"
  employeeNote?: string
}

export interface OnBehalfRequestDto {
  employeeId: string
  amount: number
  reason: "medical" | "education" | "emergency" | "utility" | "other"
  employeeNote?: string
  submittedBy: string
}

export interface PreviewRequestDto {
  employeeId: string
  amount: number
  reason?: "medical" | "education" | "emergency" | "utility" | "other"
  employeeNote?: string
}

export interface PreviewResultDto {
  employeeId?: string
  payCycle?: string
  periodLabel?: string
  workedDays?: number
  totalWorkDays?: number
  earnedToDate?: number
  previousEWAThisPeriod?: number
  maxWithdrawable?: number
  requestedAmount: number
  transferFee: number
  netAmount: number
  autoApproved?: boolean
  remainingRequests?: number
  policy?: {
    maxPercent: number
    maxRequests: number
    minAmount: number
    maxAmount: number
  }
  /** @deprecated use earnedToDate */
  earnedWage?: number
  /** @deprecated use previousEWAThisPeriod */
  previousAdvance?: number
  /** @deprecated use maxWithdrawable */
  maxAllowed?: number
  netTransferAmount?: number
  remainingAfterRequest?: number
  isValid?: boolean
  errors?: string[]
  violationReason?: string
}

export interface RejectRequestDto {
  hrNote?: string
}

// ── HR Users ─────────────────────────────────────────────────

export interface HRUserDto {
  id: string
  name: string
  email: string
  role: "hr_manager" | "accountant" | "viewer"
  department: string | null
  departmentName?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateHRUserDto {
  name: string
  email: string
  role: "hr_manager" | "accountant" | "viewer"
  department?: string | null
}

export interface UpdateHRUserDto {
  name?: string
  email?: string
  role?: "hr_manager" | "accountant" | "viewer"
  department?: string | null
  isActive?: boolean
}

// ── Departments ───────────────────────────────────────────────

export interface DepartmentDto {
  id: string
  name: string
  nameTh: string
  headCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentDto {
  name: string
  nameTh: string
}

export interface UpdateDepartmentDto {
  name?: string
  nameTh?: string
}

// ── Payroll Cycles ───────────────────────────────────────────

export interface PayrollCycleDto {
  id: string
  type: "monthly" | "weekly"
  periodStart: string
  periodEnd: string
  paydayDate: string
  cutoffDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdatePayrollCycleDto {
  periodStart?: string
  periodEnd?: string
  paydayDate?: string
  cutoffDate?: string
  isActive?: boolean
}

// ── Settings ─────────────────────────────────────────────────

export interface AppSettingsDto {
  companyId: string
  companyName?: string
  companyLogoUrl?: string | null
  bankExportFormat?: "generic" | "scb_anywhere"
  ewaMonthlyPolicy: EwaPolicyDto
  ewaWeeklyPolicy: EwaPolicyDto
  notificationSettings: NotificationSettingsDto
  createdAt: string
  updatedAt: string
}

export interface UpdateSettingsDto {
  companyName?: string
  companyLogoUrl?: string | null
  bankExportFormat?: "generic" | "scb_anywhere"
}

export interface EwaPolicyDto {
  maxPercent: number
  maxRequestsPerPeriod: number
  minAmount: number
  autoApprovalEnabled: boolean
  autoApprovalThreshold: number
  approvalChain: "single" | "two_step"
  weeklyPayDayOfWeek?: number
  weeklyCutoffDayOfWeek?: number
  weeklyCutoffHour?: number
  blackoutDates: string[]
}

export interface PartialEwaPolicyDto {
  maxPercent?: number
  maxRequestsPerPeriod?: number
  minAmount?: number
  autoApprovalEnabled?: boolean
  autoApprovalThreshold?: number
  approvalChain?: "single" | "two_step"
  weeklyPayDayOfWeek?: number
  weeklyCutoffDayOfWeek?: number
  weeklyCutoffHour?: number
  blackoutDates?: string[]
}

export interface NotificationSettingsDto {
  onApproval: {
    email: boolean
    line: boolean
  }
  onRejection: {
    email: boolean
    line: boolean
  }
  onDisbursement: {
    email: boolean
    line: boolean
  }
  onPaydayReminder: {
    email: boolean
    line: boolean
  }
  onCutoffWarning: {
    email: boolean
    line: boolean
  }
}

export interface UpdateNotificationSettingsDto {
  onApproval?: {
    email?: boolean
    line?: boolean
  }
  onRejection?: {
    email?: boolean
    line?: boolean
  }
  onDisbursement?: {
    email?: boolean
    line?: boolean
  }
  onPaydayReminder?: {
    email?: boolean
    line?: boolean
  }
  onCutoffWarning?: {
    email?: boolean
    line?: boolean
  }
}

// ── LINE API ─────────────────────────────────────────────────

export interface PushMessageDto {
  to: string
  messages: Array<{
    type: string
    [key: string]: unknown
  }>
}

export interface NotifyRequestStatusDto {
  requestId: string
  status: "approved" | "rejected" | "disbursed"
}

// ── Bank Transfers ───────────────────────────────────────────

export interface BankTransferDto {
  id: string
  ewaRequestId: string
  employeeId: string
  employeeName: string
  bankAccountMasked: string
  bankName: string
  amount: number
  status: "pending" | "processing" | "settled" | "failed"
  attemptedAt: string
  settledAt?: string
  failureReason?: string
  referenceNumber?: string
  createdAt: string
  updatedAt: string
}

export interface FailTransferDto {
  failureReason: string
}

export interface SettleTransferDto {
  referenceNumber: string
}

// ── Audit Logs ───────────────────────────────────────────────

export interface AuditLogDto {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// ── Notifications ─────────────────────────────────────────────

export interface NotificationDto {
  id: string
  userId: string
  type:
    | "approval"
    | "rejection"
    | "disbursement"
    | "payday_reminder"
    | "cutoff_warning"
  channel: "email" | "line" | "sms"
  status: "pending" | "sent" | "failed"
  title: string
  body: string
  metadata?: Record<string, unknown>
  sentAt?: string
  failedAt?: string
  failureReason?: string
  createdAt: string
}

// ── Common Response Types ─────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface ListParams {
  limit?: number
  offset?: number
  sort?: string
  [key: string]: unknown // Index signature for compatibility with Record<string, unknown>
}

// ── Effective Policy Response ───────────────────────────────

export interface EffectivePolicyResponse {
  maxPercent: number
  maxRequestsPerPeriod: number
  minAmount: number
  autoApproval: boolean
  autoApprovalThreshold: number
  approvalChain: "single" | "two_step"
  weeklyPayday?: "mon" | "tue" | "wed" | "thu" | "fri"
  ewaCutoffDays: number
  blackoutDates: string[]
  isOverridden: boolean
}

// ── Current Period Response ─────────────────────────────────

export interface CurrentPeriodResponse {
  label: string
  startDate: string
  endDate: string
  payDate: string
  cutoffDate: string
  workedDays: number
  totalWorkDays: number
  earnedToDate: number
  previousEWAThisPeriod: number
  maxWithdrawable: number
  usedRequests: number
  remainingRequests: number
}

// ── Local UI / mock model types ──────────────────────────────

export type Locale = "th" | "en" | "my"

export type PayCycle = "monthly" | "weekly"

export type WorkType = "remote" | "onsite" | "hybrid"

export type EWAStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed"
  | "cancelled"

export type EmployeeEWAStatus = "eligible" | "limit_reached" | "suspended"

export type ApprovalChain = "single" | "two_step"

export type NotificationChannel = "email" | "line" | "sms"

/** @deprecated Prefer EmployeeDto for API-backed HR screens. */
export interface Employee {
  id: string
  employeeCode?: string
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

export type EWAReason =
  | "medical"
  | "education"
  | "emergency"
  | "utility"
  | "other"

/** @deprecated Prefer EWARequestDto for API-backed HR screens. */
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
  role: "hr_manager" | "hr_officer" | "accountant"
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
  weeklyPayday?: "mon" | "tue" | "wed" | "thu" | "fri"
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
  status: "processing" | "settled" | "failed"
  attemptedAt: string
  settledAt?: string
  failureReason?: string
}

export type OnboardingStep = "company_verify" | "otp_verify" | "complete"

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
