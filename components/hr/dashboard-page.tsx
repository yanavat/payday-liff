"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Clock3, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { RequestDetailDrawer } from "./request-detail-drawer";
import {
  employees,
  monthlyPayCycle,
  requests,
  weeklyPayCycle,
} from "@/lib/mock";
import type { EWARequest } from "@/types";
import dayjs from "@/lib/dayjs";
import { formatTHB, formatTHBCompact } from "@/lib/utils/format";

const statusSegments = [
  { status: "approved" as const, className: "bg-primary" },
  { status: "pending" as const, className: "bg-amber-400" },
  { status: "rejected" as const, className: "bg-red-400" },
];

export function DashboardPageContent() {
  const t = useTranslations();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const recentRows = requests
    .slice()
    .sort(
      (a, b) => dayjs(b.requestedAt).valueOf() - dayjs(a.requestedAt).valueOf(),
    )
    .slice(0, 5)
    .map((request) => ({
      request,
      employee: employees.find(
        (employee) => employee.id === request.employeeId,
      ),
    }))
    .filter(
      (
        row,
      ): row is { request: EWARequest; employee: (typeof employees)[number] } =>
        !!row.employee,
    );
  const activeRow = recentRows.find(
    (row) => row.request.id === activeRequestId,
  );
  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === "pending")
        .length,
      approved: requests.filter((request) => request.status === "approved")
        .length,
      rejected: requests.filter((request) => request.status === "rejected")
        .length,
      disbursed: requests.filter((request) => request.status === "disbursed")
        .length,
    };
  }, []);
  const disbursedAmount = requests
    .filter(
      (request) =>
        request.status === "disbursed" || request.status === "approved",
    )
    .reduce((sum, request) => sum + request.amount, 0);
  const totalForChart = statusSegments.reduce(
    (sum, segment) => sum + statusCounts[segment.status],
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("dashboard.pendingRequests")}
          value={String(statusCounts.pending)}
          trend={3}
          trendLabel="from yesterday"
          icon={<Clock3 className="h-[18px] w-[18px]" />}
          variant="hero"
        />
        <MetricCard
          label={t("dashboard.approvedToday")}
          value={String(statusCounts.approved)}
          sub={`${formatTHBCompact(disbursedAmount)} total`}
          trend={8}
          trendLabel="today"
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label={t("dashboard.disbursedMonth")}
          value={formatTHBCompact(disbursedAmount)}
          sub="from THB 500K"
          icon={<Banknote className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label={t("dashboard.enrolledEmployees")}
          value={String(employees.length)}
          sub="Phase 2"
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
                          initials={employee.nameTh.slice(0, 2)}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {employee.nameTh}
                          </div>
                          <div className="text-caption text-text-muted">
                            {employee.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-text-secondary">
                      {employee.department}
                    </td>
                    <td className="px-4 text-right font-number text-sm font-semibold">
                      {formatTHB(request.amount)}
                    </td>
                    <td className="px-4 text-sm text-text-muted">
                      {dayjs(request.requestedAt).format("DD/MM/YY")}
                    </td>
                    <td className="px-4">
                      <StatusBadge status={request.status} />
                    </td>
                  </tr>
                ))}
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
                label={`${t("common.payCycle.monthly")} · ${monthlyPayCycle.daysElapsed}`}
                value={monthlyPayCycle.daysElapsed}
                max={monthlyPayCycle.totalDays}
              />
              <CycleProgress
                label={`${t("common.payCycle.weekly")} · ${weeklyPayCycle.daysElapsed}`}
                value={weeklyPayCycle.daysElapsed}
                max={weeklyPayCycle.totalDays}
              />
            </div>
            <div className="mt-4 space-y-2 text-caption text-text-secondary">
              <DateLine
                label={t("settings.ewaCutoffDays")}
                value="Tomorrow"
                highlight
              />
              <DateLine label={t("settings.weeklyPayday")} value="Friday" />
              <DateLine label={t("settings.ewaCutoffDays")} value="28 May" />
              <DateLine label={t("settings.weeklyPayday")} value="31 May" />
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
        history={requests.filter(
          (request) => request.employeeId === activeRow?.request.employeeId,
        )}
        open={!!activeRequestId}
        confirmAction={confirmAction}
        onClose={() => {
          setActiveRequestId(null);
          setConfirmAction(null);
        }}
        onApprove={() => setConfirmAction("approve")}
        onReject={() => setConfirmAction("reject")}
        onCancelConfirm={() => setConfirmAction(null)}
        onConfirmApprove={() => setConfirmAction(null)}
        onConfirmReject={() => setConfirmAction(null)}
      />
    </div>
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
