import type React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ReportsPageContent } from "./reports-page";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

const toastMock = vi.fn();
const { downloadPdfMock } = vi.hoisted(() => ({
  downloadPdfMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/api/hooks", async () => {
  const [{ requests }, { employees }] = await Promise.all([
    import("@/lib/mock/requests"),
    import("@/lib/mock/employees"),
  ]);

  const paginated = <T,>(data: T[]) => ({
    data,
    meta: {
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    },
  });

  return {
    useEWARequests: () => ({
      data: paginated(requests),
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    }),
    useEmployees: () => ({
      data: paginated(employees),
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    }),
  };
});

vi.mock("@/lib/pdf/pdf-export", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pdf/pdf-export")>(
    "@/lib/pdf/pdf-export",
  );

  return {
    ...actual,
    downloadPdf: downloadPdfMock,
  };
});

const messages = {
  ...defaultMessages,
  reports: {
    title: "Accountant Report",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    custom: "Custom",
    monthlyView: "Monthly",
    weeklyView: "Weekly",
    exportCsv: "Export CSV",
    exportPdf: "Export PDF",
    totalDisbursed: "Total Disbursed",
    totalRequests: "Total Requests",
    avgAmount: "Avg Amount",
    approvalRate: "Approval Rate",
    totalFees: "Total Fees",
    disbursement: "Disbursement",
    transferStatus: "Transfer Status",
    daily30Days: "Daily (30 days)",
    weekly52Weeks: "Weekly (52 weeks)",
    items: "items",
    departmentBreakdown: "Department Breakdown",
    total: "Total",
    totalAmount: "Total Amount",
    retryFailed: "Retry Failed",
    retryingTransfer: "Retrying transfer",
    exportSuccess: "{type} exported",
  },
  employees: {
    department: "Department",
  },
};

describe("ReportsPageContent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-30T12:00:00Z"));
    toastMock.mockClear();
    downloadPdfMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders page title and export buttons", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(
      screen.getByRole("heading", { name: "Accountant Report" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export CSV" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export PDF" }),
    ).toBeInTheDocument();
  });

  it("renders metric cards with correct labels", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(screen.getByText("Total Disbursed")).toBeInTheDocument();
    expect(screen.getAllByText("Total Requests").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("Avg Amount").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Approval Rate")).toBeInTheDocument();
    expect(screen.getByText("Total Fees")).toBeInTheDocument();
  });

  it("renders disbursement chart section with default monthly view", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(
      screen.getByRole("heading", { name: "Disbursement" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Daily (30 days)")).toBeInTheDocument();
  });

  it("switches to weekly view when weekly toggle is clicked", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    const weeklyButton = screen.getByRole("button", { name: "Weekly" });
    fireEvent.click(weeklyButton);

    expect(screen.getByText("Weekly (52 weeks)")).toBeInTheDocument();
  });

  it("renders department breakdown table with totals row", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(
      screen.getByRole("heading", { name: "Department Breakdown" }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByText("Department").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Total Requests").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("Total Amount").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("Avg Amount").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders transfer status section without retry buttons (rejected items excluded)", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(
      screen.getByRole("heading", { name: "Transfer Status" }),
    ).toBeInTheDocument();
    // Retry buttons must not appear — rejected requests are not transfer failures
    expect(
      screen.queryByRole("button", { name: "Retry Failed" }),
    ).not.toBeInTheDocument();
  });

  it("shows toast on CSV export", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    const csvButton = screen.getByRole("button", { name: "Export CSV" });
    fireEvent.click(csvButton);

    expect(toastMock).toHaveBeenCalledWith({
      variant: "success",
      message: "CSV exported",
    });
  });

  it("shows toast on PDF export", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    const pdfButton = screen.getByRole("button", { name: "Export PDF" });
    fireEvent.click(pdfButton);

    expect(downloadPdfMock).toHaveBeenCalledWith(
      expect.any(Blob),
      "payday-report.pdf",
    );
    expect(toastMock).toHaveBeenCalledWith({
      variant: "success",
      message: "PDF exported",
    });
  });

  it("transfer status section shows only approved/disbursed items (not rejected)", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    // The transfer status panel renders items — no retry buttons since rejected
    // requests are filtered out and only approved (processing) / disbursed (settled) appear
    const heading = screen.getByRole("heading", { name: "Transfer Status" });
    expect(heading).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Failed" })).not.toBeInTheDocument();
  });

  it("renders metric cards with icons", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    // Each MetricCard has an icon container with a green bg
    const iconContainers = document
      .querySelectorAll(".bg-primary.text-white");
    expect(iconContainers.length).toBe(5);
  });

  it("shows x-axis date labels in monthly view", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    // Day 1 label should appear as "1 May" (from 2025-05-01 mock data)
    expect(screen.getByText("1 May")).toBeInTheDocument();
    expect(screen.getByText("5 May")).toBeInTheDocument();
    expect(screen.getByText("10 May")).toBeInTheDocument();
    expect(screen.getByText("30 May")).toBeInTheDocument();
  });

  it("shows fixed tooltip with full date on bar hover and hides on leave", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 100, top: 200, right: 120, bottom: 300,
      width: 20, height: 100, x: 100, y: 200, toJSON: () => {},
    });

    renderWithIntl(<ReportsPageContent />, { messages });

    const columns = document.querySelectorAll(".cursor-pointer");
    expect(columns.length).toBeGreaterThan(0);

    fireEvent.mouseEnter(columns[0]);

    // Tooltip shows the full date including year — unique to the tooltip
    expect(screen.getByText("1 May 2025")).toBeInTheDocument();

    fireEvent.mouseLeave(columns[0]);

    expect(screen.queryByText("1 May 2025")).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("shows week labels in weekly view", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));

    expect(screen.getByText("W11")).toBeInTheDocument();
  });
});
