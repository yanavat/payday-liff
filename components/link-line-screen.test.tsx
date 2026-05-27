import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiffClient } from "@/lib/liff-client";
import { defaultMessages, renderWithIntl } from "@/tests/i18n/test-utils";

import { AuthGate } from "./liff-auth-gate";

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
    ...overrides,
  } as unknown as LiffClient;
}

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
    lineLinkButton: "Connect account",
    lineLinkGreeting: "Hello Mock LINE User",
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

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

function mockFetch(responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderGate(children = <p>Employee app</p>) {
  return renderWithIntl(<AuthGate>{children}</AuthGate>, { messages });
}

describe("Link LINE screen", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "test-liff-id");
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "true");
    loadLiffClientMock.mockResolvedValue(createLiffClient());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows LINE profile and links account with phone and PIN", async () => {
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ status: "needs_linking" }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    renderGate();

    expect(await screen.findByRole("heading", { name: "Link LINE account" })).toBeInTheDocument();
    expect(screen.getByText("Hello Mock LINE User")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mock LINE User" })).toHaveAttribute(
      "src",
      "https://line.example/avatar.jpg",
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect account" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/link-line",
        expect.objectContaining({
          body: JSON.stringify({
            phone: "0812345678",
            pin: "123456",
            lineUserId: "U1234567890",
          }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );
    expect(await screen.findByText("Employee app")).toBeInTheDocument();
  });

  it("shows an inline error when linking credentials are rejected", async () => {
    mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ status: "needs_linking" }),
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
    ]);

    renderGate();

    await screen.findByRole("heading", { name: "Link LINE account" });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect account" }));

    expect(await screen.findByText("Invalid phone/email or PIN")).toBeInTheDocument();
  });
});
