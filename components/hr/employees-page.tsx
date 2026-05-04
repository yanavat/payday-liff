"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { departments, employees, requests } from "@/lib/mock";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const ewaStatusMap = {
  eligible: { label: "มีสิทธิ์", className: "bg-green-100 text-green-800" },
  limit_reached: {
    label: "ใช้ครบแล้ว",
    className: "bg-bg-secondary text-text-secondary",
  },
  suspended: { label: "ถูกระงับ", className: "bg-red-100 text-red-800" },
};

export function EmployeesPageContent() {
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
    <div className="max-w-[1152px] space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
          พนักงาน
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          {enrolled} คน ลงทะเบียน EWA · {notEligible} คนไม่มีสิทธิ์ในขณะนี้
        </p>
      </header>

      <section className="rounded-xl border border-border bg-bg-canvas p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อ หรือรหัสพนักงาน..."
              className="h-9 w-full rounded-md border border-border bg-bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <FilterSelect
            value={department}
            onChange={setDepartment}
            options={[
              ["all", "ทุกแผนก"],
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
              ["all", "ทุกประเภท"],
              ["monthly", "รายเดือน"],
              ["weekly", "รายสัปดาห์"],
            ]}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            options={[
              ["all", "ทุกสถานะ"],
              ["eligible", "มีสิทธิ์"],
              ["limit_reached", "ใช้ครบแล้ว"],
              ["suspended", "ถูกระงับ"],
            ]}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-canvas shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="h-10 bg-bg-secondary text-left text-[11px] font-semibold text-text-muted">
                <th className="px-4">ชื่อ-รหัสพนักงาน</th>
                <th className="px-4">แผนก</th>
                <th className="px-4">ประเภทจ่าย</th>
                <th className="px-4 text-right">เบิกได้สูงสุด</th>
                <th className="px-4 text-right">เบิกไปแล้ว</th>
                <th className="px-4">ครั้งที่เหลือ</th>
                <th className="px-4">สถานะ EWA</th>
                <th className="px-4 text-right">การดำเนินการ</th>
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
                          ยื่นคำขอแทน
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="h-8 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-muted opacity-50"
                        >
                          ยื่นคำขอแทน
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
          <EmptyState message="ไม่พบพนักงานที่ตรงกับเงื่อนไข" className="m-4" />
        )}
        <div className="border-t border-border px-4 py-3 text-caption text-text-muted">
          แสดง {Math.min(rows.length, 20)} จาก {rows.length} รายการ
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

function EWAStatusBadge({ status }: { status: keyof typeof ewaStatusMap }) {
  const item = ewaStatusMap[status];
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-badge font-medium",
        item.className,
      )}
    >
      {item.label}
    </span>
  );
}
