import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/tests/i18n/test-utils";
import { HRRoleContext, type HRRole } from "./hr-auth-gate";
import { TransferExportPage } from "./transfer-export-page";
import type { EWARequestDto } from "@/lib/api/types";

const toastMock = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock })),
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const exportBatchMock = vi.fn().mockResolvedValue("csv-content");
const markTransferFailedMock = vi.fn().mockResolvedValue({ id: "EWA-001" });
const refetchMock = vi.fn();

vi.mock("@/lib/api/hooks", () => ({
  useSettings: vi.fn(() => ({
    data: { bankExportFormat: "generic" },
    loading: false,
    error: null,
  })),
  useEWARequests: vi.fn(() => ({
    data: { data: [] },
    loading: false,
    error: null,
    refetch: refetchMock,
  })),
  useEmployees: vi.fn(() => ({
    data: { data: [] },
    loading: false,
  })),
  useDepartments: vi.fn(() => ({
    data: { data: [] },
    loading: false,
  })),
  useEWARequestActions: vi.fn(() => ({
    exportBatch: exportBatchMock,
    markTransferFailed: markTransferFailedMock,
    loading: false,
    error: null,
  })),
}));

const messages = {
  common: {
    cancel: "Cancel",
    confirm: "Confirm",
    status: "Status",
    loading: "Loading",
  },
  status: {
    approved: "Approved",
    disbursed: "Disbursed",
    pending: "Pending",
    rejected: "Rejected",
  },
  transferExport: {
    title: "Transfer Export",
    subtitle: "Export approved requests to bank CSV",
    exportCsv: "Export CSV",
    selectAll: "Select all",
    employeeName: "Employee",
    department: "Department",
    amount: "Amount",
    requestedDate: "Date",
    actions: "Actions",
    alreadyExported: "Already Exported",
    markFailed: "Mark as Failed",
    confirmExportTitle: "Confirm Export",
    confirmExportMessage: "Export {count} requests totalling {total}?",
    confirmFailedTitle: "Mark as Failed",
    confirmFailedMessage: "This will re-queue the transfer for the next export.",
    select: "Select",
    empty: "No requests",
    history: "Export History",
    noHistory: "No exports yet",
    requestCount: "{count} requests",
    exportSuccess: "Exported successfully",
    requeued: "Re-queued for next export",
  },
};

function baseRequest(overrides: Partial<EWARequestDto> = {}): EWARequestDto {
  return {
    id: "EWA-001",
    companyId: "COMP-001",
    employeeId: "EMP-001",
    status: "approved",
    requestedAmount: 3_000,
    transferFee: 15,
    netAmount: 2_985,
    earnedToDate: 10_000,
    maxWithdrawable: 5_000,
    payCycle: "monthly",
    periodLabel: "May 2026",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    workedDays: 14,
    reason: "emergency",
    employeeNote: null,
    hrNote: null,
    referenceNumber: null,
    isOnBehalf: false,
    autoApproved: false,
    actorId: "EMP-001",
    actorName: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    disbursedAt: null,
    exported: false,
    exportedAt: null,
    exportedBy: null,
    createdAt: "2026-05-28T08:00:00.000Z",
    requestedAt: "2026-05-28T08:00:00.000Z",
    updatedAt: "2026-05-28T08:00:00.000Z",
    ...overrides,
  };
}

function renderPage(role: HRRole = "hr_manager") {
  return renderWithIntl(
    <HRRoleContext.Provider value={{ role }}>
      <TransferExportPage />
    </HRRoleContext.Provider>,
    { messages },
  );
}

describe("TransferExportPage", () => {
  it("disables Export CSV button when no rows are selected", async () => {
    const { useEWARequests } = await import("@/lib/api/hooks");
    vi.mocked(useEWARequests).mockReturnValue({
      data: { data: [baseRequest()] },
      loading: false,
      error: null,
      refetch: refetchMock,
    } as never);

    renderPage();

    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
  });

  it("enables Export CSV button when a row is selected", async () => {
    const { useEWARequests } = await import("@/lib/api/hooks");
    vi.mocked(useEWARequests).mockReturnValue({
      data: { data: [baseRequest()] },
      loading: false,
      error: null,
      refetch: refetchMock,
    } as never);

    renderPage();

    const checkbox = screen.getByRole("checkbox", { name: /Select EMP-001/ });
    await userEvent.click(checkbox);

    expect(screen.getByRole("button", { name: "Export CSV" })).not.toBeDisabled();
  });

  it("shows Already Exported badge on disbursed+exported rows", async () => {
    const { useEWARequests } = await import("@/lib/api/hooks");
    vi.mocked(useEWARequests).mockReturnValue({
      data: {
        data: [
          baseRequest({
            id: "EWA-002",
            status: "disbursed",
            exported: true,
            exportedAt: "2026-05-28T10:00:00.000Z",
            exportedBy: "HR-001",
            disbursedAt: "2026-05-28T10:00:00.000Z",
          }),
        ],
      },
      loading: false,
      error: null,
      refetch: refetchMock,
    } as never);

    renderPage();

    expect(screen.getByText("Already Exported")).toBeInTheDocument();
  });

  it("shows Mark as Failed button only on disbursed+exported rows", async () => {
    const { useEWARequests } = await import("@/lib/api/hooks");
    vi.mocked(useEWARequests).mockReturnValue({
      data: {
        data: [
          baseRequest({ id: "EWA-001", status: "approved", exported: false }),
          baseRequest({
            id: "EWA-002",
            status: "disbursed",
            exported: true,
            exportedAt: "2026-05-28T10:00:00.000Z",
            exportedBy: "HR-001",
            disbursedAt: "2026-05-28T10:00:00.000Z",
          }),
        ],
      },
      loading: false,
      error: null,
      refetch: refetchMock,
    } as never);

    renderPage();

    expect(screen.getByRole("button", { name: "Mark as Failed" })).toBeInTheDocument();
    // only 1 — the approved row has no Mark as Failed button
    expect(screen.getAllByRole("button", { name: "Mark as Failed" })).toHaveLength(1);
  });

  it("redirects viewer to dashboard", async () => {
    pushMock.mockClear();
    renderPage("viewer");
    expect(pushMock).toHaveBeenCalledWith("/hr/dashboard");
  });

  it("shows empty state when there are no requests", async () => {
    const { useEWARequests } = await import("@/lib/api/hooks");
    vi.mocked(useEWARequests).mockReturnValue({
      data: { data: [] },
      loading: false,
      error: null,
      refetch: refetchMock,
    } as never);

    renderPage();

    expect(screen.getByText("No requests")).toBeInTheDocument();
  });
});
