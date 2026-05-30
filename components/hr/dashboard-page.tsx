"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Clock3, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/components/ui/metric-card";
import { MetricCardSkeleton } from "@/components/ui/metric-card-skeleton";
import { TableRowSkeleton } from "@/components/ui/table-row-skeleton";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { RequestDetailDrawer } from "./request-detail-drawer";
import { useEWARequests } from "@/lib/api/hooks";
import { useEmployees } from "@/lib/api/hooks";
import { usePayrollCycles } from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import dayjs from "@/lib/dayjs";
import { formatTHB, formatTHBCompact } from "@/lib/utils/format";

const statusSegments = [
  { status: "approved" as const, className: "bg-primary" },
  { status: "pending" as const, className: "bg-amber-400" },
  { status: "rejected" as const, className: "bg-red-400" },
];

function DashboardContent() {
  const t = useTranslations();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
  } = useEWARequests({ limit: 200 });
  const { data: employeesData, loading: employeesLoading } = useEmployees({
    limit: 200,
  });
  const { data: recentData, loading: recentLoading } = useEWARequests({
    limit: 5,
    sort: "desc",
  });
  const { data: cyclesData } = usePayrollCycles({ limit: 10 });

  const allRequests = requestsData?.data ?? [];
  const allEmployees = employeesData?.data ?? [];
  const recentRequests = recentData?.data ?? [];
  const cycles = cyclesData?.data ?? [];

  const monthlyCycle = cycles.find((c) => c.type === "monthly" && c.isActive);
  const weeklyCycle = cycles.find((c) => c.type === "weekly" && c.isActive);

  function getCycleProgress(cycle: typeof monthlyCycle) {
    if (!cycle)
      return { daysElapsed: 0, totalDays: 30, paydayDate: "", cutoffDate: "" };
    const start = dayjs(cycle.periodStart);
    const end = dayjs(cycle.periodEnd);
    const today = dayjs();
    const totalDays = end.diff(start, "day") + 1;
    const daysElapsed = Math.min(today.diff(start, "day") + 1, totalDays);
    return {
      daysElapsed,
      totalDays,
      paydayDate: cycle.paydayDate,
      cutoffDate: cycle.cutoffDate,
    };
  }

  const monthlyProgress = getCycleProgress(monthlyCycle);
  const weeklyProgress = getCycleProgress(weeklyCycle);

  const statusCounts = useMemo(
    () => ({
      pending: allRequests.filter((r) => r.status === "pending").length,
      approved: allRequests.filter((r) => r.status === "approved").length,
      rejected: allRequests.filter((r) => r.status === "rejected").length,
      disbursed: allRequests.filter((r) => r.status === "disbursed").length,
    }),
    [allRequests],
  );

  const disbursedAmount = useMemo(
    () =>
      allRequests
        .filter((r) => r.status === "disbursed" || r.status === "approved")
        .reduce((sum, r) => sum + r.requestedAmount, 0),
    [allRequests],
  );

  const totalForChart = statusSegments.reduce(
    (sum, s) => sum + statusCounts[s.status],
    0,
  );

  const recentRows = useMemo(
    () =>
      recentRequests
        .map((request) => ({
          request,
          employee: allEmployees.find((e) => e.id === request.employeeId),
        }))
        .filter(
          (
            row,
          ): row is {
            request: typeof row.request;
            employee: NonNullable<typeof row.employee>;
          } => !!row.employee,
        ),
    [recentRequests, allEmployees],
  );

  const activeRow = recentRows.find(
    (row) => row.request.id === activeRequestId,
  );

  const isLoading = requestsLoading || employeesLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card">
          <div className="border-b border-border px-5 py-3.5">
            <div className="h-4 w-32 animate-pulse rounded bg-bg-secondary" />
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
        {getApiErrorMessage(requestsError, t)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("dashboard.pendingRequests")}
          value={String(statusCounts.pending)}
          trend={3}
          trendLabel={t("dashboard.fromYesterday")}
          icon={<Clock3 className="h-[18px] w-[18px]" />}
          variant="hero"
        />
        <MetricCard
          label={t("dashboard.approvedToday")}
          value={String(statusCounts.approved)}
          sub={`${formatTHBCompact(disbursedAmount)} ${t("dashboard.total")}`}
          trend={8}
          trendLabel={t("dashboard.today")}
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label={t("dashboard.disbursedMonth")}
          value={formatTHBCompact(disbursedAmount)}
          sub={t("dashboard.fromBudget")}
          icon={<Banknote className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label={t("dashboard.enrolledEmployees")}
          value={String(allEmployees.length)}
          sub=""
          icon={<Users className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
        <section className="overflow-hidden rounded-lg border border-border bg-bg-canvas shadow-card transition-shadow duration-200 hover:shadow-hover">
          <div className="border-b border-border px-5 py-3.5">
            <SectionHeader
              title={t("dashboard.recentRequests")}
              action={
                <Link
                  href="/th/hr/requests"
                  className="text-sm font-medium text-primary hover:text-primary-dark"
                >
                  {t("common.viewAll")}
                </Link>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="h-10 border-b border-border bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                  <th className="px-4">{t("employees.name")}</th>
                  <th className="px-4">{t("employees.department")}</th>
                  <th className="px-4 text-right">{t("requests.amount")}</th>
                  <th className="px-4">{t("requests.requestDate")}</th>
                  <th className="px-4">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map(({ request, employee }) => (
                  <tr
                    key={request.id}
                    onClick={() => setActiveRequestId(request.id)}
                    className="h-[52px] cursor-pointer border-b border-border-light transition last:border-0 hover:bg-primary-subtle"
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={employee.avatarInitials ?? employee.name.slice(0, 2)}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {employee.name}
                          </div>
                          <div className="text-caption text-text-muted">
                            {employee.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-text-secondary">
                      {employee.departmentName ?? employee.department}
                    </td>
                    <td className="px-4 text-right font-number text-sm font-semibold">
                      {formatTHB(request.requestedAmount)}
                    </td>
                    <td className="px-4 text-sm text-text-muted">
                      {dayjs(request.requestedAt).format("DD/MM/YY")}
                    </td>
                    <td className="px-4">
                      <StatusBadge status={request.status} />
                    </td>
                  </tr>
                ))}
                {recentRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[13px] text-text-muted"
                    >
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-3">
          <section className="rounded-lg border border-border bg-bg-canvas p-4 shadow-card transition-shadow duration-200 hover:shadow-hover">
            <h2 className="text-section-title text-text-primary">
              {t("dashboard.payrollCycle")}
            </h2>
            <div className="mt-4 space-y-4">
              <CycleProgress
                label={`${t("common.payCycle.monthly")} · ${monthlyProgress.daysElapsed}`}
                value={monthlyProgress.daysElapsed}
                max={monthlyProgress.totalDays}
              />
              <CycleProgress
                label={`${t("common.payCycle.weekly")} · ${weeklyProgress.daysElapsed}`}
                value={weeklyProgress.daysElapsed}
                max={weeklyProgress.totalDays}
              />
            </div>
            <div className="mt-4 space-y-2 text-caption text-text-secondary">
              {monthlyCycle && (
                <DateLine
                  label={t("settings.ewaCutoffDays")}
                  value={dayjs(monthlyCycle.cutoffDate).format("DD MMM")}
                />
              )}
              {monthlyCycle && (
                <DateLine
                  label={t("settings.weeklyPayday")}
                  value={dayjs(monthlyCycle.paydayDate).format("DD MMM")}
                />
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-bg-canvas p-4 shadow-card transition-shadow duration-200 hover:shadow-hover">
            <h2 className="text-section-title text-text-primary">
              {t("dashboard.requestBreakdown")}
            </h2>
            <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[conic-gradient(#2DBD8F_0_60%,#F59E0B_60%_88%,#EF4444_88%_100%)]">
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-bg-canvas">
                <span className="font-number text-2xl font-bold">
                  {totalForChart}
                </span>
                <span className="text-[11px] text-text-muted">
                  {t("requests.title")}
                </span>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {statusSegments.map((segment) => (
                <div
                  key={segment.status}
                  className="flex items-center justify-between text-caption"
                >
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${segment.className}`}
                    />
                    {t(`status.${segment.status}`)}
                  </span>
                  <span className="font-number font-semibold text-text-primary">
                    {statusCounts[segment.status]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <RequestDetailDrawer
        request={activeRow?.request ?? null}
        employee={activeRow?.employee}
        history={
          allRequests.filter((r) => r.employeeId === activeRow?.request.employeeId)
        }
        open={!!activeRequestId}
        confirmAction={confirmAction}
        onClose={() => {
          setActiveRequestId(null);
          setConfirmAction(null);
        }}
        onApprove={() => setConfirmAction("approve")}
        onReject={() => setConfirmAction("reject")}
        onCancelConfirm={() => setConfirmAction(null)}
        onConfirmApprove={() => {
          setConfirmAction(null);
          setActiveRequestId(null);
        }}
        onConfirmReject={() => {
          setConfirmAction(null);
          setActiveRequestId(null);
        }}
      />
    </div>
  );
}

export function DashboardPageContent() {
  return (
    <ApiErrorBoundary>
      <DashboardContent />
    </ApiErrorBoundary>
  );
}

function CycleProgress({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-caption">
        <span className="text-text-primary">{label}</span>
        <span className="font-number font-medium text-text-secondary">
          {value}/{max}
        </span>
      </div>
      <ProgressBar value={value} max={max} />
    </div>
  );
}

function DateLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span
        className={
          highlight
            ? "rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700"
            : "font-medium text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}
