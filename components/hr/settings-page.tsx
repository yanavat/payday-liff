"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TabBar } from "@/components/ui/tab-bar";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { Toggle } from "./settings-toggle";
import { useToast } from "@/components/ui/toast";
import {
  useDepartments,
  useHRUserActions,
  useHRUsers,
  useSettings,
  useSettingsActions,
  useSettingsApiKey,
} from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { HRUserDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useHRRole } from "./hr-auth-gate";

type BankExportFormat = "generic" | "scb_anywhere";

type HrUserFormState = {
  id: string | null;
  name: string;
  email: string;
  role: HRUserDto["role"];
  department: string;
};

const emptyHrUserForm: HrUserFormState = {
  id: null,
  name: "",
  email: "",
  role: "viewer",
  department: "",
};

const mainTabs = [
  { value: "general", labelKey: "general" },
  { value: "policy", labelKey: "ewaPolicy" },
  { value: "notifications", labelKey: "notifications" },
  { value: "users", labelKey: "userManagement" },
];

const policyTabs = [
  { value: "monthly", labelKey: "monthly" },
  { value: "weekly", labelKey: "weekly" },
];

function SettingsContent() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("policy");
  const [policyTab, setPolicyTab] = useState<"monthly" | "weekly">("monthly");
  const [maxPercent, setMaxPercent] = useState(50);
  const [autoApproval, setAutoApproval] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [bankExportFormat, setBankExportFormat] =
    useState<BankExportFormat>("generic");
  const [dirty, setDirty] = useState(false);
  const [hrUserForm, setHrUserForm] =
    useState<HrUserFormState>(emptyHrUserForm);
  const [hrUserFormOpen, setHrUserFormOpen] = useState(false);

  const { data: settings, loading: settingsLoading, error: settingsError } = useSettings();
  const { updateSettings, updatePolicy, loading: saving, error: saveError } = useSettingsActions();
  const {
    data: hrUsersData,
    loading: hrUsersLoading,
    error: hrUsersError,
    refetch: refetchHrUsers,
  } = useHRUsers({ limit: 200 });
  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useDepartments({ limit: 200 });
  const {
    create: createHrUser,
    update: updateHrUser,
    loading: savingHrUser,
    error: hrUserActionError,
  } = useHRUserActions();

  // Sync state when settings load or policyTab changes
  useEffect(() => {
    const policy = policyTab === "monthly" ? settings?.ewaMonthlyPolicy : settings?.ewaWeeklyPolicy;
    if (policy) {
      setMaxPercent(policy.maxPercent ?? 50);
      setAutoApproval(policy.autoApprovalEnabled ?? false);
      setBlackoutDates(policy.blackoutDates ?? []);
      setDirty(false);
    }
  }, [settings, policyTab]);

  useEffect(() => {
    setBankExportFormat(settings?.bankExportFormat ?? "generic");
  }, [settings?.bankExportFormat]);

  function markDirty() {
    setDirty(true);
  }

  async function handleSave() {
    const result =
      activeTab === "policy"
        ? await updatePolicy(policyTab, {
            maxPercent,
            autoApprovalEnabled: autoApproval,
            blackoutDates,
          })
        : await updateSettings({
            bankExportFormat,
          });
    if (result) {
      setDirty(false);
      toast({ variant: "success", message: t("saveSuccess") });
    } else if (saveError) {
      toast({ variant: "error", message: getApiErrorMessage(saveError, tc) });
    }
  }

  const mainTabsTranslated = mainTabs.map((tab) => ({
    value: tab.value,
    label: t(tab.labelKey as keyof typeof t),
  }));

  const policyTabsTranslated = policyTabs.map((tab) => ({
    value: tab.value,
    label: t(tab.labelKey as keyof typeof t),
  }));

  const activePolicy = policyTab === "monthly" ? settings?.ewaMonthlyPolicy : settings?.ewaWeeklyPolicy;
  const hrUsers = useMemo(() => hrUsersData?.data ?? [], [hrUsersData]);
  const departments = useMemo(
    () => departmentsData?.data ?? [],
    [departmentsData],
  );
  const departmentsById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );
  const showHrUserForm = hrUserFormOpen;

  function getDepartmentName(id: string | null | undefined, fallback?: string | null) {
    if (!id) return "All departments";
    const department = departmentsById.get(id);
    return fallback ?? department?.nameTh ?? department?.name ?? id;
  }

  function startEditHrUser(user: HRUserDto) {
    setHrUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? "",
    });
    setHrUserFormOpen(true);
  }

  async function handleSaveHrUser() {
    const payload = {
      name: hrUserForm.name.trim(),
      email: hrUserForm.email.trim(),
      role: hrUserForm.role,
      department: hrUserForm.department || null,
    };

    const result = hrUserForm.id
      ? await updateHrUser(hrUserForm.id, payload)
      : await createHrUser(payload);

    if (result) {
      setHrUserForm(emptyHrUserForm);
      setHrUserFormOpen(false);
      await refetchHrUsers();
      toast({ variant: "success", message: t("saveSuccess") });
    } else if (hrUserActionError) {
      toast({ variant: "error", message: getApiErrorMessage(hrUserActionError, tc) });
    }
  }

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-bg-secondary" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-bg-secondary" />
        ))}
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
        {getApiErrorMessage(settingsError, tc)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
          {t("title")}
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">Settings</p>
      </header>

      {dirty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Unsaved changes
        </div>
      )}

      <TabBar
        tabs={mainTabsTranslated}
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {activeTab === "policy" && (
        <div className="space-y-4">
          <TabBar
            tabs={policyTabsTranslated}
            value={policyTab}
            onChange={(v) => setPolicyTab(v as "monthly" | "weekly")}
            className="rounded-md"
          />
          <SettingsPanel title={t("ewaPolicy")}>
            <label className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{t("maxPercent")}</span>
                <span className="font-number text-sm font-semibold text-primary">{maxPercent}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={maxPercent}
                onChange={(e) => { setMaxPercent(Number(e.target.value)); markDirty(); }}
                className="accent-primary"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumberField label={t("maxRequests")} value={String(activePolicy?.maxRequestsPerPeriod ?? 2)} suffix="period" />
              <NumberField label={t("minAmount")} value={String(activePolicy?.minAmount ?? 500)} prefix="THB" />
              <NumberField label={t("autoApprovalThreshold")} value={String(activePolicy?.autoApprovalThreshold ?? 3000)} prefix="THB" />
            </div>
          </SettingsPanel>

          <SettingsPanel title={tc("approve")}>
            <Toggle
              checked={autoApproval}
              onChange={(checked) => { setAutoApproval(checked); markDirty(); }}
              label={t("autoApproval")}
              description="Low-risk requests only"
            />
            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">{t("approvalChain")}</p>
              <div className="flex gap-3">
                <RadioPill checked={activePolicy?.approvalChain === "single"} label={t("singleApproval")} />
                <RadioPill checked={activePolicy?.approvalChain === "two_step"} label={t("twoStepApproval")} />
              </div>
            </div>
          </SettingsPanel>

          {policyTab === "weekly" && (
            <SettingsPanel title={t("weekly")}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <NumberField label={t("weeklyPayday")} value={String(activePolicy?.weeklyPayDayOfWeek ?? 5)} suffix="day" />
                <NumberField label={t("ewaCutoffDays")} value={String(activePolicy?.weeklyCutoffDayOfWeek ?? 4)} suffix="days" />
              </div>
            </SettingsPanel>
          )}

          <SettingsPanel title={t("blackoutDates")}>
            <div className="flex flex-wrap gap-2">
              {blackoutDates.map((date, i) => (
                <span key={date + i} className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1 text-sm">
                  {date}
                  <button
                    onClick={() => { setBlackoutDates((c) => c.filter((d) => d !== date)); markDirty(); }}
                    aria-label={`Remove ${date}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => { setBlackoutDates((c) => [...c, new Date().toISOString().slice(0, 10)]); markDirty(); }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add date
              </button>
            </div>
          </SettingsPanel>
        </div>
      )}

      {activeTab === "notifications" && (
        <SettingsPanel title={t("notifications")}>
          {["New request", "Pending > 2 hours", "Request approved", "Request rejected", "Payday"].map((label) => (
            <div key={label} className="flex items-center justify-between border-b border-border-light py-3 last:border-0">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex gap-4">
                <Toggle checked onChange={() => {}} label="Email" />
                <Toggle checked onChange={() => {}} label="LINE" />
              </div>
            </div>
          ))}
        </SettingsPanel>
      )}

      {activeTab === "users" && (
        <SettingsPanel title="HR Users">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setHrUserForm(emptyHrUserForm);
                setHrUserFormOpen(true);
              }}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
            >
              + Add HR User
            </button>
          </div>
          {showHrUserForm && (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-bg-secondary p-4 sm:grid-cols-2">
              <TextField
                label="Name"
                value={hrUserForm.name}
                onChange={(value) =>
                  setHrUserForm((current) => ({ ...current, name: value }))
                }
              />
              <TextField
                label="Email"
                type="email"
                value={hrUserForm.email}
                onChange={(value) =>
                  setHrUserForm((current) => ({ ...current, email: value }))
                }
              />
              <label className="block">
                <span className="text-label text-text-muted">Role</span>
                <select
                  value={hrUserForm.role}
                  onChange={(event) =>
                    setHrUserForm((current) => ({
                      ...current,
                      role: event.target.value as HRUserDto["role"],
                    }))
                  }
                  className="mt-2 h-10 w-full rounded-md border border-border bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="hr_manager">HR Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <label className="block">
                <span className="text-label text-text-muted">Department</span>
                <select
                  value={hrUserForm.department}
                  onChange={(event) =>
                    setHrUserForm((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                  disabled={departmentsLoading}
                  className="mt-2 h-10 w-full rounded-md border border-border bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.nameTh ?? department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSaveHrUser}
                  disabled={
                    savingHrUser ||
                    !hrUserForm.name.trim() ||
                    !hrUserForm.email.trim()
                  }
                  className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {savingHrUser ? tc("loading") : tc("save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHrUserForm(emptyHrUserForm);
                    setHrUserFormOpen(false);
                  }}
                  className="h-9 rounded-md border border-border bg-bg-canvas px-4 text-sm font-medium text-text-primary hover:bg-bg-secondary"
                >
                  {tc("cancel")}
                </button>
              </div>
            </div>
          )}
          {(hrUsersError || departmentsError) && (
            <p className="mb-3 text-sm text-red-600">
              {getApiErrorMessage(hrUsersError ?? departmentsError!, tc)}
            </p>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="h-10 border-b border-border bg-bg-secondary text-left text-xs font-semibold text-text-muted">
                <th className="px-4">Name</th>
                <th className="px-4">Email</th>
                <th className="px-4">Role</th>
                <th className="px-4">Scope</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hrUsersLoading ? (
                <tr className="h-[52px] border-b border-border-light">
                  <td colSpan={5} className="px-4 text-sm text-text-muted">
                    {tc("loading")}
                  </td>
                </tr>
              ) : hrUsers.length === 0 ? (
                <tr className="h-[52px] border-b border-border-light">
                  <td colSpan={5} className="px-4 text-sm text-text-muted">
                    No HR users
                  </td>
                </tr>
              ) : hrUsers.map((user) => (
                <tr key={user.id} className="h-[52px] border-b border-border-light last:border-0">
                  <td className="px-4 text-sm font-medium">{user.name}</td>
                  <td className="px-4 text-sm text-text-muted">{user.email}</td>
                  <td className="px-4 text-sm">{formatRole(user.role)}</td>
                  <td className="px-4">
                    {user.department ? (
                      <span className="inline-flex rounded-full bg-bg-secondary px-2.5 py-1 text-badge font-medium text-text-secondary">
                        {getDepartmentName(user.department, user.departmentName)}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-badge font-medium text-text-muted">
                        All departments
                      </span>
                    )}
                  </td>
                  <td className="px-4 text-right">
                    <button
                      type="button"
                      onClick={() => startEditHrUser(user)}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      Edit role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsPanel>
      )}

      {activeTab === "general" && (
        <>
          <SettingsPanel title={t("general")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField label="Company" value={settings?.companyName ?? ""} />
            </div>
          </SettingsPanel>
          <SettingsPanel title="Bank Export Format">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RadioOption
                checked={bankExportFormat === "generic"}
                label="Generic CSV"
                description="Standard export with the current field layout."
                onChange={() => {
                  setBankExportFormat("generic");
                  markDirty();
                }}
              />
              <RadioOption
                checked={bankExportFormat === "scb_anywhere"}
                label="SCB Anywhere"
                description="CSV format for SCB Anywhere bulk upload."
                onChange={() => {
                  setBankExportFormat("scb_anywhere");
                  markDirty();
                }}
              />
            </div>
          </SettingsPanel>
          <ApiKeySection />
        </>
      )}

      <div className="fixed bottom-5 right-5">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-white shadow-hover hover:bg-primary-dark disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {tc("save")}
        </button>
      </div>
    </div>
  );
}

export function SettingsPageContent() {
  const router = useRouter();
  const tc = useTranslations("common");
  const { role } = useHRRole();

  useEffect(() => {
    if (role !== "hr_manager") {
      router.push("/hr/dashboard");
    }
  }, [role, router]);

  if (role !== "hr_manager") {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm font-medium text-text-secondary">
        {tc("loading")}
      </div>
    );
  }

  return (
    <ApiErrorBoundary>
      <SettingsContent />
    </ApiErrorBoundary>
  );
}

function SettingsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-bg-canvas p-5 shadow-card">
      <h2 className="mb-4 text-section-title text-text-primary">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function NumberField({ label, value, prefix, suffix }: { label: string; value: string; prefix?: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <div className="mt-2 flex h-10 items-center rounded-md border border-border bg-bg-secondary px-3">
        {prefix && <span className="text-text-muted">{prefix}</span>}
        <input defaultValue={value} key={value} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
        {suffix && <span className="text-text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
}) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-border bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({ label, options, value }: { label: string; options: string[]; value: string }) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <select defaultValue={value} className="mt-2 h-10 w-full rounded-md border border-border bg-bg-secondary px-3 text-sm outline-none">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function RadioPill({ checked = false, label }: { checked?: boolean; label: string }) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-sm", checked ? "border-primary bg-primary-subtle text-primary-dark" : "border-border text-text-secondary")}>
      {label}
    </span>
  );
}

function RadioOption({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-md border p-4",
        checked
          ? "border-primary bg-primary-subtle"
          : "border-border bg-bg-canvas hover:bg-bg-secondary",
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-text-secondary">
          {description}
        </span>
      </span>
    </label>
  );
}

function formatRole(role: HRUserDto["role"]) {
  if (role === "hr_manager") return "HR Manager";
  if (role === "accountant") return "Accountant";
  return "Viewer";
}

function ApiKeySection() {
  const { role } = useHRRole();
  const { toast } = useToast();
  const { data, loading, error } = useSettingsApiKey();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (role !== "hr_manager") return null;

  const apiKey = data?.apiKey ?? null;

  const maskedKey = apiKey
    ? `${"•".repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`
    : null;

  async function handleCopy() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast({ variant: "success", message: "Copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "error", message: "Failed to copy" });
    }
  }

  return (
    <SettingsPanel title="API Integration">
      <p className="text-sm text-text-secondary">
        Share this key with your IT team to enable automatic employee sync.
      </p>
      {loading ? (
        <div className="h-10 animate-pulse rounded-md bg-bg-secondary" />
      ) : error ? (
        <p className="text-sm text-text-muted">
          API key endpoint not available yet.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-10 flex-1 items-center rounded-md border border-border bg-bg-secondary px-3 font-mono text-sm text-text-primary">
            {revealed ? (apiKey ?? "—") : (maskedKey ?? "—")}
          </div>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide API key" : "Reveal API key"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-bg-canvas text-text-secondary hover:bg-bg-secondary"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!apiKey}
            aria-label="Copy API key"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-bg-canvas text-text-secondary hover:bg-bg-secondary disabled:opacity-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      )}
    </SettingsPanel>
  );
}
