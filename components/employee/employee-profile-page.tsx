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
import { Avatar } from "@/components/ui/avatar";
import { PayCycleBadge } from "@/components/ui/pay-cycle-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { currentEmployee } from "@/lib/mock/currentUser";

export function EmployeeProfilePage() {
  const [approval, setApproval] = useState(true);
  const [payday, setPayday] = useState(true);
  const [line, setLine] = useState(true);
  const [language, setLanguage] = useState("ภาษาไทย");

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
              บัญชีรับเงิน
            </h2>
          </div>
          <p className="text-[16px] font-semibold text-text-primary">
            ธนาคารกสิกรไทย
          </p>
          <p className="mt-1 font-mono text-[16px] text-text-secondary">
            {currentEmployee.bankAccountMasked}
          </p>
          <p className="mt-2 text-[16px] text-text-muted">
            ติดต่อ HR เพื่อเปลี่ยนแปลงบัญชี
          </p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-[16px] font-semibold text-text-primary">
              วงเงิน EWA ของฉัน
            </h2>
          </div>
          <div className="flex items-center justify-between text-[16px]">
            <span className="text-text-secondary">เบิกได้สูงสุด</span>
            <span className="font-semibold text-text-primary">
              50% ของรายได้
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[16px]">
            <span className="text-text-secondary">ใช้ไปแล้ว</span>
            <span className="font-semibold text-text-primary">
              1 / 2 ครั้งรอบนี้
            </span>
          </div>
          <ProgressBar value={1} max={2} height="8px" className="mt-3" />
          <p className="mt-2 text-[16px] font-semibold text-primary">
            เหลือสิทธิ์ 1 ครั้ง
          </p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
            การแจ้งเตือน
          </h2>
          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label="แจ้งเตือนเมื่ออนุมัติ"
            checked={approval}
            onChange={setApproval}
          />
          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            label="แจ้งเตือนวันจ่ายเงินเดือน"
            checked={payday}
            onChange={setPayday}
          />
          <ToggleRow
            icon={<MessageCircle className="h-5 w-5" />}
            label="แจ้งเตือนผ่าน LINE"
            checked={line}
            onChange={setLine}
          />
        </section>

        <section className="rounded-lg border border-border bg-white p-4 shadow-card">
          <label
            className="mb-2 block text-[16px] font-semibold text-text-primary"
            htmlFor="language"
          >
            ภาษา
          </label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-12 w-full rounded-md border border-border bg-bg-secondary px-3 text-[16px] font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option>ภาษาไทย</option>
            <option>English</option>
            <option>ဘာသာမြန်မာ</option>
          </select>
        </section>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md text-[16px] font-semibold text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          ออกจากระบบ
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
            ? "relative h-12 w-14 rounded-full bg-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30"
            : "relative h-12 w-14 rounded-full bg-border transition focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
      >
        <span
          className={
            checked
              ? "absolute right-1 top-3 h-6 w-6 rounded-full bg-white shadow-card transition"
              : "absolute left-1 top-3 h-6 w-6 rounded-full bg-white shadow-card transition"
          }
        />
      </button>
    </div>
  );
}
