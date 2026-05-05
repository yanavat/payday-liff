import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { EmployeeRequestPage } from "./employee-request-page";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

const { confettiMock } = vi.hoisted(() => ({ confettiMock: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: confettiMock }));

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

vi.mock("@/components/ui/pin-pad", () => ({
  PINPad: ({
    onChange,
    onComplete,
  }: {
    onChange: (v: string) => void;
    onComplete: (v: string) => void;
  }) => (
    <div data-testid="pin-pad">
      <button
        type="button"
        onClick={() => {
          onChange("1111");
          onComplete("1111");
        }}
      >
        Wrong PIN
      </button>
      <button
        type="button"
        onClick={() => {
          onChange("1234");
          onComplete("1234");
        }}
      >
        Correct PIN
      </button>
    </div>
  ),
}));

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    next: "Next",
    error: "An error occurred",
    confirm: "Confirm",
    employeeName: "Employee Name",
    employeeId: "Employee ID",
    requestDate: "Request Date",
    status: "Status",
    success: "Your request has been submitted",
  },
  requestWizard: {
    step1: "Select Amount",
    step2: "Confirm",
    step3: "Done",
    availableBalance: "Available Balance",
    customAmount: "Custom Amount",
    amountError: "Amount exceeds your limit",
    remainingBalance: "Remaining balance",
    reason: "Reason",
    reasons: {
      emergency: "Emergency",
      medical: "Medical expenses",
      education: "Education",
      utility: "Utilities",
      other: "Other",
    },
    summaryCard: "Summary",
    requestedAmount: "Requested Amount",
    bankAccount: "Bank Account",
    deductionWarning: "Will be deducted on {date}",
    enterPin: "Confirm with PIN",
    editBack: "Edit",
    successTitle: "Request Submitted!",
    referenceNumber: "Reference Number",
    backToHome: "Back to Home",
    shareReceipt: "Share Receipt",
    withdrawAll: "Withdraw All",
  },
};

function goToStep2() {
  fireEvent.click(screen.getByRole("button", { name: /Next →/i }));
}

function goToStep3() {
  goToStep2();
  fireEvent.click(screen.getByRole("button", { name: "Correct PIN" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("EmployeeRequestPage — step 1", () => {
  beforeEach(() => {
    renderWithIntl(<EmployeeRequestPage />, { messages });
  });

  it("shows available balance", () => {
    expect(screen.getByText("Available Balance")).toBeInTheDocument();
    expect(screen.getByText("฿3,500")).toBeInTheDocument();
  });

  it("renders quick amount buttons", () => {
    expect(screen.getByRole("button", { name: "฿1,000" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "฿2,000" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "฿3,000" })).toBeInTheDocument();
  });

  it("selecting a quick amount updates the input", () => {
    fireEvent.click(screen.getByRole("button", { name: "฿1,000" }));
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(1000);
  });

  it("shows remaining balance as amount changes", () => {
    fireEvent.click(screen.getByRole("button", { name: "฿1,000" }));
    expect(screen.getByText(/Remaining balance: ฿2,500/i)).toBeInTheDocument();
  });

  it("shows validation error when amount exceeds limit", () => {
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "9999" } });
    expect(screen.getByText("Amount exceeds your limit")).toBeInTheDocument();
  });

  it("disables Next button when amount is invalid", () => {
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "9999" } });
    expect(screen.getByRole("button", { name: /Next →/i })).toBeDisabled();
  });

  it("withdraw all button sets amount to available balance", () => {
    fireEvent.click(screen.getByRole("button", { name: /Withdraw All/i }));
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(3500);
  });

  it("advances to step 2 when Next is clicked with valid amount", () => {
    goToStep2();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });
});

describe("EmployeeRequestPage — step 2", () => {
  beforeEach(() => {
    renderWithIntl(<EmployeeRequestPage />, { messages });
    goToStep2();
  });

  it("shows summary with employee details and request amount", () => {
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Requested Amount")).toBeInTheDocument();
    expect(screen.getByText("฿3,000")).toBeInTheDocument();
  });

  it("shows deduction warning", () => {
    expect(screen.getByText(/Will be deducted on/i)).toBeInTheDocument();
  });

  it("Confirm button is disabled until 4-digit PIN is entered", () => {
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Correct PIN" }));
    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
  });

  it("shows error and stays on step 2 when wrong PIN is entered", () => {
    fireEvent.click(screen.getByRole("button", { name: "Wrong PIN" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText("An error occurred")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("back button returns to step 1", () => {
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(screen.getByText("Available Balance")).toBeInTheDocument();
  });
});

describe("EmployeeRequestPage — step 3 (success)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    renderWithIntl(<EmployeeRequestPage />, { messages });
    goToStep3();
  });

  afterEach(() => {
    vi.useRealTimers();
    confettiMock.mockClear();
  });

  it("shows success title and message", () => {
    expect(screen.getByText("Request Submitted!")).toBeInTheDocument();
    expect(
      screen.getByText("Your request has been submitted"),
    ).toBeInTheDocument();
  });

  it("shows reference number and requested amount", () => {
    expect(screen.getByText("Reference Number")).toBeInTheDocument();
    expect(screen.getByText("EWA-20250501-041")).toBeInTheDocument();
    expect(screen.getByText("฿3,000")).toBeInTheDocument();
  });

  it("shows back to home link pointing to employee home", () => {
    const link = screen.getByRole("link", { name: "Back to Home" });
    expect(link).toHaveAttribute("href", "/employee/home");
  });

  it("shows share receipt button", () => {
    expect(
      screen.getByRole("button", { name: /Share Receipt/i }),
    ).toBeInTheDocument();
  });

  it("fires confetti after a short delay", () => {
    expect(confettiMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(confettiMock).toHaveBeenCalledTimes(2);
  });

  it("fires a second confetti burst at 600ms", () => {
    vi.advanceTimersByTime(700);
    expect(confettiMock).toHaveBeenCalledTimes(3);
  });

  it("fires confetti with brand colors", () => {
    vi.advanceTimersByTime(400);
    const [firstCall] = confettiMock.mock.calls;
    expect(firstCall[0].colors).toContain("#2dbd8f");
  });
});
