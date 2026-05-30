"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Download, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableRowSkeleton } from "@/components/ui/table-row-skeleton";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useToast } from "@/components/ui/toast";
import {
  useDepartments,
  useEmployees,
  useEWARequestActions,
  useEWARequests,
  useSettings,
} from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { EmployeeDto, EWARequestDto } from "@/lib/api/types";
import dayjs from "@/lib/dayjs";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useHRRole } from "./hr-auth-gate";

type ExportRow = {
  request: EWARequestDto;
  employee?: EmployeeDto;
};

type ExportHistoryItem = {
  key: string;
  date: string;
  exportedBy: string;
  count: number;
};

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ewa-transfer-export-${new Date().toISOString()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function TransferExportContent() {
  const t = useTranslations("transferExport");
  const tc = useTranslations("common");
  const router = useRouter();
  const { role } = useHRRole();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmExport, setConfirmExport] = useState(false);
  const [failedRequestId, setFailedRequestId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useEWARequests({ limit: 200 });
  const { data: employeesData, loading: employeesLoading } = useEmployees({ limit: 200 });
  const { data: settings, loading: settingsLoading } = useSettings();
  const { data: departmentsData } = useDepartments();
  const {
    exportBatch,
    markTransferFailed,
    loading: actionLoading,
    error: actionError,
  } = useEWARequestActions();

  useEffect(() => {
    if (role === "viewer") {
      router.push("/hr/dashboard");
    }
  }, [role, router]);

  const employees = useMemo(() => employeesData?.data ?? [], [employeesData]);
  const allDepartments = useMemo(() => departmentsData?.data ?? [], [departmentsData]);
  const requests = useMemo(() => requestsData?.data ?? [], [requestsData]);
  const rows = useMemo<ExportRow[]>(() => {
    return requests
      .filter(
        (request) =>
          request.status === "approved" ||
          (request.status === "disbursed" && request.exported),
      )
      .map((request) => ({
        request,
        employee:
          request.employee ??
          employees.find((employee) => employee.id === request.employeeId),
      }))
      .filter(({ request, employee }) => {
        const reqDate = dayjs(request.requestedAt);
        const matchesFrom = !dateFrom || !reqDate.isBefore(dayjs(dateFrom), "day");
        const matchesTo = !dateTo || !reqDate.isAfter(dayjs(dateTo), "day");
        const matchesDept = deptFilter === "all" || employee?.department === deptFilter;
        return matchesFrom && matchesTo && matchesDept;
      })
      .sort((a, b) => {
        const aDate = a.request.exportedAt ?? a.request.requestedAt;
        const bDate = b.request.exportedAt ?? b.request.requestedAt;
        return dayjs(bDate).valueOf() - dayjs(aDate).valueOf();
      });
  }, [employees, requests, dateFrom, dateTo, deptFilter]);

  const selectableRows = rows.filter(
    ({ request }) => request.status === "approved" && !request.exported,
  );
  const selectedRows = rows.filter(({ request }) => selectedIds.includes(request.id));
  const selectedTotal = selectedRows.reduce(
    (total, { request }) => total + request.netAmount,
    0,
  );
  const exportFormatLabel =
    settings?.bankExportFormat === "scb_anywhere"
      ? "SCB Anywhere CSV"
      : "Generic CSV";
  const allSelectableSelected =
    selectableRows.length > 0 && selectedIds.length === selectableRows.length;

  const history = useMemo<ExportHistoryItem[]>(() => {
    const grouped = new Map<string, ExportHistoryItem>();
    for (const request of requests) {
      if (!request.exported || !request.exportedAt) continue;
      const key = `${request.exportedAt}-${request.exportedBy ?? "-"}`;
      const current = grouped.get(key) ?? {
        key,
        date: request.exportedAt,
        exportedBy: request.exportedBy ?? "-",
        count: 0,
      };
      current.count += 1;
      grouped.set(key, current);
    }
    return Array.from(grouped.values()).sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
    );
  }, [requests]);

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? selectableRows.map(({ request }) => request.id) : []);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set(current.concat(id)))
        : current.filter((item) => item !== id),
    );
  }

  async function handleConfirmExport() {
    const csv = await exportBatch(selectedIds);
    if (csv) {
      downloadCsv(csv);
      toast({ variant: "success", message: t("exportSuccess") });
      setConfirmExport(false);
      setSelectedIds([]);
      await refetchRequests();
    } else if (actionError) {
      toast({ variant: "error", message: getApiErrorMessage(actionError, tc) });
    }
  }

  async function handleConfirmFailed() {
    if (!failedRequestId) return;
    const result = await markTransferFailed(failedRequestId);
    if (result) {
      toast({ variant: "warning", message: t("requeued") });
      setFailedRequestId(null);
      await refetchRequests();
    } else if (actionError) {
      toast({ variant: "error", message: getApiErrorMessage(actionError, tc) });
    }
  }

  if (requestsLoading || employeesLoading || settingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-bg-secondary" />
        <section className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
          <table className="w-full border-collapse">
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
        {getApiErrorMessage(requestsError, tc)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] leading-6 text-text-secondary">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmExport(true)}
          disabled={selectedIds.length === 0 || actionLoading}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("exportCsv")}
        </button>
      </header>

      <section className="rounded-xl border border-border bg-bg-canvas p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-[34px] items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-muted">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-text-primary outline-none"
              aria-label="From date"
            />
          </label>
          <label className="inline-flex h-[34px] items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-muted">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-text-primary outline-none"
              aria-label="To date"
            />
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-[34px] min-w-[152px] rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("department")}</option>
            {allDepartments.map((d) => (
              <option key={d.id} value={d.name}>{d.nameTh || d.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="h-10 border-b border-border bg-bg-secondary text-left text-xs font-semibold text-text-muted">
                <th className="w-10 px-4">
                  <input
                    type="checkbox"
                    aria-label={t("selectAll")}
                    checked={allSelectableSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <HeaderCell>{t("employeeName")}</HeaderCell>
                <HeaderCell>{t("department")}</HeaderCell>
                <HeaderCell align="right">{t("amount")}</HeaderCell>
                <HeaderCell>{t("requestedDate")}</HeaderCell>
                <HeaderCell>{tc("status")}</HeaderCell>
                <HeaderCell align="right">{t("actions")}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ request, employee }) => {
                const selectable =
                  request.status === "approved" && !request.exported;
                return (
                  <tr
                    key={request.id}
                    className="h-[58px] border-b border-border-light last:border-b-0 hover:bg-primary-subtle"
                  >
                    <td className="px-4">
                      <input
                        type="checkbox"
                        aria-label={`${t("select")} ${employee?.name ?? request.employeeId}`}
                        checked={selectedIds.includes(request.id)}
                        disabled={!selectable}
                        onChange={(event) => toggleRow(request.id, event.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4">
                      <div className="text-sm font-medium text-text-primary">
                        {employee?.name ?? request.employeeId}
                      </div>
                      <div className="text-caption text-text-muted">{request.id}</div>
                    </td>
                    <td className="px-4 text-sm text-text-secondary">
                      {employee?.departmentName ?? employee?.department ?? "-"}
                    </td>
                    <td className="px-4 text-right font-number text-sm font-semibold">
                      {formatTHB(request.netAmount)}
                    </td>
                    <td className="px-4 text-sm text-text-secondary">
                      {dayjs(request.requestedAt).format("DD MMM YYYY")}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={request.status} />
                        {request.exported && (
                          <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-badge font-medium text-text-secondary">
                            {t("alreadyExported")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 text-right">
                      {request.status === "disbursed" && request.exported ? (
                        <button
                          type="button"
                          onClick={() => setFailedRequestId(request.id)}
                          disabled={actionLoading}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          {t("markFailed")}
                        </button>
                      ) : (
                        <span className="text-caption text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState message={t("empty")} className="m-4" />}
      </section>

      <section className="rounded-xl border border-border bg-bg-canvas p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-text-muted" aria-hidden />
          <h2 className="text-section-title text-text-primary">{t("history")}</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-text-muted">{t("noHistory")}</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md border border-border bg-bg-secondary px-4 py-3 text-sm"
              >
                <span className="text-text-primary">
                  {dayjs(item.date).format("DD MMM YYYY HH:mm")}
                </span>
                <span className="text-text-secondary">{item.exportedBy}</span>
                <span className="font-number font-semibold text-text-primary">
                  {t("requestCount", { count: item.count })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirmExport}
        onClose={() => setConfirmExport(false)}
        onConfirm={handleConfirmExport}
        title={t("confirmExportTitle")}
        message={t("confirmExportMessage", {
          count: selectedIds.length,
          total: formatTHB(selectedTotal),
        }) + ` Export as: ${exportFormatLabel}`}
        confirmLabel={t("exportCsv")}
        isLoading={actionLoading}
      />
      <ConfirmModal
        open={failedRequestId !== null}
        onClose={() => setFailedRequestId(null)}
        onConfirm={handleConfirmFailed}
        title={t("confirmFailedTitle")}
        message={t("confirmFailedMessage")}
        confirmLabel={t("markFailed")}
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}

export function TransferExportPage() {
  return (
    <ApiErrorBoundary>
      <TransferExportContent />
    </ApiErrorBoundary>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-3", align === "right" && "text-right")}>
      {children}
    </th>
  );
}
