// ============================================================
// API Types - Generated from Backend OpenAPI Spec
// Backend: http://localhost:4000/docs-json
// ============================================================

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

// ── Companies ──────────────────────────────────────────────

export interface CompanyDto {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
  active?: boolean;
  nameTh?: string;
  taxId?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  nameTh: string;
  taxId: string;
  address?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  nameTh?: string;
  taxId?: string;
  address?: string;
}

// ── Employees ───────────────────────────────────────────────

export interface EmployeeDto {
  id: string;
  name: string;
  nameTh: string;
  employeeCode: string;
  department: string;
  position: string;
  payCycle: "monthly" | "weekly";
  workType: "remote" | "onsite" | "hybrid";
  baseSalary: number;
  bankAccountMasked: string;
  bankName: string;
  ewaStatus: "eligible" | "limit_reached" | "suspended";
  enrolledAt: string;
  isActive: boolean;
  lineUserId?: string;
  createdAt: string;
  updatedAt: string;
  ewaOverrides?: EwaOverridesDto;
}

export interface CreateEmployeeDto {
  name: string;
  nameTh: string;
  employeeCode: string;
  department: string;
  position: string;
  payCycle: "monthly" | "weekly";
  workType: "remote" | "onsite" | "hybrid";
  baseSalary: number;
  bankAccountMasked: string;
  bankName: string;
  lineUserId?: string;
}

export interface UpdateEmployeeDto {
  name?: string;
  nameTh?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  payCycle?: "monthly" | "weekly";
  workType?: "remote" | "onsite" | "hybrid";
  baseSalary?: number;
  bankAccountMasked?: string;
  bankName?: string;
  lineUserId?: string;
  isActive?: boolean;
}

export interface EwaOverridesDto {
  maxPercent?: number | null;
  maxRequestsPerPeriod?: number | null;
  minAmount?: number | null;
  autoApproval?: boolean | null;
  autoApprovalThreshold?: number | null;
}

// ── EWA Requests ─────────────────────────────────────────────

