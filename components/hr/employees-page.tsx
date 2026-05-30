"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { TableRowSkeleton } from "@/components/ui/table-row-skeleton";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useEmployees, useDepartments } from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { EmployeeDto } from "@/lib/api/types";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useHRRole } from "./hr-auth-gate";
import { EmployeeImportDrawer } from "./employee-import-drawer";
import { EmployeeDetailDrawer } from "./employee-detail-drawer";

function EmployeesContent() {
  const t = useTranslations();
  const tc = useTranslations("employees");
  const { role } = useHRRole();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [payCycle, setPayCycle] = useState("all");
  const [status, setStatus] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<EmployeeDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(value), 300);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const { data: employeesData, loading, error, refetch } = useEmployees({
    department: department === "all" ? undefined : department,
    payCycle: payCycle === "all" ? undefined : (payCycle as "monthly" | "weekly"),
    limit: 200,
  });
  const { data: departmentsData } = useDepartments();

  const allEmployees = useMemo(() => employeesData?.data ?? [], [employeesData]);
  const allDepartments = departmentsData?.data ?? [];

  const rows = useMemo(() => {
    const matchesStatus = (employee: EmployeeDto) =>
      status === "all" || (employee.ewaEligibility ?? "eligible") === status;
    if (!debouncedQuery) return allEmployees.filter(matchesStatus);
    const q = debouncedQuery.toLowerCase();
    return allEmployees.filter((e) =>
      `${e.name} ${e.employeeCode ?? ""} ${e.id}`.toLowerCase().includes(q) &&
      matchesStatus(e)
    );
  }, [allEmployees, debouncedQuery, status]);

  const enrolled = employeesData?.total ?? 0;
  const notEligible = allEmployees.filter((e) => (e.ewaEligibility ?? "eligible") !== "eligible").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-bg-secondary" />
        <div className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
          <table className="w-full border-collapse">
            <tbody>
              <TableRowSkeleton /><TableRowSkeleton /><TableRowSkeleton />
              <TableRowSkeleton /><TableRowSkeleton />
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
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
            {tc("title")}
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            {enrolled} enrolled · {notEligible} not eligible
          </p>
        </div>
        {role === "hr_manager" && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {tc("importEmployees")}
          </button>
        )}
      </header>

      <section className="rounded-xl border border-border bg-bg-canvas p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={tc("searchPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <FilterSelect
            value={department}
            onChange={setDepartment}
            options={[
              ["all", t("requests.allDepartments")],
              ...allDepartments.map((d) => [d.id, d.nameTh || d.name] as [string, string]),
            ]}
          />
          <FilterSelect
            value={payCycle}
            onChange={setPayCycle}
            options={[
              ["all", t("common.payCycle.monthly") + "/" + t("common.payCycle.weekly")],
              ["monthly", t("common.payCycle.monthly")],
              ["weekly", t("common.payCycle.weekly")],
            ]}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            options={[
              ["all", t("status.all") ?? "All"],
              ["eligible", t("employees.eligible")],
              ["quota_used", t("employees.limitReached")],
              ["suspended", t("employees.suspended")],
            ]}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="h-10 bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                <th className="px-4">{tc("name")}</th>
                <th className="px-4">{tc("department")}</th>
                <th className="px-4">{tc("payCycle")}</th>
                <th className="px-4 text-right">{t("requestDetail.maxAllowed")}</th>
                <th className="px-4">{tc("ewaSatus")}</th>
                <th className="px-4 text-right">{t("requests.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((employee) => {
                const eligibility = employee.ewaEligibility ?? "eligible";
                const max = employee.currentPeriod?.maxWithdrawable ?? employee.ewaMaxAmount ?? 0;
                return (
                  <tr key={employee.id} className="h-[52px] border-b border-border-light last:border-0 hover:bg-primary-subtle">
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={employee.avatarInitials ?? employee.name.slice(0, 2)} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{employee.name}</div>
                          <div className="text-caption text-text-muted">{employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-text-secondary">{employee.departmentName ?? employee.department}</td>
                    <td className="px-4"><PayCycleBadge type={employee.payCycle} /></td>
                    <td className="px-4 text-right font-number text-sm font-semibold">{formatTHB(max)}</td>
                    <td className="px-4"><EWAStatusBadge status={eligibility} /></td>
                    <td className="px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setDetailEmployee(employee); setDetailOpen(true); }}
                          className="h-8 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-primary hover:bg-bg-secondary"
                        >
                          View
                        </button>
                        {eligibility === "eligible" ? (
                          <Link
                            href={`/hr/employees/${employee.id}/request`}
                            className="inline-flex h-8 items-center rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-primary hover:bg-bg-secondary"
                          >
                            {tc("requestOnBehalf")}
                          </Link>
                        ) : (
                          <button disabled className="h-8 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-muted opacity-50">
                            {tc("requestOnBehalf")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState message={t("common.noData")} className="m-4" />}
        <div className="border-t border-border px-4 py-3 text-caption text-text-muted">
          Showing {Math.min(rows.length, 20)} / {rows.length}
        </div>
      </section>

      <EmployeeImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void refetch();
        }}
      />

      <EmployeeDetailDrawer
        employee={detailEmployee}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => { void refetch(); }}
      />
    </div>
  );
}

export function EmployeesPageContent() {
  return (
    <ApiErrorBoundary>
      <EmployeesContent />
    </ApiErrorBoundary>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border bg-bg-secondary px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}

const ewaStatusClassMap: Record<string, string> = {
  eligible: "bg-green-100 text-green-800",
  quota_used: "bg-bg-secondary text-text-secondary",
  suspended: "bg-red-100 text-red-800",
};

function EWAStatusBadge({ status }: { status: string }) {
  const tc = useTranslations("employees");
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-badge font-medium", ewaStatusClassMap[status] ?? "bg-bg-secondary text-text-secondary")}>
      {status === "quota_used" ? tc("limitReached") : tc(status as "eligible" | "suspended")}
    </span>
  );
}
