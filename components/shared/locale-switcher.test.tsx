import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LocaleSwitcher } from "./locale-switcher";

const replaceMock = vi.fn();
const pathnameMock = vi.fn(() => "/th/profile");
const searchParamsMock = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock(),
  useSearchParams: () => searchParamsMock(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "th",
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    pathnameMock.mockReturnValue("/th/profile");
    searchParamsMock.mockReturnValue(new URLSearchParams());
  });

  describe("pill variant (default)", () => {
    it("renders three locale buttons", () => {
      render(<LocaleSwitcher />);

      expect(
        screen.getByRole("button", { name: "Switch language to Thai" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Switch language to English" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Switch language to Myanmar" }),
      ).toBeInTheDocument();
      expect(screen.getByText("ไทย")).toBeInTheDocument();
      expect(screen.getByText("EN")).toBeInTheDocument();
      expect(screen.getByText("မြန်မာ")).toBeInTheDocument();
    });

    it("highlights the active locale button", () => {
      render(<LocaleSwitcher />);

      const active = screen.getByRole("button", {
        name: "Switch language to Thai",
      });
      expect(active).toHaveAttribute("aria-pressed", "true");
      expect(active).toHaveClass("bg-primary/85");

      const inactive = screen.getByRole("button", {
        name: "Switch language to English",
      });
      expect(inactive).toHaveAttribute("aria-pressed", "false");
      expect(inactive).not.toHaveClass("bg-bg-canvas");
    });

    it("calls router.replace when switching to a different locale", () => {
      render(<LocaleSwitcher />);

      fireEvent.click(
        screen.getByRole("button", { name: "Switch language to English" }),
      );

      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/en/profile");
    });

    it("adds a locale prefix when switching from an unprefixed LIFF route", () => {
      pathnameMock.mockReturnValue("/profile");

      render(<LocaleSwitcher />);

      fireEvent.click(
        screen.getByRole("button", { name: "Switch language to English" }),
      );

      expect(replaceMock).toHaveBeenCalledWith("/en/profile");
    });

    it("preserves search params when switching language", () => {
      pathnameMock.mockReturnValue("/th/history");
      searchParamsMock.mockReturnValue(new URLSearchParams("id=EWA-001"));

      render(<LocaleSwitcher />);

      fireEvent.click(
        screen.getByRole("button", { name: "Switch language to English" }),
      );

      expect(replaceMock).toHaveBeenCalledWith("/en/history?id=EWA-001");
    });

    it("does nothing when clicking the already active locale", () => {
      render(<LocaleSwitcher />);

      fireEvent.click(
        screen.getByRole("button", { name: "Switch language to Thai" }),
      );

      expect(replaceMock).not.toHaveBeenCalled();
    });
  });

  describe("select variant", () => {
    it("renders a select with three options", () => {
      render(<LocaleSwitcher variant="select" />);

      const select = screen.getByRole("combobox", {
        name: "Language",
      }) as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe("th");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Thai / ไทย");
      expect(options[1]).toHaveTextContent("English");
      expect(options[2]).toHaveTextContent("မြန်မာ");
    });

    it("calls router.replace when selecting a different locale", () => {
      render(<LocaleSwitcher variant="select" />);

      const select = screen.getByRole("combobox", { name: "Language" });
      fireEvent.change(select, { target: { value: "my" } });

      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/my/profile");
    });

    it("does nothing when selecting the already active locale", () => {
      render(<LocaleSwitcher variant="select" />);

      const select = screen.getByRole("combobox", { name: "Language" });
      fireEvent.change(select, { target: { value: "th" } });

      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