export interface EWARequestDto {
  id: string;
  companyId: string;
  employeeId: string;
  employee?: EmployeeDto;
  status: "pending" | "approved" | "rejected" | "disbursed" | "cancelled";
  requestedAmount: number;
  transferFee: number;
  netAmount: number;
  earnedToDate: number;
  maxWithdrawable: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  isOnBehalf: boolean;
  autoApproved: boolean;
  actorId: string;
  actorName: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  disbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestDto {
  employeeId: string;
  amount: number;
  reason: "medical" | "education" | "emergency" | "utility" | "other";
  employeeNote?: string;
}

export interface OnBehalfRequestDto {
  employeeId: string;
  amount: number;
  reason: "medical" | "education" | "emergency" | "utility" | "other";
  employeeNote?: string;
  submittedBy: string;
}

export interface PreviewRequestDto {
  employeeId: string;
  amount: number;
  reason: "medical" | "education" | "emergency" | "utility" | "other";
}

export interface PreviewResultDto {
  isValid: boolean;
  errors?: string[];
  earnedWage: number;
  previousAdvance: number;
  maxAllowed: number;
  requestedAmount: number;
  transferFee: number;
  netTransferAmount: number;
  remainingAfterRequest: number;
  violationReason?: string;
}

export interface RejectRequestDto {
  hrNote?: string;
}

// ── HR Users ─────────────────────────────────────────────────

export interface HRUserDto {
  id: string;
  name: string;
  email: string;
  role: "hr_manager" | "accountant" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHRUserDto {
  name: string;
  email: string;
  role: "hr_manager" | "accountant" | "viewer";
}

export interface UpdateHRUserDto {
  name?: string;
  email?: string;
  role?: "hr_manager" | "accountant" | "viewer";
  isActive?: boolean;
}

// ── Departments ───────────────────────────────────────────────

export interface DepartmentDto {
  id: string;
  name: string;
  nameTh: string;
  headCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  nameTh: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  nameTh?: string;
}

// ── Payroll Cycles ───────────────────────────────────────────

export interface PayrollCycleDto {
  id: string;
  type: "monthly" | "weekly";
  periodStart: string;
  periodEnd: string;
  paydayDate: string;
  cutoffDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePayrollCycleDto {
  periodStart?: string;
  periodEnd?: string;
  paydayDate?: string;
  cutoffDate?: string;
  isActive?: boolean;
}

// ── Settings ─────────────────────────────────────────────────

export interface AppSettingsDto {
  id: string;
  companyId: string;
  companyName?: string;
  ewaPolicy: {
    monthly: EwaPolicyDto;
    weekly: EwaPolicyDto;
  };
  notificationSettings: NotificationSettingsDto;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  companyName?: string;
}

export interface EwaPolicyDto {
  maxPercent: number;
  maxRequestsPerPeriod: number;
  minAmount: number;
  autoApproval: boolean;
  autoApprovalThreshold: number;
  approvalChain: "single" | "two_step";
  weeklyPayday?: "mon" | "tue" | "wed" | "thu" | "fri";
  ewaCutoffDays: number;
  blackoutDates: string[];
}

export interface PartialEwaPolicyDto {
  maxPercent?: number;
  maxRequestsPerPeriod?: number;
  minAmount?: number;
  autoApproval?: boolean;
  autoApprovalThreshold?: number;
  approvalChain?: "single" | "two_step";
  weeklyPayday?: "mon" | "tue" | "wed" | "thu" | "fri";
  ewaCutoffDays?: number;
  blackoutDates?: string[];
}

export interface NotificationSettingsDto {
  onApproval: {
    email: boolean;
    line: boolean;
  };
  onRejection: {
    email: boolean;
    line: boolean;
  };
  onDisbursement: {
    email: boolean;
    line: boolean;
  };
  onPaydayReminder: {
    email: boolean;
    line: boolean;
  };
  onCutoffWarning: {
    email: boolean;
    line: boolean;
  };
}

export interface UpdateNotificationSettingsDto {
  onApproval?: {
    email?: boolean;
    line?: boolean;
  };
  onRejection?: {
    email?: boolean;
    line?: boolean;
  };
  onDisbursement?: {
    email?: boolean;
    line?: boolean;
  };
  onPaydayReminder?: {
    email?: boolean;
    line?: boolean;
  };
  onCutoffWarning?: {
    email?: boolean;
    line?: boolean;
  };
}

// ── LINE API ─────────────────────────────────────────────────

export interface PushMessageDto {
  to: string;
  messages: Array<{
    type: string;
    [key: string]: unknown;
  }>;
}

export interface NotifyRequestStatusDto {
  requestId: string;
  status: "approved" | "rejected" | "disbursed";
}

// ── Bank Transfers ───────────────────────────────────────────

export interface BankTransferDto {
  id: string;
  ewaRequestId: string;
  employeeId: string;
  employeeName: string;
  bankAccountMasked: string;
  bankName: string;
  amount: number;
  status: "pending" | "processing" | "settled" | "failed";
  attemptedAt: string;
  settledAt?: string;
  failureReason?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FailTransferDto {
  failureReason: string;
}

export interface SettleTransferDto {
  referenceNumber: string;
}

// ── Audit Logs ───────────────────────────────────────────────

export interface AuditLogDto {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────

export interface NotificationDto {
  id: string;
  userId: string;
  type:
    | "approval"
    | "rejection"
    | "disbursement"
    | "payday_reminder"
    | "cutoff_warning";
  channel: "email" | "line" | "sms";
  status: "pending" | "sent" | "failed";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
}

// ── Common Response Types ─────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  sort?: string;
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
}

// ── Effective Policy Response ───────────────────────────────

export interface EffectivePolicyResponse {
  maxPercent: number;
  maxRequestsPerPeriod: number;
  minAmount: number;
  autoApproval: boolean;
  autoApprovalThreshold: number;
  approvalChain: "single" | "two_step";
  weeklyPayday?: "mon" | "tue" | "wed" | "thu" | "fri";
  ewaCutoffDays: number;
  blackoutDates: string[];
  isOverridden: boolean;
}

// ── Current Period Response ─────────────────────────────────

export interface CurrentPeriodResponse {
  label: string;
  startDate: string;
  endDate: string;
  payDate: string;
  cutoffDate: string;
  workedDays: number;
  totalWorkDays: number;
  earnedToDate: number;
  previousEWAThisPeriod: number;
  maxWithdrawable: number;
  usedRequests: number;
  remainingRequests: number;
}
