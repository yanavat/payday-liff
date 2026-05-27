import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { HRLoginPage } from "./hr-login-page";
import { renderWithIntl } from "@/tests/i18n/test-utils";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock, replace: replaceMock })),
  usePathname: vi.fn(() => "/en/hr/login"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock })),
  usePathname: vi.fn(() => "/en/hr/login"),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("HRLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("renders HR-specific header content", () => {
    renderWithIntl(<HRLoginPage />);

    expect(screen.getByText("PayDay+")).toBeInTheDocument();
    expect(screen.getByText("HR Sign In")).toBeInTheDocument();
    expect(
      screen.getByText("Employee Advance Request System"),
    ).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    renderWithIntl(<HRLoginPage />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    renderWithIntl(<HRLoginPage />);

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    renderWithIntl(<HRLoginPage />);

    expect(screen.getByText("Forgot PIN?")).toBeInTheDocument();
  });

  it("renders demo credentials hint", () => {
    renderWithIntl(<HRLoginPage />);

    expect(
      screen.getByText("Demo: hr@paydayplus.co / demo1234"),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderWithIntl(<HRLoginPage />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits form and navigates on success", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({ hrUser: { id: "hr-1", name: "HR Admin", role: "hr" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<HRLoginPage />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "demo1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/hr/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            email: "hr@paydayplus.co",
            password: "demo1234",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/en/hr/dashboard");
    });

    expect(window.localStorage.getItem("payday-session")).toBeNull();
  });

  it("shows error on failed authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 })),
    );

    renderWithIntl(<HRLoginPage />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText(/Wrong PIN/)).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables inputs while loading", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    renderWithIntl(<HRLoginPage />);

    // Fill required fields so HTML5 validation passes
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "demo1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Loading" })).toBeDisabled();
    });
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });
});
