import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HRTopbar } from "./hr-topbar";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";
import { HRRoleContext, type HRRole } from "@/components/hr/hr-auth-gate";

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
    transferExport: "Transfer Export",
  },
};

function renderTopbar(role: HRRole = "hr_manager") {
  return renderWithIntl(
    <HRRoleContext.Provider value={{ role }}>
      <HRTopbar />
    </HRRoleContext.Provider>,
    { messages },
  );
}

describe("HRTopbar", () => {
  it("clears the session and returns to HR login from the settings menu", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    window.localStorage.setItem("payday-session", "token");

    renderTopbar();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(await screen.findByText("Log out"));

    await waitFor(() => {
      expect(window.localStorage.getItem("payday-session")).toBeNull();
    });
    expect(pushMock).toHaveBeenCalledWith("/hr/login");
  });

  it("shows the active HR role badge", () => {
    renderTopbar("accountant");

    expect(screen.getAllByText("Accountant").length).toBeGreaterThan(0);
  });
});
