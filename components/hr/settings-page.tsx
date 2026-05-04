"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { TabBar } from "@/components/ui/tab-bar";
import { Toggle } from "./settings-toggle";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const mainTabs = [
  { value: "general", label: "ทั่วไป" },
  { value: "policy", label: "นโยบาย EWA" },
  { value: "notifications", label: "การแจ้งเตือน" },
  { value: "users", label: "จัดการผู้ใช้" },
];

const policyTabs = [
  { value: "monthly", label: "รายเดือน" },
  { value: "weekly", label: "รายสัปดาห์" },
];

export function SettingsPageContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("policy");
  const [policyTab, setPolicyTab] = useState("monthly");
  const [maxPercent, setMaxPercent] = useState(50);
  const [autoApproval, setAutoApproval] = useState(true);
  const [blackoutDates, setBlackoutDates] = useState([
    "2025-05-28",
    "2025-05-29",
  ]);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    setDirty(true);
  }

  return (
    <div className="max-w-[960px] space-y-4 pb-20">
      <header>
        <h1 className="text-[22px] font-semibold leading-[28.6px] text-text-primary">
          ตั้งค่า
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          หน้าหลัก / ตั้งค่า
        </p>
      </header>

      {dirty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          มีการเปลี่ยนแปลงที่ยังไม่บันทึก
        </div>
      )}

      <TabBar
        tabs={mainTabs}
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value);
          markDirty();
        }}
        variant="underline"
      />

      {activeTab === "policy" && (
        <div className="space-y-4">
          <TabBar
            tabs={policyTabs}
            value={policyTab}
            onChange={(value) => {
              setPolicyTab(value);
              markDirty();
            }}
          />
          <SettingsPanel title="กฎการเบิกเงิน">
            <label className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  % สูงสุดของรายได้
                </span>
                <span className="font-number text-sm font-semibold text-primary">
                  {maxPercent}% ของรายได้สะสม
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={5}
                value={maxPercent}
                onChange={(event) => {
                  setMaxPercent(Number(event.target.value));
                  markDirty();
                }}
                className="accent-primary"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumberField
                label="จำนวนครั้งสูงสุดต่อรอบ"
                value="2"
                suffix="ครั้ง/รอบ"
              />
              <NumberField label="ยอดขั้นต่ำต่อคำขอ" value="500" prefix="฿" />
              <NumberField label="ยอดสูงสุดต่อคำขอ" value="10000" prefix="฿" />
            </div>
          </SettingsPanel>

          <SettingsPanel title="การอนุมัติ">
            <Toggle
              checked={autoApproval}
              onChange={(checked) => {
                setAutoApproval(checked);
                markDirty();
              }}
              label="อนุมัติอัตโนมัติ"
              description="ใช้กับคำขอที่อยู่ในเงื่อนไขความเสี่ยงต่ำ"
            />
            {autoApproval && (
              <NumberField
                label="อนุมัติอัตโนมัติถ้าน้อยกว่า"
                value="3000"
                prefix="฿"
              />
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">
                ขั้นตอนการอนุมัติ
              </p>
              <div className="flex gap-3">
                <RadioPill checked label="ผู้อนุมัติเดียว" />
                <RadioPill label="2 ขั้นตอน" />
              </div>
            </div>
          </SettingsPanel>

          {policyTab === "weekly" && (
            <SettingsPanel title="กฎรายสัปดาห์">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SelectField
                  label="วันจ่ายเงิน"
                  options={["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์"]}
                  value="ศุกร์"
                />
                <SelectField
                  label="วันตัดรอบ EWA"
                  options={["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์"]}
                  value="พฤหัส"
                />
                <SelectField
                  label="เวลาตัดรอบ"
                  options={["16:00", "17:00", "18:00"]}
                  value="18:00"
                />
              </div>
            </SettingsPanel>
          )}

          <SettingsPanel title="วันที่ไม่อนุญาต EWA">
            <div className="flex flex-wrap gap-2">
              {blackoutDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1 text-sm"
                >
                  {date}
                  <button
                    onClick={() => {
                      setBlackoutDates((current) =>
                        current.filter((item) => item !== date),
                      );
                      markDirty();
                    }}
                    aria-label={`Remove ${date}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setBlackoutDates((current) => current.concat("2025-05-30"));
                  markDirty();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> เพิ่มวัน
              </button>
            </div>
          </SettingsPanel>
        </div>
      )}

      {activeTab === "notifications" && (
        <SettingsPanel title="การแจ้งเตือน">
          {[
            "เมื่อมีคำขอใหม่",
            "เมื่อคำขอรอนาน > 2 ชม.",
            "เมื่อคำขออนุมัติ",
            "เมื่อคำขอถูกปฏิเสธ",
            "วันจ่ายเงินเดือน",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-border-light py-3 last:border-0"
            >
              <span className="text-sm font-medium">{label}</span>
              <div className="flex gap-4">
                <Toggle checked onChange={markDirty} label="Email" />
                <Toggle checked onChange={markDirty} label="LINE" />
              </div>
            </div>
          ))}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <NumberField label="LINE Notify Token" value="••••••••••••" />
            <button className="mt-6 h-9 rounded-md border border-border px-4 text-sm font-medium">
              ทดสอบการเชื่อมต่อ
            </button>
          </div>
        </SettingsPanel>
      )}

      {activeTab === "users" && (
        <SettingsPanel title="HR Users">
          <div className="mb-3 flex justify-end">
            <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white">
              + เพิ่มผู้ใช้ HR
            </button>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {[
                ["สิริวรรณ บัวคำ", "siriwan@factory.co.th", "HR Manager"],
                ["สุภาพร แก้วกล้า", "finance@factory.co.th", "Accountant"],
                ["HR Viewer", "viewer@factory.co.th", "Viewer"],
              ].map((row) => (
                <tr
                  key={row[1]}
                  className="h-[52px] border-b border-border-light last:border-0"
                >
                  <td className="text-sm font-medium">{row[0]}</td>
                  <td className="text-sm text-text-muted">{row[1]}</td>
                  <td className="text-sm">{row[2]}</td>
                  <td className="text-right">
                    <button className="text-sm font-medium text-primary">
                      แก้ไขบทบาท
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsPanel>
      )}

      {activeTab === "general" && (
        <SettingsPanel title="ทั่วไป">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NumberField label="ชื่อบริษัท" value="Factory Co., Ltd." />
            <NumberField label="รหัสนายจ้าง" value="FAC-2025" />
          </div>
        </SettingsPanel>
      )}

      <div className="fixed bottom-5 right-5">
        <button
          onClick={() => {
            setDirty(false);
            toast({ variant: "success", message: "บันทึกการตั้งค่าแล้ว" });
          }}
          className="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white shadow-hover hover:bg-primary-dark"
        >
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg-canvas p-5 shadow-card">
      <h2 className="mb-4 text-section-title text-text-primary">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <div className="mt-2 flex h-10 items-center rounded-md border border-border bg-bg-secondary px-3">
        {prefix && <span className="text-text-muted">{prefix}</span>}
        <input
          defaultValue={value}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
        {suffix && <span className="text-text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
}: {
  label: string;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-label text-text-muted">{label}</span>
      <select
        defaultValue={value}
        className="mt-2 h-10 w-full rounded-md border border-border bg-bg-secondary px-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function RadioPill({
  checked = false,
  label,
}: {
  checked?: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        checked
          ? "border-primary bg-primary-subtle text-primary-dark"
          : "border-border text-text-secondary",
      )}
    >
      {label}
    </span>
  );
}
