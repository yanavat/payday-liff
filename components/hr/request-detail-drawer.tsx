"use client";

import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Employee, EWARequest } from "@/types";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import dayjs, { formatBE } from "@/lib/dayjs";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface RequestDetailDrawerProps {
  request: EWARequest | null;
  employee?: Employee;
  history: EWARequest[];
  open: boolean;
  confirmAction: "approve" | "reject" | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancelConfirm: () => void;
  onConfirmApprove: () => void;
  onConfirmReject: (reason?: string) => void;
}

export function RequestDetailDrawer({
  request,
  employee,
  history,
  open,
  confirmAction,
  onClose,
  onApprove,
  onReject,
  onCancelConfirm,
  onConfirmApprove,
  onConfirmReject,
}: RequestDetailDrawerProps) {
  const t = useTranslations();
  if (!request || !employee) {
    return null;
  }

  const earnedWage =
    employee.payCycle === "monthly"
      ? Math.round((employee.baseSalary / 31) * 14)
      : Math.round((employee.baseSalary / 5) * 3);
  const previousAdvance = history
    .filter((item) => item.id !== request.id && item.status !== "rejected")
    .reduce((sum, item) => sum + item.amount, 0);
  const maxAllowed = Math.max(
    Math.round(earnedWage * 0.5) - previousAdvance,
    0,
  );
  const remainingAfterRequest = Math.max(
    earnedWage - previousAdvance - request.amount,
    0,
  );
  const progressValue = employee.payCycle === "monthly" ? 14 : 3;
  const progressMax = employee.payCycle === "monthly" ? 31 : 5;
  const isFinal =
    request.status === "approved" ||
    request.status === "rejected" ||
    request.status === "disbursed";

  return (
    <>
      <SlideDrawer
        open={open}
        onClose={onClose}
        title={t("requestDetail.title")}
        footer={
          isFinal ? (
            <div className="rounded-lg bg-bg-secondary p-4">
              <StatusBadge status={request.status} />
              <p className="mt-2 text-caption text-text-muted">
                {request.approvedBy
                  ? `${request.approvedBy}`
                  : t("requestDetail.approveSuccess")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onReject}
                  className="h-11 rounded-md border border-red-300 bg-bg-canvas text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  {t("common.reject")}
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  className="h-11 rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {t("common.approve")}
                </button>
              </div>
              <button
                type="button"
                className="h-9 w-full rounded-md text-sm font-medium text-text-secondary transition hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {t("common.retry")}
              </button>
            </div>
          )
        }
      >
        <div className="space-y-5">
          <div>
            <p className="text-caption text-text-muted">
              {request.referenceNumber}
            </p>
            {request.isOnBehalf && (
              <div className="mt-3 flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <span>HR: {request.onBehalfBy ?? "-"}</span>
              </div>
            )}
          </div>

          <section className="flex items-start gap-3 rounded-lg border border-border bg-bg-canvas p-4">
            <Avatar initials={employee.nameTh.slice(0, 2)} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-text-primary">
                {employee.nameTh}
              </h3>
              <p className="text-caption text-text-muted">{employee.id}</p>
              <p className="mt-1 text-caption text-text-muted">
                {employee.department} · {employee.position}
              </p>
            </div>
            <PayCycleBadge type={employee.payCycle} />
          </section>

          <section className="rounded-lg border border-border bg-bg-canvas p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-section-title text-text-primary">
                  {employee.payCycle === "monthly"
                    ? t("common.payCycle.monthly")
                    : t("common.payCycle.weekly")}
                </h3>
                <p className="text-caption text-text-muted">
                  {progressValue} / {progressMax} days
                </p>
              </div>
              <span className="text-caption text-text-muted">
                {employee.payCycle === "monthly" ? "31 May" : "Friday"}
              </span>
            </div>
            <ProgressBar value={progressValue} max={progressMax} />
          </section>

          <section className="rounded-lg border border-border bg-bg-secondary p-4">
            <SummaryRow
              label={t("requestDetail.earnedWage")}
              value={formatTHB(earnedWage)}
            />
            <SummaryRow
              label={t("requestDetail.previousAdvance")}
              value={formatTHB(previousAdvance)}
            />
            <SummaryRow
              label={t("requestDetail.maxAllowed")}
              value={formatTHB(maxAllowed)}
            />
            <div className="my-3 border-t border-border" />
            <SummaryRow
              label={t("requestDetail.requestedAmount")}
              value={formatTHB(request.amount)}
              strong
            />
            <div className="my-3 border-t border-border" />
            <SummaryRow
              label={t("requestDetail.remainingBalance")}
              value={formatTHB(remainingAfterRequest)}
            />
          </section>

          <section className="rounded-lg border border-border bg-bg-canvas p-4">
            <h3 className="mb-3 text-section-title text-text-primary">
              {t("requestDetail.title")}
            </h3>
            <InfoRow
              label={t("requests.requestDate")}
              value={`${formatBE(request.requestedAt, "DD/MM/BBBB")} · ${dayjs(request.requestedAt).format("HH:mm")}`}
            />
            <InfoRow
              label={t("requests.reason")}
              value={t(
                `requestWizard.reasons.${request.reason}` as keyof typeof t,
              )}
            />
            <InfoRow
              label={t("profile.bankAccount")}
              value={employee.bankAccountMasked}
            />
            {(request.employeeNote || request.hrNote) && (
              <div className="mt-3 rounded-md bg-bg-secondary p-3 text-sm leading-6 text-text-secondary">
                {request.employeeNote ?? request.hrNote}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-bg-canvas p-4">
            <h3 className="mb-3 text-section-title text-text-primary">
              {t("requestDetail.requestHistory")}
            </h3>
            <div className="max-h-[200px] space-y-3 overflow-y-auto">
              {history.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <TimelineIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-text-primary">
                        {formatBE(item.requestedAt, "D MMM BBBB")}
                      </span>
                      <span className="font-number text-sm font-semibold">
                        {formatTHB(item.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      {item.approvedBy && (
                        <span className="text-caption text-text-muted">
                          {item.approvedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <label className="block">
            <span className="text-label text-text-muted">
              {t("requestDetail.hrNote")}
            </span>
            <textarea
              rows={3}
              placeholder={t("requestDetail.hrNotePlaceholder")}
              className="mt-2 w-full resize-y rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </SlideDrawer>

      <ConfirmModal
        open={confirmAction === "approve"}
        onClose={onCancelConfirm}
        onConfirm={onConfirmApprove}
        title={t("requestDetail.confirmApprove")}
        message={`${formatTHB(request.amount)} · ${employee.nameTh}`}
        confirmLabel={t("common.approve")}
      />
      <ConfirmModal
        open={confirmAction === "reject"}
        onClose={onCancelConfirm}
        onConfirm={onConfirmReject}
        title={t("requestDetail.confirmReject")}
        message={t("requestDetail.hrNotePlaceholder")}
        confirmLabel={t("common.reject")}
        variant="danger"
        hasReasonInput
      />
    </>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={cn(
          "font-number text-sm font-semibold text-text-primary",
          strong && "text-base font-bold text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 py-1 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

function TimelineIcon({ status }: { status: EWARequest["status"] }) {
  const Icon =
    status === "rejected"
      ? XCircle
      : status === "pending"
        ? Clock
        : CheckCircle2;
  return (
    <span
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        status === "rejected" && "bg-red-50 text-red-600",
        status === "pending" && "bg-amber-50 text-amber-600",
        (status === "approved" || status === "disbursed") &&
          "bg-primary-bg text-primary-dark",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}
