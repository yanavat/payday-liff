import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/tests/i18n/test-utils";
import { HRAuthGate, useHRRole } from "./hr-auth-gate";

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock })),
}));

describe("HRAuthGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders children when /api/auth/me returns an HR user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ id: "hr-1", kind: "hr", hrUserId: "hr-1", email: "hr@example.com" }),
      ),
    );

    renderWithIntl(
      <HRAuthGate>
        <div>HR dashboard</div>
      </HRAuthGate>,
    );

    expect(await screen.findByText("HR dashboard")).toBeInTheDocument();
  });

  it("provides the HR role from /api/auth/me", async () => {
    function RoleConsumer() {
      const { role } = useHRRole();
      return <div>Role: {role}</div>;
    }

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          id: "hr-1",
          kind: "hr",
          hrUserId: "hr-1",
          email: "hr@example.com",
          role: "accountant",
        }),
      ),
    );

    renderWithIntl(
      <HRAuthGate>
        <RoleConsumer />
      </HRAuthGate>,
    );

    expect(await screen.findByText("Role: accountant")).toBeInTheDocument();
  });

  it("redirects to HR login when the session is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    renderWithIntl(
      <HRAuthGate>
        <div>HR dashboard</div>
      </HRAuthGate>,
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/hr/login");
    });
    expect(screen.queryByText("HR dashboard")).not.toBeInTheDocument();
  });
});
