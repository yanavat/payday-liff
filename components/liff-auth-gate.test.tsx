import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiffClient } from "@/lib/liff-client";
import { defaultMessages, renderWithIntl } from "@/tests/i18n/test-utils";

import { LIFFAuthGate, useAuth, useLiffProfile } from "./liff-auth-gate";

const loadLiffClientMock = vi.fn();

vi.mock("@/lib/liff-client", () => ({
  loadLiffClient: () => loadLiffClientMock(),
}));

function createLiffClient(overrides: Partial<LiffClient> = {}): LiffClient {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn(() => true),
    login: vi.fn(),
    isInClient: vi.fn(() => true),
    getProfile: vi.fn().mockResolvedValue({
      userId: "U1234567890",
      displayName: "Mock LINE User",
      pictureUrl: "https://line.example/avatar.jpg",
      statusMessage: undefined,
    }),
    getDecodedIDToken: vi.fn(() => ({ email: "line@example.com" })),
    ...overrides,
  } as unknown as LiffClient;
}

const messages = {
  ...defaultMessages,
  auth: {
    activationLink: "First-time Activation",
    activationBackToLogin: "Back to login",
    activationSubmit: "Activate account",
    activationTitle: "Activate your account",
    confirmPinLabel: "Confirm new PIN",
    dividerOr: "or",
    errorAlreadyActivated: "Already activated",
    errorExpiredInvitation: "Invitation code expired. Please contact HR.",
    errorInvalidCredentials: "Invalid phone/email or PIN",
    errorInvalidInvitation: "Invalid invitation code",
    errorPinMismatch: "PINs do not match",
    errorTooManyAttempts: "Too many attempts. Try again in {seconds}s.",
    errorTitle: "Authentication unavailable",
    errorDescription: "Please try again.",
    identifierLabel: "Phone or email",
    identifierPlaceholder: "name@example.com",
    invitationCodeLabel: "Invitation code",
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
};

function mockFetch(responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

function renderGate(children = <p>Employee app</p>) {
  return renderWithIntl(<LIFFAuthGate>{children}</LIFFAuthGate>, { messages });
}

describe("LIFFAuthGate", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "test-liff-id");
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "false");
    loadLiffClientMock.mockResolvedValue(createLiffClient());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads an existing cookie session from /api/auth/me and provides auth context", async () => {
    mockFetch([
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    function AuthConsumer() {
      const auth = useAuth();
      return (
        <p>
          {auth.isAuthenticated ? "authenticated" : "anonymous"}:
          {auth.employee?.employeeCode}
        </p>
      );
    }

    renderGate(<AuthConsumer />);

    expect(await screen.findByText("authenticated:EMP-001")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("shows browser login state when /api/auth/me returns 401 outside LIFF", async () => {
    mockFetch([jsonResponse({ message: "Unauthorized" }, { status: 401 })]);

    renderGate();

    expect(await screen.findByText("Sign in to PayDay+")).toBeInTheDocument();
    expect(screen.queryByText("Employee app")).not.toBeInTheDocument();
    expect(loadLiffClientMock).not.toHaveBeenCalled();
  });

  it("runs LIFF line-login and shows linking state when LINE user is not linked", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ status: "needs_linking" }),
    ]);

    renderGate();

    expect(await screen.findByText("Link LINE account")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/line-login",
      expect.objectContaining({
        body: JSON.stringify({ lineUserId: "U1234567890" }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("runs LIFF line-login and shows activation state when LINE user is inactive", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ status: "needs_activation" }),
    ]);

    renderGate();

    expect(await screen.findByText("Activate your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/line-login",
      expect.objectContaining({
        body: JSON.stringify({ lineUserId: "U1234567890" }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("runs LIFF line-login and refreshes /api/auth/me when LINE login authenticates", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    renderGate();

    expect(await screen.findByText("Employee app")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("provides the LINE profile to authenticated child components", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    function ProfileConsumer() {
      const profile = useLiffProfile();
      return <p>{profile?.pictureUrl}</p>;
    }

    renderGate(<ProfileConsumer />);

    expect(
      await screen.findByText("https://line.example/avatar.jpg"),
    ).toBeInTheDocument();
  });

  it("login, hrLogin, logout, and verifyPin use the auth proxy without storing tokens", async () => {
    mockFetch([
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
      jsonResponse({ success: true }),
      jsonResponse({ hrUser: { id: "hr-1", email: "hr@example.com" } }),
      jsonResponse({ verified: true }),
      jsonResponse({ success: true }),
    ]);
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    function ActionConsumer() {
      const auth = useAuth();
      return (
        <div>
          <button type="button" onClick={() => auth.login("user@example.com", "123456")}>
            employee login
          </button>
          <button type="button" onClick={() => auth.hrLogin("hr@example.com", "demo1234")}>
            hr login
          </button>
          <button type="button" onClick={() => auth.verifyPin("654321")}>
            verify pin
          </button>
          <button type="button" onClick={() => auth.logout()}>
            logout
          </button>
        </div>
      );
    }

    renderGate(<ActionConsumer />);
    await screen.findByText("employee login");

    fireEvent.click(screen.getByText("employee login"));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({ identifier: "user@example.com", pin: "123456" }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );

    fireEvent.click(screen.getByText("hr login"));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/hr/login",
        expect.objectContaining({
          body: JSON.stringify({ email: "hr@example.com", password: "demo1234" }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );

    fireEvent.click(screen.getByText("verify pin"));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/verify-pin",
        expect.objectContaining({
          body: JSON.stringify({ pin: "654321" }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );

    fireEvent.click(screen.getByText("logout"));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ credentials: "include", method: "POST" }),
      ),
    );
    expect(setItemSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/token/i),
      expect.any(String),
    );
  });
});
