"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  CreditCard,
  LogOut,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { currentEmployee } from "@/lib/mock/currentUser";

export function EmployeeProfilePage() {
  const t = useTranslations();
  const [approval, setApproval] = useState(true);
  const [payday, setPayday] = useState(true);
  const [line, setLine] = useState(true);
  const [language, setLanguage] = useState("TH");

  return (
    <div className="min-h-full bg-bg-page pb-5">
      <header className="bg-primary-bg px-4 py-6 text-center">
        <Avatar
          initials={currentEmployee.nameTh}
          size="xl"
          color="teal"
          className="mx-auto"
        />
        <h1 className="mt-3 text-[22px] font-bold leading-tight text-text-primary">
          {currentEmployee.nameTh}
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">
          {currentEmployee.id} · {currentEmployee.department}
        </p>
        <div className="mt-3 flex justify-center">
          <PayCycleBadge type={currentEmployee.payCycle} />
        </div>
      </header>

      <main className="space-y-3 px-4 pt-4">
        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-[16px] font-semibold text-text-primary">
              {t("profile.bankAccount")}
            </h2>
          </div>
          <p className="text-[16px] font-semibold text-text-primary">
            KASIKORNBANK
          </p>
          <p className="mt-1 font-mono text-[16px] text-text-secondary">
            {currentEmployee.bankAccountMasked}
          </p>
          <p className="mt-2 text-[16px] text-text-muted">
            {t("profile.bankAccount")}
          </p>
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
              50% of salary
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[16px]">
            <span className="text-text-secondary">{t("profile.used")}</span>
            <span className="font-semibold text-text-primary">
              1 / 2 this cycle
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
          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label={t("profile.notifyApproved")}
            checked={approval}
            onChange={setApproval}
          />
          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label={t("profile.notifyPayday")}
            checked={payday}
            onChange={setPayday}
          />
          <ToggleRow
            icon={<MessageCircle className="h-5 w-5" />}
            label={t("profile.notifyLine")}
            checked={line}
            onChange={setLine}
          />
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <label
            className="mb-2 block text-[16px] font-semibold text-text-primary"
            htmlFor="language"
          >
            {t("profile.language")}
          </label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-12 w-full rounded-md border border-border bg-bg-secondary px-3 text-[16px] font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="TH">Thai</option>
            <option value="EN">English</option>
            <option value="MM">ဘာသာမြန်မာ</option>
          </select>
        </section>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md text-[16px] font-semibold text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          {t("profile.logout")}
        </button>
      </main>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
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
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "relative h-8 w-14 rounded-full bg-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
            : "relative h-8 w-14 rounded-full bg-border transition focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
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
