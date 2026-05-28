"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Link2Off,
  MessageCircle,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Avatar } from "@/components/ui/avatar";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  useAuth,
  useLiffProfile,
} from "@/components/liff-auth-gate";
import { getAuthEmployeeId } from "@/lib/auth/get-auth-employee-id";
import { useEmployee } from "@/lib/api/hooks/use-employees";
import { useSettingsActions } from "@/lib/api/hooks/use-settings";
import { loadLiffClient } from "@/lib/liff-client";

const THAI_BANKS = [
  { code: "KBANK", nameTh: "กสิกรไทย", nameEn: "Kasikorn Bank" },
  { code: "SCB", nameTh: "ไทยพาณิชย์", nameEn: "SCB" },
  { code: "BBL", nameTh: "กรุงเทพ", nameEn: "Bangkok Bank" },
  { code: "KTB", nameTh: "กรุงไทย", nameEn: "Krungthai Bank" },
  { code: "TTB", nameTh: "ทหารไทยธนชาต", nameEn: "TTB Bank" },
  { code: "BAY", nameTh: "กรุงศรีอยุธยา", nameEn: "Bank of Ayudhya" },
  { code: "CIMBT", nameTh: "ซีไอเอ็มบีไทย", nameEn: "CIMB Thai" },
  { code: "GSB", nameTh: "ออมสิน", nameEn: "Government Savings Bank" },
];

function getBankDisplayName(code: string, locale: string) {
  const bank = THAI_BANKS.find((b) => b.code === code);
  if (!bank) return code;
  return locale === "th" ? bank.nameTh : bank.nameEn;
}

function maskAccountNumber(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "xxx-x-xxxxx-x";
  const tail = digits.slice(-4);
  return `xxx-x-xx${tail.slice(0, 3)}-${tail.slice(-1)}`;
}

