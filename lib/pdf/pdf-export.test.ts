import { describe, expect, it, vi } from "vitest";
import { currentEmployee } from "@/lib/mock/currentUser";
import { requests } from "@/lib/mock/requests";
import { buildPaySlipPdf, buildReportPdf, downloadPdf } from "./pdf-export";

describe("pdf export", () => {
  it("builds a report PDF blob with PDF metadata", () => {
    const pdf = buildReportPdf({
      title: "Accountant Report",
      periodLabel: "This Month",
      totalDisbursed: 125000,
      totalRequests: 42,
      approvalRate: "86%",
    });

    expect(pdf.type).toBe("application/pdf");
    expect(pdf.size).toBeGreaterThan(100);
  });

  it("builds a pay slip PDF blob for an employee request", () => {
    const pdf = buildPaySlipPdf({
      employee: currentEmployee,
      request: requests[0],
    });

    expect(pdf.type).toBe("application/pdf");
    expect(pdf.size).toBeGreaterThan(100);
  });

  it("downloads the PDF with a stable file name", () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:payday-pdf");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const click = vi.fn();
    const anchor = {
      click,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement;
    const createElement = vi
      .spyOn(document, "createElement")
      .mockReturnValue(anchor);

    downloadPdf(new Blob(["pdf"], { type: "application/pdf" }), "report.pdf");

    expect(anchor.download).toBe("report.pdf");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:payday-pdf");

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElement.mockRestore();
  });
});
