import type { Employee, EWARequest } from "@/types";
import { formatTHB } from "@/lib/utils/format";

type ReportPdfInput = {
  title: string;
  periodLabel: string;
  totalDisbursed: number;
  totalRequests: number;
  approvalRate: string;
};

type PaySlipPdfInput = {
  employee: Employee;
  request: EWARequest;
};

export function buildReportPdf(input: ReportPdfInput) {
  return createSimplePdf([
    "PayDay+ Report",
    input.title,
    `Period: ${input.periodLabel}`,
    `Total disbursed: ${formatTHB(input.totalDisbursed)}`,
    `Total requests: ${input.totalRequests}`,
    `Approval rate: ${input.approvalRate}`,
    `Generated: ${new Date().toLocaleDateString("en-GB")}`,
  ]);
}

export function buildPaySlipPdf({ employee, request }: PaySlipPdfInput) {
  return createSimplePdf([
    "PayDay+ Pay Slip",
    `Employee: ${employee.name} (${employee.id})`,
    `Department: ${employee.department}`,
    `Reference: ${request.referenceNumber}`,
    `Amount: ${formatTHB(request.amount)}`,
    `Transfer fee: ${formatTHB(request.transferFee)}`,
    `Net transfer: ${formatTHB(request.netTransferAmount)}`,
    `Status: ${request.status}`,
    `Requested: ${formatDate(request.requestedAt)}`,
    `Approved: ${formatDate(request.approvedAt)}`,
    `Transferred: ${formatDate(request.disbursedAt)}`,
    `Bank: ${employee.bankName} ${employee.bankAccountMasked}`,
  ]);
}

export function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function createSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "" : "0 -28 Td",
      `(${escapePdfText(line)}) Tj`,
    ]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
