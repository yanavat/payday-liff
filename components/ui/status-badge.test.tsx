import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";
import { renderWithIntl } from "@/tests/i18n/test-utils";

describe("StatusBadge", () => {
  it("renders translated label for pending status", () => {
    renderWithIntl(<StatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders translated label for approved status", () => {
    renderWithIntl(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders translated label for rejected status", () => {
    renderWithIntl(<StatusBadge status="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders translated label for disbursed status", () => {
    renderWithIntl(<StatusBadge status="disbursed" />);
    expect(screen.getByText("Disbursed")).toBeInTheDocument();
  });

  it("renders small size correctly", () => {
    renderWithIntl(<StatusBadge status="approved" size="sm" />);
    const badge = screen.getByText("Approved");
    expect(badge).toHaveClass("text-[12px]");
  });
});
