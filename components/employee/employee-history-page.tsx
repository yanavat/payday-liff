"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FileText, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabBar, type TabItem } from "@/components/ui/tab-bar";
import { Link } from "@/i18n/navigation";
import { currentEmployee } from "@/lib/mock/currentUser";
import { useEWARequests } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { formatTHB } from "@/lib/utils/format";
import { buildPaySlipPdf, downloadPdf } from "@/lib/pdf/pdf-export";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EmployeeHistoryPage() {
  const t = useTranslations();
  const tabs: TabItem[] = [
    { value: "all", label: t("status.all") },
    { value: "pending", label: t("status.pending") },
    { value: "approved", label: t("status.approved") },
    { value: "disbursed", label: t("status.disbursed") },
    { value: "rejected", label: t("status.rejected") },
  ];
  const [tab, setTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch requests from API
  const {
    data: requestsData,
    loading,
    error,
  } = useEWARequests({
    employeeId: currentEmployee.id,
    limit: 100,
  });

  const requests = useMemo(
    () =>
      (requestsData?.data ?? []).sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [requestsData],
  );

  const filtered =
    tab === "all"
      ? requests
      : requests.filter((request) => request.status === tab);

  // Calculate summary stats
  const thisMonthRequests = requests.filter((r) => {
    const date = new Date(r.requestedAt);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthTotal = thisMonthRequests.reduce(
    (sum, r) => sum + r.requestedAmount,
    0,
  );

  const lastMonthRequests = requests.filter((r) => {
    const date = new Date(r.requestedAt);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return (
      date.getMonth() === lastMonth.getMonth() &&
      date.getFullYear() === lastMonth.getFullYear()
    );
  });
  const lastMonthTotal = lastMonthRequests.reduce(
    (sum, r) => sum + r.requestedAmount,
    0,
  );

  const totalRequests = requests.length;
  const totalAmount = requests.reduce((sum, r) => sum + r.requestedAmount, 0);

  function exportPaySlip(request: (typeof requests)[number]) {
    downloadPdf(
      buildPaySlipPdf({ employee: currentEmployee, request }),
      `pay-slip-${request.referenceNumber ?? request.id}.pdf`,
    );
  }

  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">
          {t("history.title")}
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">{t("history.total")}</p>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-[16px] font-semibold text-amber-800">
            {t("common.error")}
          </p>
          <p className="text-[16px] text-amber-600">
            {t("common.errorLoadingData")}
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
            <div className="flex divide-x divide-border">
              <SummaryCell
                label={t("history.thisMonth")}
                value={formatTHB(thisMonthTotal)}
                sub={`${thisMonthRequests.length} ครั้ง`}
              />
              <SummaryCell
                label={t("history.lastMonth")}
                value={formatTHB(lastMonthTotal)}
                sub={`${lastMonthRequests.length} ครั้ง`}
              />
              <SummaryCell
                label={t("history.total")}
                value={formatTHB(totalAmount)}
                sub={`${totalRequests} ครั้ง`}
              />
            </div>
          </div>

          <div className="-mx-4 mb-4 overflow-x-auto px-4">
            <TabBar
              tabs={tabs}
              value={tab}
              onChange={setTab}
              className="w-max"
              variant="pill"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              message={t("common.noData")}
              description={t("home.requestCta")}
              action={
                <Link
                  href="/employee/request"
                  className="rounded-md bg-primary px-4 py-2 text-[16px] font-semibold text-white"
                >
                  {t("requestWizard.step1")}
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 10).map((request) => {
                const dateParts = new Intl.DateTimeFormat("th-TH", {
                  day: "2-digit",
                  month: "short",
                })
                  .format(new Date(request.requestedAt))
                  .split(" ");
                const expanded = expandedId === request.id;

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden rounded-lg border border-border bg-white shadow-card"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : request.id)
                      }
                      className="flex w-full items-center gap-3 p-3 text-left h-20"
                    >
                      <div className="w-11 text-center">
                        <div className="font-sans text-[20px] font-bold leading-none text-primary">
                          {dateParts[0]}
                        </div>
                        <div className="mt-1 text-[12px] text-text-muted">
                          {dateParts[1]}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-text-primary">
                          {t("requests.title")}
                        </p>
                        <p className="truncate font-mono text-[12px] text-text-muted">
                          {request.referenceNumber ?? request.id}
                        </p>
                        <p className="truncate text-[12px] font-bold text-text-muted">
                          {request.reason
                            ? t(`requestWizard.reasons.${request.reason}` as keyof typeof t)
                            : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-[16px] font-bold text-text-primary">
                          {formatTHB(request.requestedAmount)}
                        </p>
                        <StatusBadge status={request.status} size="sm" />
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-text-muted transition",
                          expanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {expanded && (
                      <div className="border-t border-border-light bg-bg-secondary p-4 text-[16px]">
                        <DetailRow
                          label={t("history.requestedDate")}
                          value={formatDate(request.requestedAt)}
                        />
                        <DetailRow
                          label={t("history.approvedDate")}
                          value={formatDate(request.approvedAt ?? undefined)}
                        />
                        <DetailRow
                          label={t("history.approvedBy")}
                          value={request.approvedBy ?? "-"}
                        />
                        <DetailRow
                          label={t("history.transferDate")}
                          value={formatDate(request.disbursedAt ?? undefined)}
                        />
                        <DetailRow
                          label={t("profile.bankAccount")}
                          value={currentEmployee.bankAccountMasked}
                        />
                        <DetailRow
                          label={t("history.transferFee")}
                          value={formatTHB(request.transferFee)}
                        />
                        <DetailRow
                          label={t("history.netTransferAmount")}
                          value={formatTHB(request.netAmount)}
                        />
                        <DetailRow
                          label={t("requestDetail.hrNote")}
                          value={request.hrNote ?? request.employeeNote ?? "-"}
                        />
                        <button
                          type="button"
                          onClick={() => exportPaySlip(request)}
                          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-primary bg-white text-[16px] font-semibold text-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <FileText className="h-5 w-5" aria-hidden />
                          {t("history.exportPaySlip")}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              <button
                type="button"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-md border border-border bg-white text-[16px] font-semibold text-text-secondary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {t("common.loading")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center py-3 px-2 text-center">
      <p className="text-[12px] text-text-muted-foreground leading-tight">
        {label}
      </p>
      <p className="mt-1 font-sans text-[15px] font-bold text-primary-text leading-tight">
        {value}
      </p>
      <p className="text-[12px] text-text-muted-foreground">{sub}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between gap-3 last:mb-0">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}
