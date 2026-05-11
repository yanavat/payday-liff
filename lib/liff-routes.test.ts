import { describe, expect, it } from "vitest";

import { isLiffPathActive, withLiffLocale } from "./liff-routes";

describe("LIFF route helpers", () => {
  it("keeps unprefixed LIFF links unchanged", () => {
    expect(withLiffLocale("/profile", "/request")).toBe("/request");
    expect(withLiffLocale("/request", "/")).toBe("/");
  });

  it("adds the active locale prefix to LIFF links", () => {
    expect(withLiffLocale("/en/profile", "/request")).toBe("/en/request");
    expect(withLiffLocale("/my/request", "/")).toBe("/my");
    expect(withLiffLocale("/th/history", "/history?id=EWA-001")).toBe(
      "/th/history?id=EWA-001",
    );
  });

  it("matches active paths with or without a locale prefix", () => {
    expect(isLiffPathActive("/en/profile", "/profile")).toBe(true);
    expect(isLiffPathActive("/profile", "/profile")).toBe(true);
    expect(isLiffPathActive("/en/profile", "/request")).toBe(false);
  });
});
