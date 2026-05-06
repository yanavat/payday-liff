"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { departments, employees, requests } from "@/lib/mock";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function EmployeesPageContent() {
  const t = useTranslations();
  const tc = useTranslations("employees");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [payCycle, setPayCycle] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    return employees.filter((employee) => {
      const search =
        `${employee.name} ${employee.nameTh} ${employee.id}`.toLowerCase();
      return (
        search.includes(query.toLowerCase()) &&
        (department === "all" || employee.department === department) &&
        (payCycle === "all" || employee.payCycle === payCycle) &&
        (status === "all" || employee.ewaStatus === status)
      );
    });
  }, [department, payCycle, query, status]);

  const enrolled = employees.length;
  const notEligible = employees.filter(
    (employee) => employee.ewaStatus !== "eligible",
  ).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
          {tc("title")}
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          {enrolled} enrolled · {notEligible} not eligible
        </p>
      </header>

      <section className="rounded-xl border border-border bg-bg-canvas p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tc("searchPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <FilterSelect
            value={department}
            onChange={setDepartment}
            options={[
              ["all", t("requests.allDepartments")],
              ...departments.map(
                (department) =>
                  [department.nameTh, department.nameTh] as [string, string],
              ),
            ]}
          />
          <FilterSelect
            value={payCycle}
            onChange={setPayCycle}
            options={[
              [
                "all",
                t("common.payCycle.monthly") +
                  "/" +
                  t("common.payCycle.weekly"),
              ],
              ["monthly", t("common.payCycle.monthly")],
              ["weekly", t("common.payCycle.weekly")],
            ]}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            options={[
              ["all", t("status.all")],
              ["eligible", t("employees.eligible")],
              ["limit_reached", t("employees.limitReached")],
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
                <th className="px-4 text-right">
                  {t("requestDetail.maxAllowed")}
                </th>
                <th className="px-4 text-right">{t("profile.used")}</th>
                <th className="px-4">{t("profile.remaining")}</th>
                <th className="px-4">{tc("ewaSatus")}</th>
                <th className="px-4 text-right">{t("requests.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((employee) => {
                const used = requests
                  .filter(
                    (request) =>
                      request.employeeId === employee.id &&
                      request.status !== "rejected",
                  )
                  .reduce((sum, request) => sum + request.amount, 0);
                const max =
                  employee.payCycle === "monthly"
                    ? Math.round(employee.baseSalary * 0.25)
                    : Math.round(employee.baseSalary * 0.5);
                const remainingCount =
                  employee.ewaStatus === "eligible" ? 1 : 0;
                return (
                  <tr
                    key={employee.id}
                    className="h-[52px] border-b border-border-light last:border-0 hover:bg-primary-subtle"
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
                    <td className="px-4">
                      <PayCycleBadge type={employee.payCycle} />
                    </td>
                    <td className="px-4 text-right font-number text-sm font-semibold">
                      {formatTHB(max)}
                    </td>
                    <td className="px-4 text-right font-number text-sm text-text-secondary">
                      {formatTHB(used)}
                    </td>
                    <td className="px-4 text-sm">
                      <span className="mr-2 font-number">
                        {remainingCount} / 2
                      </span>
                      <span className="inline-flex gap-1 align-middle">
                        {[0, 1].map((index) => (
                          <span
                            key={index}
                            className={cn(
                              "h-2 w-2 rounded-full",
                              index < remainingCount
                                ? "bg-primary"
                                : "bg-border",
                            )}
                          />
                        ))}
                      </span>
                    </td>
                    <td className="px-4">
                      <EWAStatusBadge status={employee.ewaStatus} />
                    </td>
                    <td className="px-4 text-right">
                      {employee.ewaStatus === "eligible" ? (
                        <Link
                          href={`/hr/employees/${employee.id}/request`}
                          className="inline-flex h-8 items-center rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-primary hover:bg-bg-secondary"
                        >
                          {tc("requestOnBehalf")}
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="h-8 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-muted opacity-50"
                        >
                          {tc("requestOnBehalf")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState message={t("common.noData")} className="m-4" />
        )}
        <div className="border-t border-border px-4 py-3 text-caption text-text-muted">
          Showing {Math.min(rows.length, 20)} / {rows.length}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-md border border-border bg-bg-secondary px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

const ewaStatusClassMap: Record<string, string> = {
  eligible: "bg-green-100 text-green-800",
  limit_reached: "bg-bg-secondary text-text-secondary",
  suspended: "bg-red-100 text-red-800",
};

function EWAStatusBadge({
  status,
}: {
  status: keyof typeof ewaStatusClassMap;
}) {
  const tc = useTranslations("employees");
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-badge font-medium",
        ewaStatusClassMap[status],
      )}
    >
      {tc(
        status === "limit_reached"
          ? "limitReached"
          : (status as "eligible" | "suspended"),
      )}
    </span>
  );
}
