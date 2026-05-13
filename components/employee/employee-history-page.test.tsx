import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { EmployeeHistoryPage } from "./employee-history-page";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

vi.mock("@/lib/api/hooks", () => ({
  useEWARequests: () => ({
    data: {
      data: [
        {
          id: "req-history-1",
          referenceNumber: "REF-20250513-000014",
          amount: 2500,
          status: "disbursed",
          requestedAt: "2025-05-13T09:00:00",
          approvedAt: "2025-05-13T10:00:00",
          disbursedAt: "2025-05-13T11:00:00",
          approvedBy: "HR Manager",
          reason: "emergency",
          transferFee: 15,
          netTransferAmount: 2485,
          payCycle: "monthly",
          isOnBehalf: false,
          employeeId: "EMP-001",
          employeeNote: null,
          hrNote: null,
          createdAt: "2025-05-13T09:00:00",
          updatedAt: "2025-05-13T11:00:00",
        },
      ],
      total: 1,
      limit: 100,
      offset: 0,
    },
    loading: false,
    error: null,
  }),
}));

const { downloadPdfMock } = vi.hoisted(() => ({
  downloadPdfMock: vi.fn(),
}));

vi.mock("@/lib/pdf/pdf-export", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pdf/pdf-export")>(
    "@/lib/pdf/pdf-export",
  );

  return {
    ...actual,
    downloadPdf: downloadPdfMock,
  };
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  usePathname: vi.fn(() => "/en/employee/history"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

const messages = {
  ...defaultMessages,
  history: {
    title: "Withdrawal History",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    total: "Total",
    requestedDate: "Requested",
    approvedDate: "Approved",
    transferDate: "Transferred",
    approvedBy: "Approved By",
    exportPaySlip: "Export pay slip PDF",
    transferFee: "Transfer Fee",
    netTransferAmount: "Net Transfer Amount",
  },
  requests: {
    title: "EWA Request",
  },
  requestDetail: {
    hrNote: "HR note",
  },
  profile: {
    bankAccount: "Bank account",
  },
};

describe("EmployeeHistoryPage", () => {
  it("exports a pay slip PDF from an expanded history item", () => {
    renderWithIntl(<EmployeeHistoryPage />, { messages });

    // Expand the item by clicking the row
    fireEvent.click(screen.getByText("REF-20250513-000014").closest("button")!);

    fireEvent.click(
      screen.getByRole("button", { name: /Export pay slip PDF/i }),
    );

    expect(downloadPdfMock).toHaveBeenCalledWith(
      expect.any(Blob),
      "pay-slip-REF-20250513-000014.pdf",
    );
  });

  it("shows transfer fee and net transfer amount for an expanded history item", () => {
    renderWithIntl(<EmployeeHistoryPage />, { messages });

    // Expand the item by clicking the row
    fireEvent.click(screen.getByText("REF-20250513-000014").closest("button")!);

    expect(screen.getByText("Transfer Fee")).toBeInTheDocument();
    expect(screen.getByText("Net Transfer Amount")).toBeInTheDocument();
    expect(screen.getByText("฿15")).toBeInTheDocument();
    expect(screen.getByText("฿2,485")).toBeInTheDocument();
  });
});
