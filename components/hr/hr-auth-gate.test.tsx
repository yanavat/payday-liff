import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/tests/i18n/test-utils";
import { HRAuthGate } from "./hr-auth-gate";

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
        Response.json({ hrUser: { id: "hr-1", email: "hr@example.com" } }),
      ),
    );

    renderWithIntl(
      <HRAuthGate>
        <div>HR dashboard</div>
      </HRAuthGate>,
    );

    expect(await screen.findByText("HR dashboard")).toBeInTheDocument();
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
