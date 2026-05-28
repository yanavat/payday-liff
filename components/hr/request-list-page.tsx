"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Eye, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PayCycle } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableRowSkeleton } from "@/components/ui/table-row-skeleton";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useToast } from "@/components/ui/toast";
import {
  useEWARequests,
  useEmployees,
  useDepartments,
  useEWARequestActions,
} from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { EWARequestDto, EmployeeDto } from "@/lib/api/types";
import dayjs from "@/lib/dayjs";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { RequestDetailDrawer } from "./request-detail-drawer";

type StatusFilter = "all" | EWARequestDto["status"];
type PayCycleFilter = "all" | PayCycle;

const earnedRatioClass = (ratio: number) => {
  if (ratio >= 70) return "bg-red-50 text-red-700";
  if (ratio >= 50) return "bg-amber-50 text-amber-700";
  return "bg-primary-bg text-primary-dark";
};

function RequestListContent() {
  const t = useTranslations();
  const tc = useTranslations("common");
  const { toast } = useToast();

  const statusTabs: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: tc("all") },
    { value: "pending", label: tc("pending") },
    { value: "approved", label: tc("approved") },
    { value: "rejected", label: tc("rejected") },
    { value: "disbursed", label: tc("disbursed") },
  ];

  const payCycleTabs: Array<{ value: PayCycleFilter; label: string }> = [
    { value: "all", label: tc("all") },
    { value: "monthly", label: t("common.payCycle.monthly") },
    { value: "weekly", label: t("common.payCycle.weekly") },
  ];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payCycle, setPayCycle] = useState<PayCycleFilter>("all");
  const [department, setDepartment] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const {
    data: requestsData,
    loading,
    error,
    refetch,
  } = useEWARequests({
    status: status === "all" ? undefined : status,
    limit: 200,
  });
  const { data: employeesData } = useEmployees({ limit: 1000 });
  const { data: departmentsData } = useDepartments();
  const {
    approve,
    reject: rejectRequest,
    disburse,
    loading: actionLoading,
    error: actionError,
  } = useEWARequestActions();

  const allRequests = requestsData?.data ?? [];
  const allEmployees = employeesData?.data ?? [];
  const allDepartments = departmentsData?.data ?? [];

  const rows = useMemo(() => {
    return allRequests
      .map((request) => {
        const employee = allEmployees.find((e) => e.id === request.employeeId);
        return employee ? { request, employee } : null;
      })
      .filter(
        (row): row is { request: EWARequestDto; employee: EmployeeDto } =>
          row !== null,
      )
      .filter((row) => {
        const searchable =
          `${row.employee.name} ${row.employee.nameTh} ${row.employee.id} ${row.employee.department}`.toLowerCase();
        const matchesQuery = searchable.includes(query.trim().toLowerCase());
        const matchesCycle =
          payCycle === "all" || row.request.payCycle === payCycle;
        const matchesDepartment =
          department === "all" || row.employee.department === department;
        return matchesQuery && matchesCycle && matchesDepartment;
      })
      .sort(
        (a, b) =>
          dayjs(b.request.requestedAt).valueOf() -
          dayjs(a.request.requestedAt).valueOf(),
      );
  }, [allRequests, allEmployees, query, payCycle, department]);

  const activeRow = rows.find((row) => row.request.id === activeRequestId);
  const selectedCount = selectedIds.length;
  const visibleRows = rows.slice(0, 20);

  function toggleAllVisible(checked: boolean) {
    setSelectedIds(checked ? visibleRows.map((row) => row.request.id) : []);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set(current.concat(id)))
        : current.filter((item) => item !== id),
    );
  }

  async function handleConfirmApprove() {
    if (!activeRequestId) return;
    const result = await approve(activeRequestId);
    if (result) {
      toast({ variant: "success", message: t("requestDetail.approveSuccess") });
      setConfirmAction(null);
      setActiveRequestId(null);
      setSelectedIds([]);
      refetch();
    } else if (actionError) {
      toast({ variant: "error", message: getApiErrorMessage(actionError, t) });
    }
  }

  async function handleConfirmReject(reason?: string) {
    if (!activeRequestId) return;
    const result = await rejectRequest(activeRequestId, { hrNote: reason });
    if (result) {
      toast({ variant: "warning", message: t("requestDetail.rejectSuccess") });
      setConfirmAction(null);
      setActiveRequestId(null);
      setSelectedIds([]);
      refetch();
    } else if (actionError) {
      toast({ variant: "error", message: getApiErrorMessage(actionError, t) });
    }
  }

  async function handleDisburse(id: string) {
    const result = await disburse(id);
    if (result) {
      toast({
        variant: "success",
        message: t("requestDetail.disburseSuccess") ?? "Disbursed",
      });
      refetch();
    } else if (actionError) {
      toast({ variant: "error", message: getApiErrorMessage(actionError, t) });
    }
  }

  async function handleBulkApprove() {
    for (const id of selectedIds) {
      await approve(id);
    }
    toast({ variant: "success", message: t("requestDetail.approveSuccess") });
    setSelectedIds([]);
    refetch();
  }

  async function handleBulkReject() {
    for (const id of selectedIds) {
      await rejectRequest(id, { hrNote: "Bulk reject" });
    }
    toast({ variant: "warning", message: t("requestDetail.rejectSuccess") });
    setSelectedIds([]);
    refetch();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-secondary" />
        <div className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
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
            {t("requests.title")}
          </h1>
          <p className="mt-1 text-[13px] leading-[20.8px] text-text-secondary">
            {t("requests.searchPlaceholder")}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-[33px] items-center gap-2 rounded-md bg-[#006c4f] px-4 text-xs font-medium text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Download className="h-3 w-3" aria-hidden />
          {tc("export")}
        </button>
      </header>

      <section className="rounded-xl border border-border bg-bg-canvas p-[17px] shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
          <div className="space-y-3">
            <FilterRow label={t("common.status")}>
              {statusTabs.slice(0, 4).map((tab) => (
                <PillTab
                  key={tab.value}
                  active={status === tab.value}
                  onClick={() => setStatus(tab.value)}
                >
                  {tab.label}
                </PillTab>
              ))}
            </FilterRow>
            <FilterRow label={t("requests.payCycle")}>
              {payCycleTabs.map((tab) => (
                <PillTab
                  key={tab.value}
                  active={payCycle === tab.value}
                  onClick={() => setPayCycle(tab.value)}
                >
                  {tab.label}
                </PillTab>
              ))}
            </FilterRow>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("requests.searchPlaceholder")}
                className="h-[34px] w-60 rounded-md border border-border bg-bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-[34px] min-w-[152px] rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">{t("requests.allDepartments")}</option>
              {allDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.nameTh || d.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-[34px] min-w-[152px] items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-primary"
            >
              <CalendarDays className="h-4 w-4 text-text-muted" aria-hidden />
              30 days
            </button>
          </div>
        </div>
      </section>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{selectedCount} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {t("requests.bulkApprove")}
            </button>
            <button
              type="button"
              onClick={handleBulkReject}
              disabled={actionLoading}
              className="h-8 rounded-md border border-red-300 bg-bg-canvas px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {tc("reject")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-8 rounded-md px-3 text-sm font-medium transition hover:bg-bg-secondary"
            >
              {tc("cancel")}
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="h-[42px] border-b border-border bg-bg-secondary text-left text-xs font-semibold text-text-muted">
                <th className="w-10 px-4">
                  <input
                    type="checkbox"
                    aria-label={tc("all")}
                    checked={
                      visibleRows.length > 0 &&
                      selectedIds.length === visibleRows.length
                    }
                    onChange={(e) => toggleAllVisible(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <HeaderCell>{t("requests.employee")}</HeaderCell>
                <HeaderCell>{t("requests.department")}</HeaderCell>
                <HeaderCell>{t("requests.payCycle")}</HeaderCell>
                <HeaderCell align="right">
                  {t("requests.amount")} (THB)
                </HeaderCell>
                <HeaderCell align="right">
                  {t("requestDetail.earnedWage")}
                </HeaderCell>
                <HeaderCell>{t("requests.requestDate")}</HeaderCell>
                <HeaderCell>{t("common.status")}</HeaderCell>
                <HeaderCell align="right">{t("requests.actions")}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ request, employee }) => {
                const earned =
                  employee.payCycle === "monthly"
                    ? Math.round((employee.baseSalary / 31) * 14)
                    : Math.round((employee.baseSalary / 5) * 3);
                const ratio = Math.round(
                  (request.amount / Math.max(earned, 1)) * 100,
                );

                return (
                  <tr
                    key={request.id}
                    onClick={() => setActiveRequestId(request.id)}
                    className="h-[62px] cursor-pointer border-b border-border-light transition last:border-b-0 hover:bg-primary-subtle"
                  >
                    <td className="px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${employee.nameTh}`}
                        checked={selectedIds.includes(request.id)}
                        onChange={(e) =>
                          toggleRow(request.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={employee.name.slice(0, 2)}
                          size="md"
                        />
                        <div>
                          <div className="text-[13px] font-medium leading-[20.8px] text-text-primary">
                            {employee.nameTh}
                          </div>
                          <div className="text-[11px] leading-[16.5px] text-text-muted">
                            ID: {employee.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-[13px] text-text-secondary">
                      {employee.department}
                    </td>
                    <td className="px-4">
                      <PayCycleBadge type={request.payCycle} />
                    </td>
                    <td className="px-4 text-right font-number text-[13px] font-semibold text-text-primary">
                      {formatTHB(request.amount)}
                    </td>
                    <td className="px-4 text-right font-number text-[13px] text-text-secondary">
                      {formatTHB(earned)}
                      <span
                        className={cn(
                          "ml-2 rounded-full px-2 py-1 text-[11px] font-medium",
                          earnedRatioClass(ratio),
                        )}
                      >
                        {ratio}%
                      </span>
                    </td>
                    <td className="px-4 text-[13px] text-text-secondary">
                      {dayjs(request.requestedAt).format("DD MMM YYYY")}
                    </td>
                    <td className="px-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRequestId(request.id);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary-dark transition hover:bg-primary-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {tc("viewAll")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleRows.length === 0 && (
          <EmptyState
            message={t("common.noData")}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setPayCycle("all");
                  setDepartment("all");
                }}
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white"
              >
                {tc("retry")}
              </button>
            }
            className="m-4"
          />
        )}

        <div className="flex items-center justify-between border-t border-border bg-bg-canvas px-4 py-3">
          <p className="text-[11px] text-text-muted">
            Showing {visibleRows.length ? 1 : 0} to {visibleRows.length} of{" "}
            {rows.length}
          </p>
        </div>
      </section>

      <RequestDetailDrawer
        request={activeRow?.request as unknown as EWARequestDto | null}
        employee={activeRow?.employee as unknown as EmployeeDto}
        history={
          allRequests.filter(
            (r) => r.employeeId === activeRow?.request.employeeId,
          ) as unknown as EWARequestDto[]
        }
        open={!!activeRequestId}
        confirmAction={confirmAction}
        actionLoading={actionLoading}
        onClose={() => {
          setActiveRequestId(null);
          setConfirmAction(null);
        }}
        onApprove={() => setConfirmAction("approve")}
        onReject={() => setConfirmAction("reject")}
        onDisburse={
          activeRequestId ? () => handleDisburse(activeRequestId) : undefined
        }
        onCancelConfirm={() => setConfirmAction(null)}
        onConfirmApprove={handleConfirmApprove}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
}

export function RequestListPage() {
  return (
    <ApiErrorBoundary>
      <RequestListContent />
    </ApiErrorBoundary>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-xs font-medium text-text-secondary">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PillTab({
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
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-[13px] py-[5px] text-xs font-medium leading-[16.8px] transition",
        active
          ? "border-[#006c4f] bg-primary-subtle text-[#006c4f]"
          : "border-border bg-bg-canvas text-text-secondary hover:bg-bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-3", align === "right" && "text-right")}>
      {children}
    </th>
  );
}
