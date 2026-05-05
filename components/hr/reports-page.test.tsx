import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ReportsPageContent } from "./reports-page";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

const toastMock = vi.fn();

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

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

  it("renders transfer status section with retry buttons for failed items", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    expect(
      screen.getByRole("heading", { name: "Transfer Status" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry Failed" }),
    ).toBeInTheDocument();
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

    expect(toastMock).toHaveBeenCalledWith({
      variant: "success",
      message: "PDF exported",
    });
  });

  it("retries failed transfer and shows info toast", () => {
    renderWithIntl(<ReportsPageContent />, { messages });

    const retryButton = screen.getByRole("button", { name: "Retry Failed" });
    fireEvent.click(retryButton);

    expect(toastMock).toHaveBeenCalledWith({
      variant: "info",
      message: "Retrying transfer",
    });
  });
});
