import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchParams } from "next/navigation";

import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

import { LiffOnboardingPage } from "./liff-onboarding-page";

const { postMock, setCompanyIdMock, setAuthTokenMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  setCompanyIdMock: vi.fn(),
  setAuthTokenMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getApiClient: () => ({
    post: postMock,
    setCompanyId: setCompanyIdMock,
  }),
  setAuthToken: setAuthTokenMock,
}));

const employeeResponse = {
  employeeId: "emp-db-1",
  nameTh: "สมชาย ใจดี",
  phoneMasked: "08x-xxx-1234",
  companyName: "Siam Manufacturing",
  companyId: "company-smpc",
};

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    back: "Back",
    error: "Error",
    loading: "Loading",
  },
  onboarding: {
    stepIndicator: "Step {current} of {total}",
    step1Title: "Connect Employee Account",
    step1Description: "Verify your employee ID to link your LINE account with the company.",
    companyCodeLabel: "Company Code",
    companyCodePlaceholder: "e.g. SMPC, CPALL",
    companyCodeAutoFilled: "Auto-filled from factory sign",
    employeeCodeLabel: "Employee ID",
    employeeCodePlaceholder: "e.g. EMP-0001",
    verifyButton: "Connect Employee Account",
    verifyError: "Employee not found",
    step2Title: "Verify Security Code (OTP)",
    step2Description: "Enter the 6-digit code sent to {phone}.",
    otpLabel: "6-digit OTP",
    otpPlaceholder: "000000",
    otpButton: "Verify Security Code",
    otpError: "Invalid or expired OTP",
    otpResend: "Resend Code",
    step3Title: "Connection Successful!",
    step3Description: "Your LINE account has been linked to PayDay+ successfully.",
    summaryCompany: "Company",
    summaryEmployeeId: "Employee ID",
    summaryName: "Employee Name",
    summaryPayCycle: "Pay Cycle",
    enterAppButton: "Enter App",
    lineConnected: "LINE Connected",
  },
};

const lineProfile = {
  userId: "U1234567890",
  displayName: "Mock LINE User",
  pictureUrl: "https://profile.line.example/avatar.jpg",
};

function mockSearchParams(query = "") {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>,
  );
}

function renderPage(onComplete = vi.fn()) {
  renderWithIntl(
    <LiffOnboardingPage lineProfile={lineProfile} onComplete={onComplete} />,
    { messages },
  );
  return onComplete;
}

async function fillAndVerifyEmployee() {
  fireEvent.change(screen.getByLabelText("Company Code"), {
    target: { value: "SMPC" },
  });
  fireEvent.change(screen.getByLabelText("Employee ID"), {
    target: { value: "EMP-0001" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Connect Employee Account" }),
  );
  await screen.findByRole("heading", {
    name: "Verify Security Code (OTP)",
  });
}

describe("LiffOnboardingPage", () => {
  beforeEach(() => {
    localStorage.clear();
    postMock.mockReset();
    setCompanyIdMock.mockReset();
    setAuthTokenMock.mockReset();
    mockSearchParams();
  });

  it("renders step 1 form with company code and employee ID inputs", () => {
    renderPage();

    expect(screen.getByLabelText("Company Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Employee ID")).toBeInTheDocument();
  });

  it("auto-fills company code from URL ?company=SMPC", () => {
    mockSearchParams("company=SMPC");

    renderPage();

    expect(screen.getByLabelText("Company Code")).toHaveValue("SMPC");
    expect(screen.getByLabelText("Company Code")).toBeDisabled();
  });

  it("shows auto-fill tag when company comes from QR", () => {
    mockSearchParams("company=SMPC");

    renderPage();

    expect(screen.getByText("Auto-filled from factory sign")).toBeInTheDocument();
  });

  it("disables submit button when inputs are empty", () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: "Connect Employee Account" }),
    ).toBeDisabled();
  });

  it("shows error when employee is not found", async () => {
    postMock.mockRejectedValueOnce({ statusCode: 404 });
    renderPage();

    fireEvent.change(screen.getByLabelText("Company Code"), {
      target: { value: "SMPC" },
    });
    fireEvent.change(screen.getByLabelText("Employee ID"), {
      target: { value: "EMP-404" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Connect Employee Account" }),
    );

    expect(await screen.findByText("Employee not found")).toBeInTheDocument();
  });

  it("transitions to step 2 on successful verify", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 });
    renderPage();

    await fillAndVerifyEmployee();

    expect(screen.getByRole("heading", { name: "Verify Security Code (OTP)" }))
      .toBeInTheDocument();
  });

  it("displays masked phone number in step 2", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 });
    renderPage();

    await fillAndVerifyEmployee();

    expect(screen.getByText(/08x-xxx-1234/)).toBeInTheDocument();
  });

  it("validates OTP length is exactly 6 digits", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 });
    renderPage();
    await fillAndVerifyEmployee();

    const input = screen.getByLabelText("6-digit OTP");
    const button = screen.getByRole("button", { name: "Verify Security Code" });

    fireEvent.change(input, { target: { value: "12345" } });
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: "123456" } });
    expect(button).not.toBeDisabled();
    fireEvent.change(input, { target: { value: "1234567" } });
    expect(input).toHaveValue("123456");
  });

  it("shows error on invalid OTP", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 })
      .mockRejectedValueOnce({ statusCode: 401 });
    renderPage();
    await fillAndVerifyEmployee();

    fireEvent.change(screen.getByLabelText("6-digit OTP"), {
      target: { value: "111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Security Code" }));

    expect(await screen.findByText("Invalid or expired OTP")).toBeInTheDocument();
  });

  it("transitions to step 3 and shows summary on success", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 })
      .mockResolvedValueOnce({
        success: true,
        authToken: "auth-token",
        companyId: "company-smpc",
      });
    renderPage();
    await fillAndVerifyEmployee();

    fireEvent.change(screen.getByLabelText("6-digit OTP"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Security Code" }));

    expect(await screen.findByText("Connection Successful!")).toBeInTheDocument();
    expect(screen.getByText("Siam Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("สมชาย ใจดี")).toBeInTheDocument();
    expect(screen.getByText("EMP-0001")).toBeInTheDocument();
  });

  it("calls onComplete with companyId and employeeId", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 })
      .mockResolvedValueOnce({
        success: true,
        authToken: "auth-token",
        companyId: "company-smpc",
      });
    const onComplete = renderPage();
    await fillAndVerifyEmployee();

    fireEvent.change(screen.getByLabelText("6-digit OTP"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Security Code" }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith("company-smpc", "emp-db-1");
    });
  });

  it("saves companyId to localStorage after completion", async () => {
    postMock
      .mockResolvedValueOnce(employeeResponse)
      .mockResolvedValueOnce({ sent: true, expiresInSeconds: 300 })
      .mockResolvedValueOnce({
        success: true,
        authToken: "auth-token",
        companyId: "company-smpc",
      });
    renderPage();
    await fillAndVerifyEmployee();

    fireEvent.change(screen.getByLabelText("6-digit OTP"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Security Code" }));

    await waitFor(() => {
      expect(localStorage.getItem("payday-company-id")).toBe("company-smpc");
    });
  });
});
