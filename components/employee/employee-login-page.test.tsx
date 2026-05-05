import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { EmployeeLoginPage } from "./employee-login-page";
import { renderWithIntl } from "@/tests/i18n/test-utils";

const replaceMock = vi.fn();

// Mock next/navigation
vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: replaceMock })),
  usePathname: vi.fn(() => "/th/employee/login"),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Mock PINPad to avoid complex DOM
vi.mock("@/components/ui/pin-pad", () => ({
  PINPad: ({
    onComplete,
    disabled,
  }: {
    onComplete: (pin: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="pin-pad">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onComplete("1234")}
      >
        Enter PIN
      </button>
    </div>
  ),
}));

describe("EmployeeLoginPage", () => {
  it("renders translated labels", () => {
    renderWithIntl(<EmployeeLoginPage />);

    expect(screen.getByText("PayDay+")).toBeInTheDocument();
    expect(screen.getByText("Earned Wage Access")).toBeInTheDocument();
    expect(screen.getByLabelText("Employee ID")).toBeInTheDocument();
    expect(screen.getByText("PIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Forgot PIN?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan QR" })).toBeInTheDocument();
  });

  it("shows language switcher buttons", () => {
    renderWithIntl(<EmployeeLoginPage />);

    expect(
      screen.getByRole("button", { name: "Switch language to Thai" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch language to English" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch language to Myanmar" }),
    ).toBeInTheDocument();
  });

  it("allows switching language", () => {
    renderWithIntl(<EmployeeLoginPage />);

    const thaiButton = screen.getByRole("button", {
      name: "Switch language to Thai",
    });
    fireEvent.click(thaiButton);

    expect(replaceMock).toHaveBeenCalledWith("/th/employee/login", {
      locale: "th",
    });
  });

  it("shows employee ID input with placeholder", () => {
    renderWithIntl(<EmployeeLoginPage />);
    const input = screen.getByLabelText("Employee ID");
    expect(input).toHaveAttribute("placeholder", "Enter ID");
  });
});
