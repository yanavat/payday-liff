"use client";

import { useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  dailyDisbursements,
  departmentReports,
  monthlySummary,
  reconciliationItems,
  weeklyDisbursements,
} from "@/lib/mock";
import { formatPercent, formatTHB, formatTHBCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type ReportView = "monthly" | "weekly";

export function ReportsPageContent() {
  const { toast } = useToast();
  const [view, setView] = useState<ReportView>("monthly");
  const [failedRetried, setFailedRetried] = useState<string[]>([]);
  const chartData =
    view === "monthly" ? dailyDisbursements.slice(0, 30) : weeklyDisbursements;
  const maxAmount = Math.max(...chartData.map((item) => item.amount), 1);
  const approvalRate =
    (monthlySummary.totalApproved / Math.max(monthlySummary.totalRequests, 1)) *
    100;
  const totalFees = Math.round(monthlySummary.totalApproved * 15);

  const exportReport = (type: "CSV" | "PDF") => {
    toast({ variant: "success", message: `เตรียมไฟล์ ${type} เรียบร้อยแล้ว` });
  };

  const totals = useMemo(() => {
    return departmentReports.reduce(
      (acc, item) => ({
        totalRequests: acc.totalRequests + item.totalRequests,
        totalAmount: acc.totalAmount + item.totalAmount,
      }),
      { totalRequests: 0, totalAmount: 0 },
    );
  }, []);

  return (
    <div className="max-w-[1152px] space-y-4">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
            รายงาน EWA
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            รายงานการใช้งาน EWA ของบริษัท
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-border bg-bg-canvas px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option>เดือนนี้</option>
            <option>เดือนที่แล้ว</option>
            <option>กำหนดเอง</option>
          </select>
          <button
            onClick={() => exportReport("CSV")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium hover:bg-bg-secondary"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => exportReport("PDF")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium hover:bg-bg-secondary"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      <div className="flex justify-end">
        <div className="flex rounded-md bg-bg-secondary p-1">
          <ToggleButton
            active={view === "monthly"}
            onClick={() => setView("monthly")}
          >
            รายเดือน
          </ToggleButton>
          <ToggleButton
            active={view === "weekly"}
            onClick={() => setView("weekly")}
          >
            รายสัปดาห์
          </ToggleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="ยอดเบิกจ่ายทั้งหมด"
          value={formatTHBCompact(monthlySummary.totalDisbursed)}
        />
        <MetricCard
          label="จำนวนคำขอ"
          value={`${monthlySummary.totalRequests}`}
          sub="รายการ"
        />
        <MetricCard
          label="เฉลี่ยต่อคำขอ"
          value={formatTHBCompact(monthlySummary.avgAmount)}
        />
        <MetricCard label="อัตราอนุมัติ" value={formatPercent(approvalRate)} />
        <MetricCard label="ค่าธรรมเนียม" value={formatTHBCompact(totalFees)} />
      </div>

      <section className="rounded-lg border border-border bg-bg-canvas p-5 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-section-title text-text-primary">ยอดเบิกจ่าย</h2>
          <span className="text-caption text-text-muted">
            {view === "monthly" ? "รายวัน 30 แท่ง" : "รายสัปดาห์ 52 แท่ง"}
          </span>
        </div>
        <div className="flex h-72 items-end gap-2 overflow-x-auto border-b border-border px-2 pb-6">
          {chartData.map((item, index) => {
            const height = Math.max(
              (item.amount / maxAmount) * 220,
              item.amount > 0 ? 12 : 2,
            );
            const highlighted =
              view === "monthly" ? index === 13 : index === 18;
            return (
              <div
                key={"date" in item ? item.date : item.week}
                className="flex min-w-[24px] flex-col items-center justify-end gap-2"
              >
                <span className="font-number text-[10px] font-medium text-text-muted">
                  {item.count}
                </span>
                <div
                  className={cn(
                    "w-6 rounded-t bg-primary-light",
                    highlighted && "bg-primary-dark",
                  )}
                  style={{ height }}
                  title={`${formatTHB(item.amount)} · ${item.count} รายการ`}
                />
                <span className="text-[10px] text-text-muted">
                  {"date" in item
                    ? String(index + 1)
                    : item.week.replace("W", "")}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-section-title text-text-primary">แยกตามแผนก</h2>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="h-10 bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                <th className="px-4">แผนก</th>
                <th className="px-4 text-right">จำนวนคำขอ</th>
                <th className="px-4 text-right">ยอดรวม</th>
                <th className="px-4 text-right">เฉลี่ย</th>
              </tr>
            </thead>
            <tbody>
              {departmentReports.map((item) => (
                <tr
                  key={item.department}
                  className="h-[52px] border-b border-border-light last:border-0"
                >
                  <td className="px-4 text-sm font-medium">
                    {item.department}
                  </td>
                  <td className="px-4 text-right font-number text-sm">
                    {item.totalRequests}
                  </td>
                  <td className="px-4 text-right font-number text-sm font-semibold">
                    {formatTHB(item.totalAmount)}
                  </td>
                  <td className="px-4 text-right font-number text-sm text-text-secondary">
                    {formatTHB(item.avgAmount)}
                  </td>
                </tr>
              ))}
              <tr className="h-[52px] bg-bg-secondary font-semibold">
                <td className="px-4 text-sm">รวม</td>
                <td className="px-4 text-right font-number text-sm">
                  {totals.totalRequests}
                </td>
                <td className="px-4 text-right font-number text-sm">
                  {formatTHB(totals.totalAmount)}
                </td>
                <td className="px-4 text-right font-number text-sm">
                  {formatTHB(
                    Math.round(totals.totalAmount / totals.totalRequests),
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-section-title text-text-primary">
              สถานะการโอนเงิน
            </h2>
          </div>
          <div className="divide-y divide-border-light">
            {reconciliationItems.map((item) => {
              const retried = failedRetried.includes(item.referenceNumber);
              const status = retried ? "processing" : item.status;
              return (
                <div
                  key={item.referenceNumber}
                  className={cn(
                    "p-4",
                    item.status === "failed" && !retried && "bg-red-50/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-number text-sm font-semibold">
                        {item.referenceNumber}
                      </p>
                      <p className="mt-1 text-caption text-text-muted">
                        {item.employeeId} · {formatTHB(item.amount)}
                      </p>
                    </div>
                    <TransferBadge status={status} />
                  </div>
                  {item.status === "failed" && !retried && (
                    <button
                      onClick={() => {
                        setFailedRetried((current) =>
                          current.concat(item.referenceNumber),
                        );
                        toast({
                          variant: "info",
                          message: "กำลังลองโอนเงินอีกครั้ง",
                        });
                      }}
                      className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-red-300 bg-bg-canvas px-3 text-xs font-medium text-red-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 rounded-sm px-4 text-sm font-medium",
        active
          ? "bg-bg-canvas text-text-primary shadow-card"
          : "text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

function TransferBadge({
  status,
}: {
  status: "processing" | "settled" | "failed";
}) {
  if (status === "settled") return <StatusBadge status="disbursed" />;
  if (status === "failed") return <StatusBadge status="rejected" />;
  return <StatusBadge status="pending" />;
}
