import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { LiffDeepLinkHandler } from "./liff-deep-link-handler";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("LiffDeepLinkHandler", () => {
  const replace = vi.fn();

  beforeEach(() => {
    replace.mockClear();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<
      typeof useRouter
    >);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to /history when page=history", () => {
    vi.stubGlobal("window", {
      location: { href: "https://liff.line.me/123?page=history&id=EWA-001" },
    });
    const params = new URLSearchParams("page=history&id=EWA-001");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/history?id=EWA-001");
  });

  it("redirects to /request when page=request", () => {
    vi.stubGlobal("window", {
      location: { href: "https://liff.line.me/123?page=request" },
    });
    const params = new URLSearchParams("page=request");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/request");
  });

  it("redirects to /profile when page=profile", () => {
    vi.stubGlobal("window", {
      location: { href: "https://liff.line.me/123?page=profile" },
    });
    const params = new URLSearchParams("page=profile");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/profile");
  });

  it("redirects to home and cleans params when page=home", () => {
    vi.stubGlobal("window", {
      location: { href: "https://liff.line.me/123?page=home" },
    });
    const params = new URLSearchParams("page=home");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does nothing when no page param", () => {
    vi.stubGlobal("window", {
      location: { href: "https://liff.line.me/123" },
    });
    const params = new URLSearchParams("");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).not.toHaveBeenCalled();
  });
});
