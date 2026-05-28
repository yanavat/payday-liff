import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { RequestDetailDrawer } from "./request-detail-drawer";
import { renderWithIntl } from "@/tests/i18n/test-utils";
import type { EmployeeDto, EWARequestDto } from "@/lib/api";

const messages = {
  common: {
    approve: "Approve",
    cancel: "Cancel",
    reason: "Reason",
    reject: "Reject",
    retry: "Retry",
    payCycle: {
      monthly: "Monthly",
      weekly: "Weekly",
    },
  },
  status: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
  },
  requests: {
    requestDate: "Request Date",
    reason: "Reason",
  },
  requestWizard: {
    reasons: {
      emergency: "Emergency",
      medical: "Medical",
      education: "Education",
      utility: "Utilities",
      other: "Other",
    },
  },
  requestDetail: {
    title: "Request Detail",
    earnedWage: "Accumulated Earnings",
    previousAdvance: "Previous Advance",
    maxAllowed: "Max Allowed",
    requestedAmount: "Requested Amount",
    transferFee: "Transfer Fee",
    netAmount: "Net Amount",
    remainingBalance: "Remaining Balance",
    requestHistory: "Request History",
    hrNote: "HR Note",
    hrNotePlaceholder: "Internal notes",
    confirmApprove: "Confirm approval?",
    confirmReject: "Confirm rejection?",
    approveSuccess: "Request approved successfully",
  },
  profile: {
    bankAccount: "Bank Account",
  },
};

const employee: EmployeeDto = {
  id: "EMP-0001",
  companyId: "COMP-001",
  employeeCode: "EMP-0001",
  name: "Somchai Jaidee",
  nameEn: null,
  avatarInitials: "SJ",
  phoneNumber: null,
  lineUserId: null,
  email: null,
  invitationCode: null,
  activated: 1,
  department: "Production",
  departmentName: "Production",
  position: "Operator",
  startDate: "2024-01-01",
  employmentType: "full_time",
  payCycle: "monthly",
  monthlySalary: 999_999,
  dailyRate: null,
  standardWorkDays: 22,
  bankName: "KBANK",
  bankAccountMasked: "xxx-x-xx123-4",
  bankAccountLast4: "1234",
  ewaEnabled: true,
  ewaEligibility: "eligible",
  ewaMaxPercent: null,
  ewaMaxRequests: null,
  ewaMinAmount: null,
  ewaMaxAmount: null,
  currentPeriod: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
  deletedAt: null,
};

const request: EWARequestDto = {
  id: "EWA-001",
  companyId: "COMP-001",
  employeeId: "EMP-0001",
  status: "pending",
  requestedAmount: 4_000,
  transferFee: 15,
  netAmount: 3_985,
  earnedToDate: 12_345,
  maxWithdrawable: 6_000,
  payCycle: "monthly",
  periodLabel: "May 2026",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  workedDays: 14,
  reason: "emergency",
  employeeNote: "Need cash today",
  hrNote: "Verified by HR",
  referenceNumber: "REF-20260528-ABC123",
  isOnBehalf: false,
  autoApproved: false,
  actorId: "EMP-0001",
  actorName: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  disbursedAt: null,
  createdAt: "2026-05-28T08:30:00.000Z",
  requestedAt: "2026-05-28T08:30:00.000Z",
  updatedAt: "2026-05-28T08:30:00.000Z",
};

describe("RequestDetailDrawer", () => {
  it("renders server-provided financial values from the request DTO", () => {
    renderWithIntl(
      <RequestDetailDrawer
        request={request}
        employee={employee}
        history={[request]}
        open
        confirmAction={null}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onCancelConfirm={vi.fn()}
        onConfirmApprove={vi.fn()}
        onConfirmReject={vi.fn()}
      />,
      { messages },
    );

    expect(screen.getByText("REF-20260528-ABC123")).toBeInTheDocument();
    expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    expect(screen.getByText("฿12,345")).toBeInTheDocument();
    expect(screen.getByText("฿6,000")).toBeInTheDocument();
    expect(screen.getAllByText("฿4,000")).toHaveLength(2);
    expect(screen.getByText("฿3,985")).toBeInTheDocument();
    expect(screen.getByText("Need cash today")).toBeInTheDocument();
  });
});
