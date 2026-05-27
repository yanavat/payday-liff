import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultMessages, renderWithIntl } from "@/tests/i18n/test-utils";

import { AuthGate } from "./liff-auth-gate";

vi.mock("@/lib/liff-client", () => ({
  loadLiffClient: vi.fn(),
}));

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

async function openActivation() {
  fireEvent.click(await screen.findByRole("button", { name: "First-time Activation" }));
  await screen.findByRole("heading", { name: "Activate your account" });
}

describe("Activation screen", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "test-liff-id");
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "false");
    window.history.pushState({}, "", "/en");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("prefills phone from query params and activates through /api/auth/activate", async () => {
    window.history.pushState({}, "", "/en?phone=0812345678");
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    renderGate();
    await openActivation();

    expect(screen.getByLabelText("Phone number")).toHaveValue("0812345678");
    fireEvent.change(screen.getByLabelText("Invitation code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("New PIN"), {
      target: { value: "654321" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new PIN"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate account" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/activate",
        expect.objectContaining({
          body: JSON.stringify({
            phone: "0812345678",
            invitationCode: "123456",
            pin: "654321",
          }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );
    expect(await screen.findByText("Employee app")).toBeInTheDocument();
  });

  it("shows a local validation error when PIN confirmation does not match", async () => {
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
    ]);

    renderGate();
    await openActivation();

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("Invitation code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("New PIN"), {
      target: { value: "654321" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate account" }));

    expect(await screen.findByText("PINs do not match")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [410, "Invitation code expired. Please contact HR."],
    [401, "Invalid invitation code"],
    [400, "Already activated"],
  ])("shows activation API error for status %s", async (status, message) => {
    mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ message }, { status }),
    ]);

    renderGate();
    await openActivation();

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("Invitation code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("New PIN"), {
      target: { value: "654321" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new PIN"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activate account" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
