"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Eye, Search } from "lucide-react";
import type { EWARequest, PayCycle } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { departments, employees, requests as seedRequests } from "@/lib/mock";
import dayjs from "@/lib/dayjs";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { RequestDetailDrawer } from "./request-detail-drawer";

type StatusFilter = "all" | EWARequest["status"];
type PayCycleFilter = "all" | PayCycle;

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รออนุมัติ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ปฏิเสธ" },
  { value: "disbursed", label: "โอนแล้ว" },
];

const payCycleTabs: Array<{ value: PayCycleFilter; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "monthly", label: "รายเดือน" },
  { value: "weekly", label: "รายสัปดาห์" },
];

const earnedRatioClass = (ratio: number) => {
  if (ratio >= 70) return "bg-red-50 text-red-700";
  if (ratio >= 50) return "bg-amber-50 text-amber-700";
  return "bg-primary-bg text-primary-dark";
};

export function RequestListPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<EWARequest[]>(seedRequests);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payCycle, setPayCycle] = useState<PayCycleFilter>("all");
  const [department, setDepartment] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const rows = useMemo(() => {
    return items
      .map((request) => {
        const employee = employees.find(
          (item) => item.id === request.employeeId,
        );
        return employee ? { request, employee } : null;
      })
      .filter(
        (
          row,
        ): row is {
          request: EWARequest;
          employee: (typeof employees)[number];
        } => row !== null,
      )
      .filter((row) => {
        const searchable =
          `${row.employee.name} ${row.employee.nameTh} ${row.employee.id} ${row.employee.department}`.toLowerCase();
        const matchesQuery = searchable.includes(query.trim().toLowerCase());
        const matchesStatus = status === "all" || row.request.status === status;
        const matchesCycle =
          payCycle === "all" || row.request.payCycle === payCycle;
        const matchesDepartment =
          department === "all" || row.employee.department === department;
        return (
          matchesQuery && matchesStatus && matchesCycle && matchesDepartment
        );
      })
      .sort(
        (a, b) =>
          dayjs(b.request.requestedAt).valueOf() -
          dayjs(a.request.requestedAt).valueOf(),
      );
  }, [department, items, payCycle, query, status]);

  const activeRow =
    rows.find((row) => row.request.id === activeRequestId) ??
    items
      .map((request) => ({
        request,
        employee: employees.find((item) => item.id === request.employeeId),
      }))
      .find((row) => row.request.id === activeRequestId && row.employee);
  const selectedCount = selectedIds.length;
  const visibleRows = rows.slice(0, 20);

  const counts = useMemo(() => {
    return statusTabs.reduce<Record<StatusFilter, number>>(
      (acc, tab) => {
        acc[tab.value] =
          tab.value === "all"
            ? items.length
            : items.filter((item) => item.status === tab.value).length;
        return acc;
      },
      { all: 0, pending: 0, approved: 0, rejected: 0, disbursed: 0 },
    );
  }, [items]);

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

  function updateStatus(
    ids: string[],
    nextStatus: EWARequest["status"],
    note?: string,
  ) {
    setItems((current) =>
      current.map((request) =>
        ids.includes(request.id)
          ? {
              ...request,
              status: nextStatus,
              approvedBy:
                nextStatus === "approved"
                  ? "สิริวรรณ บัวคำ"
                  : request.approvedBy,
              approvedAt:
                nextStatus === "approved"
                  ? new Date().toISOString()
                  : request.approvedAt,
              rejectedAt:
                nextStatus === "rejected"
                  ? new Date().toISOString()
                  : request.rejectedAt,
              hrNote: note ?? request.hrNote,
            }
          : request,
      ),
    );
    setSelectedIds([]);
    setConfirmAction(null);
    toast({
      variant: nextStatus === "approved" ? "success" : "warning",
      message:
        nextStatus === "approved"
          ? "อนุมัติคำขอเรียบร้อยแล้ว"
          : "ปฏิเสธคำขอเรียบร้อยแล้ว",
    });
  }

  return (
    <div className="max-w-[1152px] space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
            คำร้องขอ EWA
          </h1>
          <p className="mt-1 text-[13px] leading-[20.8px] text-text-secondary">
            จัดการและตรวจสอบคำร้องขอเบิกเงินเดือนล่วงหน้าของพนักงาน
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-[33px] items-center gap-2 rounded-md bg-[#006c4f] px-4 text-xs font-medium text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Download className="h-3 w-3" aria-hidden />
          ส่งออกรายงาน
        </button>
      </header>

      <section className="rounded-xl border border-border bg-white p-[17px] shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <FilterRow label="สถานะ:">
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
            <FilterRow label="รอบบิล:">
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

          <div className="flex items-center gap-3">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อ รหัสพนักงาน..."
                className="h-[34px] w-60 rounded-md border border-border bg-bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-[34px] min-w-[152px] rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">ทุกแผนก</option>
              {departments.map((item) => (
                <option key={item.id} value={item.nameTh}>
                  {item.nameTh}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-[34px] min-w-[152px] items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 text-sm text-text-primary"
            >
              <CalendarDays className="h-4 w-4 text-text-muted" aria-hidden />
              30 วันที่ผ่านมา
            </button>
          </div>
        </div>
      </section>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>เลือกแล้ว {selectedCount} รายการ</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateStatus(selectedIds, "approved")}
              className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              อนุมัติที่เลือก
            </button>
            <button
              type="button"
              onClick={() =>
                updateStatus(selectedIds, "rejected", "ปฏิเสธแบบกลุ่ม")
              }
              className="h-8 rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              ปฏิเสธที่เลือก
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-8 rounded-md px-3 text-sm font-medium transition hover:bg-bg-secondary"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="h-[42px] border-b border-border bg-bg-secondary text-left text-xs font-semibold text-text-muted">
                <th className="w-10 px-4">
                  <input
                    type="checkbox"
                    aria-label="เลือกทั้งหมด"
                    checked={
                      visibleRows.length > 0 &&
                      selectedIds.length === visibleRows.length
                    }
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <HeaderCell>พนักงาน</HeaderCell>
                <HeaderCell>แผนก</HeaderCell>
                <HeaderCell>รอบบิล</HeaderCell>
                <HeaderCell align="right">จำนวนที่ขอ (THB)</HeaderCell>
                <HeaderCell align="right">รายได้สะสม</HeaderCell>
                <HeaderCell>วันที่</HeaderCell>
                <HeaderCell>สถานะ</HeaderCell>
                <HeaderCell align="right">การจัดการ</HeaderCell>
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
                    <td
                      className="px-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`เลือก ${employee.nameTh}`}
                        checked={selectedIds.includes(request.id)}
                        onChange={(event) =>
                          toggleRow(request.id, event.target.checked)
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
                    <td className="px-4 text-[13px] text-[#3d4a43]">
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
                    <td className="px-4 text-[13px] text-[#3d4a43]">
                      {dayjs(request.requestedAt).format("DD MMM YYYY")}
                    </td>
                    <td className="px-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveRequestId(request.id);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary-dark transition hover:bg-primary-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        ดูรายละเอียด
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
            message={
              query ? "ไม่พบคำขอที่ตรงกับเงื่อนไข" : "ไม่มีคำขอในสถานะนี้"
            }
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
                ล้างตัวกรอง
              </button>
            }
            className="m-4"
          />
        )}

        <div className="flex items-center justify-between border-t border-border bg-white px-4 py-3">
          <p className="text-[11px] text-text-muted">
            แสดง {visibleRows.length ? 1 : 0} ถึง {visibleRows.length} จาก{" "}
            {rows.length} รายการ
          </p>
          <div className="flex items-center gap-1">
            <PageButton disabled label="ก่อนหน้า">
              ‹
            </PageButton>
            <PageButton active label="หน้า 1">
              1
            </PageButton>
            <PageButton label="หน้า 2">2</PageButton>
            <PageButton label="หน้า 3">3</PageButton>
            <span className="px-2 text-text-muted">...</span>
            <PageButton label="ถัดไป">›</PageButton>
          </div>
        </div>
      </section>

      <RequestDetailDrawer
        request={activeRow?.request ?? null}
        employee={activeRow?.employee}
        history={items.filter(
          (item) => item.employeeId === activeRow?.request.employeeId,
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
        onConfirmApprove={() =>
          activeRequestId && updateStatus([activeRequestId], "approved")
        }
        onConfirmReject={(reason) =>
          activeRequestId && updateStatus([activeRequestId], "rejected", reason)
        }
      />
    </div>
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
          : "border-border bg-white text-text-secondary hover:bg-bg-secondary",
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

function PageButton({
  children,
  label,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition",
        active
          ? "bg-primary text-white"
          : "border border-border bg-white text-text-primary hover:bg-bg-secondary",
        disabled && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}
