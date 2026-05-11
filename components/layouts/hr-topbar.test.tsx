import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { HRTopbar } from "./hr-topbar";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en/hr/dashboard"),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => "/en/hr/dashboard"),
  useRouter: vi.fn(() => ({ push: pushMock })),
}));

const messages = {
  ...defaultMessages,
  nav: {
    dashboard: "Dashboard",
    requests: "EWA Requests",
    reports: "Reports",
    settings: "Settings",
    employees: "Employees",
    requestOnBehalf: "Request on behalf",
  },
};

describe("HRTopbar", () => {
  it("clears the session and returns to HR login from the settings menu", async () => {
    window.localStorage.setItem("payday-session", "token");

    renderWithIntl(<HRTopbar />, { messages });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(await screen.findByText("Log out"));

    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/hr/login");
  });
});
