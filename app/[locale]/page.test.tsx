import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocaleLiffHomePage from "./(liff)/page";

vi.mock("@/components/liff-home-page", () => ({
  LiffHomePage: () => <main>Localized LIFF home</main>,
}));

describe("localized LIFF home route", () => {
  it("renders the LIFF home page for locale-prefixed entry URLs", () => {
    render(<LocaleLiffHomePage />);

    expect(screen.getByText("Localized LIFF home")).toBeInTheDocument();
  });
});
