"use client";

import { useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle, Download, FileText, ListOrdered, PiggyBank, RefreshCw } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { MetricCardSkeleton } from "@/components/ui/metric-card-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { useEWARequests, useEmployees } from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import dayjs from "@/lib/dayjs";
import { formatPercent, formatTHB, formatTHBCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { buildReportPdf, downloadPdf } from "@/lib/pdf/pdf-export";

type ReportView = "monthly" | "weekly";

function ReportsContent() {
  const { toast } = useToast();
  const t = useTranslations();
  const tc = useTranslations("reports");
  const [view, setView] = useState<ReportView>("monthly");
  const [failedRetried, setFailedRetried] = useState<string[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { data: requestsData, loading, error } = useEWARequests({ limit: 500 });
  const { data: employeesData } = useEmployees({ limit: 1000 });

  const allRequests = requestsData?.data ?? [];
  const allEmployees = employeesData?.data ?? [];

  const { chartData, maxAmount } = useMemo(() => {
    if (view === "monthly") {
      const buckets: Record<string, { amount: number; count: number }> = {};
      const today = dayjs();
      for (let i = 29; i >= 0; i--) {
        buckets[today.subtract(i, "day").format("YYYY-MM-DD")] = { amount: 0, count: 0 };
      }
      allRequests
        .filter((r) => r.status === "disbursed" || r.status === "approved")
        .forEach((r) => {
          const d = dayjs(r.requestedAt).format("YYYY-MM-DD");
          if (buckets[d]) { buckets[d].amount += r.amount; buckets[d].count += 1; }
        });
      const data = Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
      return { chartData: data, maxAmount: Math.max(...data.map((d) => d.amount), 1) };
    } else {
      const buckets: Record<string, { amount: number; count: number }> = {};
      const today = dayjs();
      for (let i = 11; i >= 0; i--) {
        const w = `W${String(today.subtract(i, "week").week()).padStart(2, "0")}`;
        buckets[w] = { amount: 0, count: 0 };
      }
      allRequests
        .filter((r) => r.status === "disbursed" || r.status === "approved")
        .forEach((r) => {
          const w = `W${String(dayjs(r.requestedAt).week()).padStart(2, "0")}`;
          if (buckets[w]) { buckets[w].amount += r.amount; buckets[w].count += 1; }
        });
      const data = Object.entries(buckets).map(([week, v]) => ({ week, ...v }));
      return { chartData: data, maxAmount: Math.max(...data.map((d) => d.amount), 1) };
    }
  }, [allRequests, view]);

  const summary = useMemo(() => {
    const totalRequests = allRequests.length;
    const totalApproved = allRequests.filter((r) => r.status === "approved" || r.status === "disbursed").length;
    const disbursed = allRequests.filter((r) => r.status === "disbursed");
    const totalDisbursed = disbursed.reduce((s, r) => s + r.amount, 0);
    const avgAmount = disbursed.length > 0 ? Math.round(totalDisbursed / disbursed.length) : 0;
    const totalFees = allRequests.reduce((s, r) => s + (r.transferFee ?? 0), 0);
    return { totalRequests, totalApproved, totalDisbursed, avgAmount, totalFees };
  }, [allRequests]);

  const approvalRate = (summary.totalApproved / Math.max(summary.totalRequests, 1)) * 100;

  const departmentReports = useMemo(() => {
    const deptMap = new Map<string, { totalRequests: number; totalAmount: number }>();
    allRequests.forEach((r) => {
      const dept = allEmployees.find((e) => e.id === r.employeeId)?.department ?? "Unknown";
      const cur = deptMap.get(dept) ?? { totalRequests: 0, totalAmount: 0 };
      deptMap.set(dept, { totalRequests: cur.totalRequests + 1, totalAmount: cur.totalAmount + r.amount });
    });
    return Array.from(deptMap.entries())
      .map(([department, v]) => ({
        department, ...v,
        avgAmount: v.totalRequests > 0 ? Math.round(v.totalAmount / v.totalRequests) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [allRequests, allEmployees]);

  const totals = useMemo(() => departmentReports.reduce(
    (acc, item) => ({ totalRequests: acc.totalRequests + item.totalRequests, totalAmount: acc.totalAmount + item.totalAmount }),
    { totalRequests: 0, totalAmount: 0 }
  ), [departmentReports]);

  const reconciliationItems = useMemo(() =>
    allRequests
      .filter((r) => r.status !== "pending")
      .slice(0, 10)
      .map((r) => ({
        referenceNumber: r.referenceNumber,
        employeeId: r.employeeId,
        amount: r.amount,
        status: r.status === "disbursed" ? "settled" as const
          : r.status === "approved" ? "processing" as const
          : "failed" as const,
      })),
    [allRequests]
  );

  const exportReport = (type: "CSV" | "PDF") => {
    if (type === "PDF") {
      downloadPdf(
        buildReportPdf({
          title: tc("title"),
          periodLabel: tc("thisMonth"),
          totalDisbursed: summary.totalDisbursed,
          totalRequests: summary.totalRequests,
          approvalRate: formatPercent(approvalRate),
        }),
        "payday-report.pdf",
      );
    }
    toast({ variant: "success", message: tc("exportSuccess", { type }) });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-bg-secondary" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton />
          <MetricCardSkeleton /><MetricCardSkeleton />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-bg-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
        {getApiErrorMessage(error, t)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
            {tc("title")}
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">{tc("title")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-border bg-bg-canvas px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option>{tc("thisMonth")}</option>
            <option>{tc("lastMonth")}</option>
            <option>{tc("custom")}</option>
          </select>
          <button
            onClick={() => exportReport("CSV")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium hover:bg-bg-secondary"
          >
            <Download className="h-4 w-4" /> {tc("exportCsv")}
          </button>
          <button
            onClick={() => exportReport("PDF")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium hover:bg-bg-secondary"
          >
            <FileText className="h-4 w-4" /> {tc("exportPdf")}
          </button>
        </div>
      </header>

      <div className="flex justify-end">
        <div className="flex rounded-md bg-bg-secondary p-1">
          <ToggleButton active={view === "monthly"} onClick={() => setView("monthly")}>
            {tc("monthlyView")}
          </ToggleButton>
          <ToggleButton active={view === "weekly"} onClick={() => setView("weekly")}>
            {tc("weeklyView")}
          </ToggleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label={tc("totalDisbursed")}
          value={formatTHBCompact(summary.totalDisbursed)}
          icon={<BadgeDollarSign className="h-5 w-5" />}
        />
        <MetricCard
          label={tc("totalRequests")}
          value={`${summary.totalRequests}`}
          sub={tc("items")}
          icon={<ListOrdered className="h-5 w-5" />}
        />
        <MetricCard
          label={tc("avgAmount")}
          value={formatTHBCompact(summary.avgAmount)}
          icon={<FileText className="h-5 w-5" />}
        />
        <MetricCard
          label={tc("approvalRate")}
          value={formatPercent(approvalRate)}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <MetricCard
          label={tc("totalFees")}
          value={formatTHBCompact(summary.totalFees)}
          icon={<PiggyBank className="h-5 w-5" />}
        />
      </div>

      <section className="rounded-lg border border-border bg-bg-canvas p-5 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-section-title text-text-primary">{tc("disbursement")}</h2>
          <span className="text-caption text-text-muted">
            {view === "monthly" ? tc("daily30Days") : tc("weekly52Weeks")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex h-48 items-end gap-1 border-b border-border px-2 sm:h-64 sm:gap-0 md:h-72">
            {chartData.map((item, index) => {
              const heightPct = Math.max((item.amount / maxAmount) * 75, item.amount > 0 ? 5 : 1);
              const highlighted = view === "monthly" ? index === 13 : index === 8;
              const isDaily = "date" in item;
              return (
                <div
                  key={isDaily ? item.date : (item as { week: string }).week}
                  className="flex h-full min-w-[16px] flex-1 cursor-pointer flex-col items-center justify-end gap-1 sm:min-w-[20px] sm:gap-2 md:min-w-[24px]"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredIndex(index);
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => { setHoveredIndex(null); setTooltipPos(null); }}
                >
                  <span className="font-number text-[9px] font-medium text-text-muted sm:text-[10px]">
                    {item.count ?? 0}
                  </span>
                  <div
                    className={cn(
                      "w-3 rounded-t bg-primary-light transition-opacity sm:w-4 md:w-6",
                      highlighted && "bg-primary-dark",
                      hoveredIndex === index && "opacity-70",
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 px-2 pt-1.5 sm:gap-0">
            {chartData.map((item, index) => {
              const isDaily = "date" in item;
              const dateObj = isDaily ? new Date(item.date) : null;
              const dayNum = dateObj ? dateObj.getDate() : null;
              const showLabel = isDaily
                ? dayNum === 1 || (dayNum !== null && dayNum % 5 === 0)
                : index % 3 === 0;
              const xLabel = isDaily
                ? showLabel && dateObj
                  ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : ""
                : showLabel ? (item as { week: string }).week : "";
              return (
                <div
                  key={isDaily ? item.date : (item as { week: string }).week}
                  className="min-w-[16px] flex-1 text-center text-[9px] text-text-muted sm:min-w-[20px] sm:text-[10px] md:min-w-[24px]"
                >
                  {xLabel}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {hoveredIndex !== null && tooltipPos && chartData[hoveredIndex] && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-bg-canvas px-3 py-2 shadow-hover"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 8 }}
        >
          <p className="text-[11px] font-semibold text-text-primary">
            {"date" in chartData[hoveredIndex]
              ? new Date(chartData[hoveredIndex].date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : (chartData[hoveredIndex] as { week: string }).week}
          </p>
          <p className="font-number text-[12px] font-bold text-primary">
            {formatTHB(chartData[hoveredIndex].amount)}
          </p>
          <p className="text-[10px] text-text-muted">
            {chartData[hoveredIndex].count ?? 0} {tc("items")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-section-title text-text-primary">{tc("departmentBreakdown")}</h2>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="h-10 bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                <th className="px-4">{t("employees.department")}</th>
                <th className="px-4 text-right">{tc("totalRequests")}</th>
                <th className="px-4 text-right">{tc("totalAmount")}</th>
                <th className="px-4 text-right">{tc("avgAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {departmentReports.map((item) => (
                <tr key={item.department} className="h-[52px] border-b border-border-light last:border-0">
                  <td className="px-4 text-sm font-medium">{item.department}</td>
                  <td className="px-4 text-right font-number text-sm">{item.totalRequests}</td>
                  <td className="px-4 text-right font-number text-sm font-semibold">{formatTHB(item.totalAmount)}</td>
                  <td className="px-4 text-right font-number text-sm text-text-secondary">{formatTHB(item.avgAmount)}</td>
                </tr>
              ))}
              <tr className="h-[52px] bg-bg-secondary font-semibold">
                <td className="px-4 text-sm">{tc("total")}</td>
                <td className="px-4 text-right font-number text-sm">{totals.totalRequests}</td>
                <td className="px-4 text-right font-number text-sm">{formatTHB(totals.totalAmount)}</td>
                <td className="px-4 text-right font-number text-sm">
                  {formatTHB(totals.totalRequests > 0 ? Math.round(totals.totalAmount / totals.totalRequests) : 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-section-title text-text-primary">{tc("transferStatus")}</h2>
          </div>
          <div className="divide-y divide-border-light">
            {reconciliationItems.map((item) => {
              const retried = failedRetried.includes(item.referenceNumber);
              const status = retried ? "processing" : item.status;
              return (
                <div
                  key={item.referenceNumber}
                  className={cn("p-4", item.status === "failed" && !retried && "bg-red-50/60")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-number text-sm font-semibold">{item.referenceNumber}</p>
                      <p className="mt-1 text-caption text-text-muted">
                        {item.employeeId} · {formatTHB(item.amount)}
                      </p>
                    </div>
                    <TransferBadge status={status} />
                  </div>
                  {item.status === "failed" && !retried && (
                    <button
                      onClick={() => {
                        setFailedRetried((cur) => cur.concat(item.referenceNumber));
                        toast({ variant: "info", message: tc("retryingTransfer") });
                      }}
                      className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-red-300 bg-bg-canvas px-3 text-xs font-medium text-red-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> {tc("retryFailed")}
                    </button>
                  )}
                </div>
              );
            })}
            {reconciliationItems.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">{t("common.noData")}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function ReportsPageContent() {
  return (
    <ApiErrorBoundary>
      <ReportsContent />
    </ApiErrorBoundary>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 rounded-sm px-4 text-sm font-medium",
        active ? "bg-primary text-text-primary shadow-card" : "text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

function TransferBadge({ status }: { status: "processing" | "settled" | "failed" }) {
  if (status === "settled") return <StatusBadge status="disbursed" />;
  if (status === "failed") return <StatusBadge status="rejected" />;
  return <StatusBadge status="pending" />;
}
