import { describe, expect, it } from "vitest";
import {
  authenticateEmployee,
  authenticateHR,
  decodeSessionToken,
  verifyBcryptPin,
} from "./mock-auth";

describe("mock auth", () => {
  it("authenticates an HR user and returns a signed JWT-like token", async () => {
    const result = await authenticateHR("hr@paydayplus.co", "123456");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected HR authentication to succeed");
    expect(result.user.role).toBe("hr_manager");
    expect(result.token).toMatch(/^[^.]+\.[^.]+\.[^.]+$/);
    expect(await decodeSessionToken(result.token)).toMatchObject({
      sub: "HR-0001",
      scope: "hr",
    });
  });

  it("rejects an employee login when the PIN does not match the bcrypt hash", async () => {
    const result = await authenticateEmployee("EMP-0001", "0000");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected employee authentication to fail");
    expect(result.reason).toBe("invalid_credentials");
  });

  it("verifies a bcrypt-shaped stored PIN hash through the auth boundary", async () => {
    await expect(
      verifyBcryptPin("1234", "$2b$mock$03ac674216f3e15c761ee1a5e255f067"),
    ).resolves.toBe(true);
  });
});
