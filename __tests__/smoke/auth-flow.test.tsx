import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { defaultMessages, renderWithIntl } from "@/tests/i18n/test-utils";

const { pushMock, createMock, previewMock, verifyPinMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  createMock: vi.fn(),
  previewMock: vi.fn(),
  verifyPinMock: vi.fn(),
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    style,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/request",
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/liff-client", () => ({
  loadLiffClient: vi.fn(() =>
    Promise.resolve({
      init: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: vi.fn(() => true),
      login: vi.fn(),
      isInClient: vi.fn(() => true),
      getProfile: vi.fn().mockResolvedValue({
        userId: "U1234567890",
        displayName: "LINE User",
        pictureUrl: "https://line.example/avatar.jpg",
      }),
      getDecodedIDToken: vi.fn(() => ({ email: "line@example.com" })),
    }),
  ),
}));

vi.mock("@/lib/api/hooks/use-employees", () => ({
  useEmployeeCurrentPeriod: vi.fn(() => ({
    data: {
      label: "May 2026",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      payDate: "2026-05-31",
      cutoffDate: "2026-05-25",
      workedDays: 14,
      totalWorkDays: 22,
      earnedToDate: 9200,
      previousEWAThisPeriod: 1100,
      maxWithdrawable: 4600,
      usedRequests: 1,
      remainingRequests: 1,
    },
    loading: false,
    error: null,
  })),
  useEmployee: vi.fn(() => ({
    data: {
      id: "EMP-001",
      nameTh: "สมชาย ใจดี",
      employeeCode: "EMP-001",
      bankAccountMasked: "xxx-x-xx123-4",
    },
    loading: false,
    error: null,
  })),
}));

vi.mock("@/lib/api/hooks/use-ewa-requests", () => ({
  usePreviewEWARequest: vi.fn(() => ({
    preview: previewMock,
    loading: false,
    error: null,
  })),
  useEWARequestActions: vi.fn(() => ({
    create: createMock,
    loading: false,
    error: null,
  })),
}));

import { AuthGate } from "@/components/liff-auth-gate";
import { LiffRequestPage } from "@/components/liff-request-page";
import { HRLoginPage } from "@/components/hr/hr-login-page";

const employee = {
  id: "EMP-001",
  employeeCode: "EMP-001",
  name: "Somchai Jaidee",
  nameTh: "สมชาย ใจดี",
  department: "Production",
  position: "Operator",
  payCycle: "monthly",
  workType: "onsite",
  baseSalary: 30000,
  bankAccountMasked: "xxx-x-xx123-4",
  bankName: "KBANK",
  ewaStatus: "eligible",
  enrolledAt: "2026-01-01",
};

let session: { employee?: typeof employee | null; hrUser?: { id: string; email: string } | null } =
  {};
let lineLoginStatus: "authenticated" | "needs_linking" = "authenticated";
let verifyPinRequests = 0;

const server = setupServer(
  http.get("/api/auth/me", () => {
    if (session.employee || session.hrUser) return HttpResponse.json(session);
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }),
  http.post("/api/auth/activate", async () => {
    session = { employee };
    return HttpResponse.json({ success: true });
  }),
  http.post("/api/auth/login", async () => {
    session = { employee };
    return HttpResponse.json({ success: true });
  }),
  http.post("/api/auth/line-login", async () => {
    if (lineLoginStatus === "needs_linking") {
      return HttpResponse.json({ status: "needs_linking" });
    }
    session = { employee };
    return HttpResponse.json({ status: "authenticated" });
  }),
  http.post("/api/auth/link-line", async () => {
    session = { employee };
    return HttpResponse.json({ success: true });
  }),
  http.post("/api/auth/verify-pin", async () => {
    verifyPinRequests += 1;
    return HttpResponse.json({ verified: true });
  }),
  http.post("/api/auth/hr/login", async () => {
    session = { hrUser: { id: "hr-1", email: "hr@paydayplus.co" } };
    return HttpResponse.json({ success: true });
  }),
  http.post("/api/auth/logout", async () => {
    session = {};
    return HttpResponse.json({ success: true });
  }),
);

