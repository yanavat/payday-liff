import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { LiffDeepLinkHandler } from "./liff-deep-link-handler";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
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
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("redirects to /history when page=history", () => {
    window.history.pushState({}, "", "/?page=history&id=EWA-001");
    const params = new URLSearchParams("page=history&id=EWA-001");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/history?id=EWA-001");
  });

  it("keeps the locale prefix when redirecting from a localized LIFF route", () => {
    window.history.pushState({}, "", "/en?page=history&id=EWA-001");
    vi.mocked(usePathname).mockReturnValue("/en");
    const params = new URLSearchParams("page=history&id=EWA-001");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/en/history?id=EWA-001");
  });

  it("redirects to /request when page=request", () => {
    window.history.pushState({}, "", "/?page=request");
    const params = new URLSearchParams("page=request");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/request");
  });

  it("redirects to /profile when page=profile", () => {
    window.history.pushState({}, "", "/?page=profile");
    const params = new URLSearchParams("page=profile");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/profile");
  });

  it("redirects to home and cleans params when page=home", () => {
    window.history.pushState({}, "", "/?page=home");
    const params = new URLSearchParams("page=home");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does nothing when no page param", () => {
    window.history.pushState({}, "", "/");
    const params = new URLSearchParams("");
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<LiffDeepLinkHandler />);

    expect(replace).not.toHaveBeenCalled();
  });
});