export function LiffProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const profile = useLiffProfile();
  const { employee: authEmployee, isInLiff, logout } = useAuth();
  const employeeId = getAuthEmployeeId(authEmployee);
  const { data: employee } = useEmployee(employeeId);
  const { updateNotifications } = useSettingsActions();

  const [line, setLine] = useState(true);
  const [showEditBank, setShowEditBank] = useState(false);

  const [bankCode, setBankCode] = useState("");
  const [accountMasked, setAccountMasked] = useState("");
  const [holderName, setHolderName] = useState("");
  const hasLineProfile = isInLiff && Boolean(profile?.userId);
  const displayName = hasLineProfile
    ? profile?.displayName
    : employee?.name ?? authEmployee?.name ?? authEmployee?.nameTh;
  const avatarName =
    displayName ?? employee?.employeeCode ?? authEmployee?.employeeCode ?? "";

  useEffect(() => {
    if (!employee) return;
    setBankCode(employee.bankName ?? "");
    setAccountMasked(employee.bankAccountMasked ?? "");
    setHolderName(employee.name);
  }, [employee]);

  function handleSaveBank(data: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  }) {
    setBankCode(data.bankCode);
    setAccountMasked(maskAccountNumber(data.accountNumber));
    setHolderName(data.holderName);
    setShowEditBank(false);
  }

  function handleUnlink() {
    if (!hasLineProfile) return;
    void logout()
      .catch(() => undefined)
      .finally(() => {
        if (isInLiff) {
          void loadLiffClient().then((liff) => {
            liff.logout();
            liff.closeWindow();
          });
        }
        window.location.reload();
      });
  }

  return (
    <div className="min-h-full bg-bg-page pb-5">
      <main className="space-y-3 px-4 pt-4">
        <section className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
          {hasLineProfile && profile?.pictureUrl ? (
            <Image
              src={profile.pictureUrl}
              alt={profile.displayName}
              width={80}
              height={80}
              unoptimized
              className="mx-auto rounded-full shadow-lg ring-4 ring-white/50"
            />
          ) : (
            <Avatar
              initials={avatarName}
              alt={avatarName}
              size="xl"
              color="teal"
              className="mx-auto shadow-lg ring-4 ring-white/50"
            />
          )}
          <h1 className="mt-3 text-[22px] font-bold leading-tight text-white">
            {displayName ?? ""}
          </h1>
          {hasLineProfile && profile?.email && (
            <p className="mt-0.5 text-[14px] text-white/70">{profile.email}</p>
          )}
          <p className="mt-1 text-[15px] text-white/80">
            {employee?.employeeCode ?? ""} · {employee?.department ?? ""}
          </p>
          <div className="mt-3 flex">
            {employee && (
              <PayCycleBadge
                type={employee.payCycle}
                className="border-white/30 bg-white/20 text-white"
              />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-[16px] font-semibold text-text-primary">
                {t("profile.bankAccount")}
              </h2>
            </div>
            {/* <button
              type="button"
              onClick={() => setShowEditBank(true)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("profile.edit")}
            </button> */}
          </div>
          <p className="text-[16px] font-semibold text-text-primary">
            {getBankDisplayName(bankCode, locale)}
          </p>
          <p className="mt-1 font-mono text-[15px] text-text-secondary">
            {accountMasked}
          </p>
          <p className="mt-1 text-[13px] text-text-muted">{holderName}</p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-[16px] font-semibold text-text-primary">
              {t("profile.ewaLimit")}
            </h2>
          </div>
          <div className="flex items-center justify-between text-[16px]">
            <span className="text-text-secondary">
              {t("profile.maxPercent")}
            </span>
            <span className="font-semibold text-text-primary">
              {t("profile.percentOfSalary", { percent: 100 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[16px]">
            <span className="text-text-secondary">{t("profile.used")}</span>
            <span className="font-semibold text-text-primary">
              {t("profile.usedCount", { used: 1, max: 2 })}
            </span>
          </div>
          <ProgressBar value={1} max={2} height="8px" className="mt-3" />
          <p className="mt-2 text-[16px] font-semibold text-primary">
            {t("profile.remaining")}: 1
          </p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
            {t("profile.notifications")}
          </h2>
          {/* <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label={t("profile.notifyApproved")}
            checked={approval}
            onChange={(v) => {
              setApproval(v);
              void updateNotifications({
                onApproval: { line: v },
                onRejection: { line: v },
              }).catch(() => setApproval(!v));
            }}
          />
          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label={t("profile.notifyPayday")}
            checked={payday}
            onChange={(v) => {
              setPayday(v);
              void updateNotifications({
                onPaydayReminder: { line: v },
                onCutoffWarning: { line: v },
              }).catch(() => setPayday(!v));
            }}
          /> */}
          <ToggleRow
            icon={<MessageCircle className="h-5 w-5" />}
            label={t("profile.notifyLine")}
            checked={line}
            disabled={!hasLineProfile}
            onChange={(v) => {
              setLine(v);
              void updateNotifications({
                onApproval: { line: v },
                onRejection: { line: v },
                onDisbursement: { line: v },
                onPaydayReminder: { line: v },
                onCutoffWarning: { line: v },
              }).catch(() => setLine(!v));
            }}
          />
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <label
            className="mb-2 block text-[16px] font-semibold text-text-primary"
            htmlFor="language"
          >
            {t("profile.language")}
          </label>
          <LocaleSwitcher variant="select" />
        </section>

        <button
          type="button"
          onClick={handleUnlink}
          disabled={!hasLineProfile}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-red-200 text-[16px] font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <Link2Off className="h-5 w-5" aria-hidden />
          {t("profile.unlinkLine")}
        </button>
      </main>

      <BankAccountSheet
        open={showEditBank}
        onClose={() => setShowEditBank(false)}
        initialBankCode={bankCode}
        initialHolderName={holderName}
        locale={locale}
        onSave={handleSaveBank}
      />
    </div>
  );
}

interface BankAccountSheetProps {
  open: boolean;
  onClose: () => void;
  initialBankCode: string;
  initialHolderName: string;
  locale: string;
  onSave: (data: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  }) => void;
}

function BankAccountSheet({
  open,
  onClose,
  initialBankCode,
  initialHolderName,
  locale,
  onSave,
}: BankAccountSheetProps) {
  const t = useTranslations();
  const [bankCode, setBankCode] = useState(initialBankCode);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState(initialHolderName);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      setBankCode(initialBankCode);
      setHolderName(initialHolderName);
      setAccountNumber("");
    } else {
      setClosing(true);
      const timer = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(timer);
    }
  }, [open, initialBankCode, initialHolderName]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!visible) return null;

  const canSave =
    bankCode.length > 0 &&
    accountNumber.replace(/\D/g, "").length >= 10 &&
    holderName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          closing ? "opacity-0" : "opacity-100",
        )}
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-bg-canvas shadow-modal transition-transform ease-out [transition-duration:250ms]",
          closing ? "translate-y-full" : "translate-y-0",
        )}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <header className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {t("profile.editBankAccount")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 pb-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">
              {t("profile.bankName")}
            </span>
            <div className="relative">
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-[15px] text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {THAI_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {locale === "th" ? bank.nameTh : bank.nameEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">
              {t("profile.accountNumber")}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0000000000"
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 font-mono text-[15px] text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">
              {t("profile.accountHolderName")}
            </span>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-[15px] text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <footer className="p-5 pb-8">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({ bankCode, accountNumber, holderName })}
            className="h-12 w-full rounded-xl bg-primary text-[16px] font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {t("common.save")}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  disabled = false,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-light py-3 last:border-b-0">
      <div className="flex items-center gap-2 text-[16px] text-text-primary">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={
            checked
              ? "absolute right-1 top-1 h-6 w-6 rounded-full bg-white shadow-card transition"
              : "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-card transition"
          }
        />
      </button>
    </div>
  );
}
