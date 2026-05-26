import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultMessages, renderWithIntl } from "@/tests/i18n/test-utils";

import { LIFFAuthGate } from "./liff-auth-gate";

const loadLiffClientMock = vi.fn();

vi.mock("@/lib/liff-client", () => ({
  loadLiffClient: () => loadLiffClientMock(),
}));

const messages = {
  ...defaultMessages,
  auth: {
    activationLink: "First-time Activation",
    activationTitle: "Activate your account",
    dividerOr: "or",
    errorAlreadyActivated: "Already activated",
    errorExpiredInvitation: "Invitation code expired. Please contact HR.",
    errorInvalidCredentials: "Invalid phone/email or PIN",
    errorInvalidInvitation: "Invalid invitation code",
    errorTooManyAttempts: "Too many attempts. Try again in {seconds}s.",
    errorTitle: "Authentication unavailable",
    errorDescription: "Please try again.",
    identifierLabel: "Phone or email",
    identifierPlaceholder: "name@example.com",
    lineLinkTitle: "Link LINE account",
    lineLoginButton: "Log in with LINE",
    loading: "Checking session...",
    loginButton: "Sign in",
    loginTitle: "Sign in to PayDay+",
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
  return renderWithIntl(<LIFFAuthGate>{children}</LIFFAuthGate>, { messages });
}

describe("Browser login screen", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "test-liff-id");
    vi.stubEnv("NEXT_PUBLIC_LIFF_MOCK", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders LINE login entry, divider, identifier/PIN form, and activation switch", async () => {
    mockFetch([jsonResponse({ message: "Unauthorized" }, { status: 401 })]);

    renderGate();

    expect(await screen.findByRole("heading", { name: "Sign in to PayDay+" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in with LINE" })).toHaveAttribute(
      "href",
      "https://liff.line.me/test-liff-id",
    );
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone or email")).toBeInTheDocument();
    expect(screen.getByLabelText("6-digit PIN")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "First-time Activation" }));

    expect(await screen.findByText("Activate your account")).toBeInTheDocument();
  });

  it("logs in through /api/auth/login and renders the app after session refresh", async () => {
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ success: true }),
      jsonResponse({
        employee: { id: "emp-1", employeeCode: "EMP-001", name: "Somchai" },
      }),
    ]);

    renderGate();

    fireEvent.change(await screen.findByLabelText("Phone or email"), {
      target: { value: "somchai@example.com" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({ identifier: "somchai@example.com", pin: "123456" }),
          credentials: "include",
          method: "POST",
        }),
      ),
    );
    expect(await screen.findByText("Employee app")).toBeInTheDocument();
  });

  it("shows invalid credential and rate-limit errors", async () => {
    const fetchMock = mockFetch([
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      jsonResponse(
        { message: "Too many attempts" },
        { status: 429, headers: { "Retry-After": "45" } },
      ),
    ]);

    renderGate();

    fireEvent.change(await screen.findByLabelText("Phone or email"), {
      target: { value: "somchai@example.com" },
    });
    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid phone/email or PIN")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("6-digit PIN"), {
      target: { value: "222222" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Too many attempts. Try again in 45s.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
