"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { useEmployeeEffectivePolicy, useEmployeeActions } from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { EmployeeDto } from "@/lib/api/types";
import { useHRRole } from "./hr-auth-gate";
import { useTranslations } from "next-intl";

interface EmployeeDetailDrawerProps {
  employee: EmployeeDto | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EmployeeDetailDrawer({
  employee,
  open,
  onClose,
  onUpdated,
}: EmployeeDetailDrawerProps) {
  const { role } = useHRRole();
  const tc = useTranslations("common");
  const { toast } = useToast();
  const {
    data: effectivePolicy,
    loading: policyLoading,
    refetch: refetchPolicy,
  } = useEmployeeEffectivePolicy(employee?.id ?? "");
  const { setOverrides, loading: saving, error: saveError } = useEmployeeActions();

  const [ewaEnabled, setEwaEnabled] = useState<boolean | null>(null);
  const [maxPercent, setMaxPercent] = useState("");
  const [maxRequests, setMaxRequests] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (employee) {
      setEwaEnabled(employee.ewaEnabled ?? null);
      setMaxPercent(employee.ewaMaxPercent != null ? String(employee.ewaMaxPercent) : "");
      setMaxRequests(employee.ewaMaxRequests != null ? String(employee.ewaMaxRequests) : "");
      setMinAmount(employee.ewaMinAmount != null ? String(employee.ewaMinAmount) : "");
      setMaxAmount(employee.ewaMaxAmount != null ? String(employee.ewaMaxAmount) : "");
    }
  }, [employee]);

  if (!employee) return null;

  const isManager = role === "hr_manager";
  const isOverridden = effectivePolicy?.isOverridden ?? false;

  async function handleSave() {
    const result = await setOverrides(employee!.id, {
      ewaEnabled: ewaEnabled ?? null,
      ewaMaxPercent: maxPercent ? Number(maxPercent) : null,
      ewaMaxRequests: maxRequests ? Number(maxRequests) : null,
      ewaMinAmount: minAmount ? Number(minAmount) : null,
      ewaMaxAmount: maxAmount ? Number(maxAmount) : null,
    });
    if (result) {
      void refetchPolicy();
      toast({ variant: "success", message: "EWA overrides saved" });
      onUpdated();
    } else if (saveError) {
      toast({ variant: "error", message: getApiErrorMessage(saveError, tc) });
    }
  }

  async function handleReset() {
    const result = await setOverrides(employee!.id, {
      ewaEnabled: null,
      ewaMaxPercent: null,
      ewaMaxRequests: null,
      ewaMinAmount: null,
      ewaMaxAmount: null,
    });
    setResetConfirmOpen(false);
    if (result) {
      setEwaEnabled(null);
      setMaxPercent("");
      setMaxRequests("");
      setMinAmount("");
      setMaxAmount("");
      void refetchPolicy();
      toast({ variant: "success", message: "Reset to company default" });
      onUpdated();
    } else if (saveError) {
      toast({ variant: "error", message: getApiErrorMessage(saveError, tc) });
    }
  }

  return (
    <>
      <SlideDrawer
        open={open}
        onClose={onClose}
        title="Employee Detail"
        footer={
          isManager ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save overrides
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                disabled={saving}
                className="h-9 w-full rounded-md border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary disabled:opacity-50"
              >
                Reset to company default
              </button>
            </div>
          ) : null
        }
      >
        <div className="space-y-5">
          <section className="flex items-start gap-3 rounded-lg border border-border bg-bg-canvas p-4">
            <Avatar
              initials={employee.avatarInitials ?? employee.name.slice(0, 2)}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-text-primary">
                {employee.name}
              </h3>
              <p className="text-caption text-text-muted">{employee.id}</p>
              <p className="mt-1 text-caption text-text-muted">
                {employee.departmentName ?? employee.department}
                {employee.position ? ` · ${employee.position}` : ""}
              </p>
              {employee.invitationCode && (
                <p className="mt-2 text-caption text-text-muted">
                  Invite code:{" "}
                  <span className="font-mono font-semibold text-text-primary">
                    {employee.invitationCode}
                  </span>
                </p>
              )}
            </div>
          </section>

          {isManager && (
            <section className="rounded-lg border border-border bg-bg-canvas p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-section-title text-text-primary">
                  EWA Overrides
                </h2>
                {policyLoading ? (
                  <span className="h-5 w-36 animate-pulse rounded-full bg-bg-secondary" />
                ) : (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-badge font-medium",
                      isOverridden
                        ? "bg-green-100 text-green-800"
                        : "bg-bg-secondary text-text-secondary",
                    )}
                  >
                    {isOverridden ? "Override active" : "Using company default"}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      EWA Enabled
                    </p>
                    <p className="text-caption text-text-muted">
                      Override EWA eligibility for this employee
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ewaEnabled === true}
                    onClick={() =>
                      setEwaEnabled(ewaEnabled === true ? false : true)
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                      ewaEnabled === true ? "bg-primary" : "bg-gray-300",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        ewaEnabled === true ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {ewaEnabled === true && (
                  <div className="grid grid-cols-2 gap-3">
                    <OverrideNumberField
                      label="Max Percent"
                      value={maxPercent}
                      onChange={setMaxPercent}
                      suffix="%"
                      placeholder="e.g. 50"
                    />
                    <OverrideNumberField
                      label="Max Requests"
                      value={maxRequests}
                      onChange={setMaxRequests}
                      suffix="/period"
                      placeholder="e.g. 3"
                    />
                    <OverrideNumberField
                      label="Min Amount"
                      value={minAmount}
                      onChange={setMinAmount}
                      prefix="THB"
                      placeholder="e.g. 500"
                    />
                    <OverrideNumberField
                      label="Max Amount"
                      value={maxAmount}
                      onChange={setMaxAmount}
                      prefix="THB"
                      placeholder="e.g. 10000"
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </SlideDrawer>

      <ConfirmModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset to company default?"
        message="All EWA overrides for this employee will be cleared. Company-level settings will apply."
        confirmLabel="Reset"
        variant="danger"
        isLoading={saving}
      />
    </>
  );
}

function OverrideNumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <div className="mt-1 flex h-10 items-center rounded-md border border-border bg-bg-secondary px-3">
        {prefix && (
          <span className="shrink-0 text-sm text-text-muted">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
        {suffix && (
          <span className="shrink-0 text-sm text-text-muted">{suffix}</span>
        )}
      </div>
    </label>
  );
}
