import { describe, expect, it, vi } from "vitest";
import { signOut } from "./session";

describe("session", () => {
  it("clears the saved session and routes HR users to HR login", () => {
    const push = vi.fn();
    window.localStorage.setItem("payday-session", "token");

    signOut("hr", { push });

    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(push).toHaveBeenCalledWith("/hr/login");
  });

  it("clears the saved session and routes employees to employee login", () => {
    const push = vi.fn();
    window.localStorage.setItem("payday-session", "token");

    signOut("employee", { push });

    expect(window.localStorage.getItem("payday-session")).toBeNull();
    expect(push).toHaveBeenCalledWith("/employee/login");
  });
});