const messages = {
  ...defaultMessages,
  auth: {
    activationBackToLogin: "Back to login",
    activationLink: "First-time Activation",
    activationSubmit: "Activate account",
    activationTitle: "Activate your account",
    confirmPinLabel: "Confirm new PIN",
    dividerOr: "or",
    errorAlreadyActivated: "Already activated",
    errorDescription: "Please try again.",
    errorExpiredInvitation: "Invitation code expired. Please contact HR.",
    errorInvalidCredentials: "Invalid phone/email or PIN",
    errorInvalidInvitation: "Invalid invitation code",
    errorPinMismatch: "PINs do not match",
    errorTooManyAttempts: "Too many attempts. Try again in {seconds}s.",
    errorTitle: "Authentication unavailable",
    identifierLabel: "Phone or email",
    identifierPlaceholder: "name@example.com",
    invitationCodeLabel: "Invitation code",
    lineLinkButton: "Connect account",
    lineLinkGreeting: "Hello {name}",
    lineLinkTitle: "Link LINE account",
    lineLoginButton: "Log in with LINE",
    loading: "Checking session...",
    loginButton: "Sign in",
    loginTitle: "Sign in to PayDay+",
    newPinLabel: "New PIN",
    phoneLabel: "Phone number",
    phonePlaceholder: "0812345678",
    pinLabel: "6-digit PIN",
    pinPlaceholder: "••••••",
  },
  common: {
    ...defaultMessages.common,
    confirm: "Confirm",
    employeeId: "Employee ID",
    employeeName: "Employee Name",
    error: "An error occurred",
    errorLoadingData: "Could not load data",
    next: "Next",
    requestDate: "Request Date",
    status: "Status",
    success: "Your request has been submitted",
  },
  login: {
    ...defaultMessages.login,
    forgotPin: "Forgot password?",
    hrSubtitle: "Employee Advance Request System",
    hrTitle: "HR Sign In",
    loading: "Loading",
    loginButton: "Login",
    wrongPin: "Invalid credentials",
  },
  requestWizard: {
    amountError: "Amount exceeds your limit",
    availableBalance: "Available Balance",
    backToHome: "Back to Home",
    bankAccount: "Bank Account",
    customAmount: "Custom Amount",
    deductionWarning: "Will be deducted on {date}",
    editBack: "Edit",
    enterPin: "Confirm with PIN",
    invalidPin: "Invalid PIN",
    netTransferAmount: "Net Transfer Amount",
    pinConfirmDescription: "Enter your 6-digit PIN to submit this request.",
    pinConfirmTitle: "Confirm with PIN",
    pinRateLimited: "Too many attempts. Try again in {seconds}s.",
    pinStepUpLabel: "Transaction PIN",
    reason: "Reason",
    reasons: {
      education: "Education",
      emergency: "Emergency",
      medical: "Medical expenses",
      other: "Other",
      utility: "Utilities",
    },
    referenceNumber: "Reference Number",
    remainingBalance: "Remaining balance",
    requestedAmount: "Requested Amount",
    shareReceipt: "Share Receipt",
    shareReceiptText: "Advance request submitted\nAmount: {amount}\nReference: {reference}",
    step1: "Select Amount",
    step2: "Confirm",
    step3: "Done",
    successTitle: "Request Submitted!",
    summaryCard: "Summary",
    transferFee: "Transfer Fee",
    withdrawAll: "Withdraw All",
  },
};

const previewResult = {
  requestedAmount: 3000,
  transferFee: 15,
  netAmount: 2985,
  policy: { minAmount: 500, maxAmount: 10000, maxPercent: 50, maxRequests: 2 },
};

const createdRequest = {
  id: "EWA-20260525-001",
  companyId: "co-1",
  employeeId: "EMP-001",
  status: "pending" as const,
  requestedAmount: 3000,
  transferFee: 15,
  netAmount: 2985,
  earnedToDate: 9200,
  maxWithdrawable: 4600,
  periodLabel: "May 2026",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  workedDays: 14,
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
  createdAt: "2026-05-25T09:32:00.000Z",
  updatedAt: "2026-05-25T09:32:00.000Z",
};

function renderGate(children = <LiffRequestPage />) {
  return renderWithIntl(<AuthGate>{children}</AuthGate>, { messages });
}

async function submitRequestWithPin() {
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
  await screen.findByText("Summary");
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  fireEvent.change(await screen.findByLabelText("Transaction PIN"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Confirm with PIN" }));
  await screen.findByText("Request Submitted!");
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  session = {};
  lineLoginStatus = "authenticated";
  verifyPinRequests = 0;
  previewMock.mockResolvedValue(previewResult);
  createMock.mockResolvedValue(createdRequest);
  verifyPinMock.mockResolvedValue(true);
  vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "test-liff-id");
  vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "false");
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("auth smoke flow", () => {
  it("covers browser activation, employee login, and EWA request PIN confirmation", async () => {
    renderGate();

    fireEvent.click(await screen.findByRole("button", { name: "First-time Activation" }));
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("Invitation code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("New PIN"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate account" }));

    await screen.findByText("Available Balance");
    await submitRequestWithPin();
    expect(verifyPinRequests).toBe(1);

    session = {};
    renderGate(<p>Logged in</p>);
    fireEvent.change(await screen.findByLabelText("Phone or email"), {
      target: { value: "somchai@example.com" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Logged in")).toBeInTheDocument();
  });

  it("auto-authenticates a linked LIFF user through line-login", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    renderGate(<p>LIFF app</p>);

    expect(await screen.findByText("LIFF app")).toBeInTheDocument();
  });

  it("links an unlinked LIFF user with phone and PIN", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    lineLoginStatus = "needs_linking";
    renderGate(<p>Linked app</p>);

    expect(await screen.findByText("Link LINE account")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect account" }));

    expect(await screen.findByText("Linked app")).toBeInTheDocument();
  });

  it("logs HR in and redirects to dashboard", async () => {
    renderWithIntl(<HRLoginPage />, { messages });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "demo1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/en/hr/dashboard"));
  });

  it("/auth/me returns the active session and logout clears it", async () => {
    session = { employee };

    const me = await fetch("/api/auth/me");
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({
      employee: { employeeCode: "EMP-001" },
    });

    await fetch("/api/auth/logout", { method: "POST" });
    const afterLogout = await fetch("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });
});
