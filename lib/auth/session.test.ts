import { beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "./session";

describe("session", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs out through the auth proxy and routes HR users to HR login", async () => {
    const push = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem("payday-session", "token");

    await signOut("hr", { push });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(push).toHaveBeenCalledWith("/hr/login");
  });

  it("clears stale local sessions and routes employees to employee login", async () => {
    const push = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network")),
    );
    window.localStorage.setItem("payday-session", "token");

    await signOut("employee", { push });

    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(push).toHaveBeenCalledWith("/employee/login");
  });
});
