import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { EmployeeProfilePage } from "./employee-profile-page";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock })),
  usePathname: vi.fn(() => "/en/employee/profile"),
}));

const messages = {
  ...defaultMessages,
  profile: {
    bankAccount: "Bank account",
    ewaLimit: "EWA limit",
    maxPercent: "Maximum",
    used: "Used",
    remaining: "Remaining",
    notifications: "Notifications",
    notifyApproved: "Notify on approval",
    notifyPayday: "Notify on payday",
    notifyLine: "LINE notifications",
    language: "Language",
    logout: "Log out",
  },
};

describe("EmployeeProfilePage", () => {
  it("clears the session and returns to employee login on logout", () => {
    window.localStorage.setItem("payday-session", "token");

    renderWithIntl(<EmployeeProfilePage />, { messages });
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/employee/login");
  });
});
