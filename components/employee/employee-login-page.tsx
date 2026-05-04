"use client";

import { useState } from "react";
import { QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { PINPad } from "@/components/ui/pin-pad";
import { cn } from "@/lib/utils";

const maxAttempts = 5;

export function EmployeeLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("EMP-0001");
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("TH");
  const [error, setError] = useState("");

  const remainingAttempts = Math.max(maxAttempts - attempts, 0);

  function submitLogin(nextPin = pin) {
    if (isLocked || isLoading || !employeeId || nextPin.length < 4) return;

    setIsLoading(true);
    window.setTimeout(() => {
      if (nextPin === "1234") {
        router.push("/employee/home");
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPin("");
      setIsLoading(false);

      if (nextAttempts >= maxAttempts) {
        setIsLocked(true);
        setError("บัญชีถูกล็อก — กรุณาลองใหม่ใน 30 นาที");
        return;
      }

      setError(`PIN ไม่ถูกต้อง เหลือ ${maxAttempts - nextAttempts} ครั้ง`);
    }, 350);
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-primary-bg px-5 py-8">
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(135deg,#1E9E74_12%,transparent_12%,transparent_50%,#1E9E74_50%,#1E9E74_62%,transparent_62%,transparent)] [background-size:28px_28px]" />
      <div className="absolute right-4 top-4 z-10 flex rounded-full border border-primary/20 bg-white p-1 shadow-card">
        {["TH", "EN", "MM"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={cn(
              "h-12 min-w-12 rounded-full px-3 text-[16px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30",
              language === item ? "bg-primary text-white" : "text-text-muted",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative z-10 mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-hover">
          <ShieldCheck className="h-8 w-8" strokeWidth={1.8} aria-hidden />
        </div>
        <h1 className="text-2xl font-bold leading-tight text-primary">
          PayDay+
        </h1>
        <p className="mt-1 text-[16px] text-text-muted">
          เบิกเงินเดือนล่วงหน้า ง่าย รวดเร็ว
        </p>
      </div>

      <section className="relative z-10 rounded-xl bg-white p-6 shadow-modal">
        {isLocked && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[16px] font-medium text-red-700">
            บัญชีถูกล็อก — กรุณาลองใหม่ใน 30 นาที
            <div className="mt-1 font-mono text-[16px]">29:45</div>
          </div>
        )}
        {!isLocked && error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[16px] font-medium text-red-700">
            {error}
          </div>
        )}

        <label
          className="mb-2 block text-[16px] font-semibold text-text-primary"
          htmlFor="employee-id"
        >
          รหัสพนักงาน
        </label>
        <input
          id="employee-id"
          type="text"
          inputMode="numeric"
          autoFocus
          disabled={isLocked}
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          placeholder="กรอกรหัสพนักงาน เช่น EMP-0041"
          className="mb-5 h-14 w-full rounded-md border border-border bg-bg-secondary px-4 text-[16px] font-medium text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />

        <div className="mb-3 text-center text-[16px] font-semibold text-text-primary">
          PIN 4 หลัก
        </div>
        <PINPad
          value={pin}
          onChange={setPin}
          onComplete={submitLogin}
          disabled={isLocked || isLoading}
          className={cn(error && !isLocked && "animate-pulse")}
        />

        <button
          type="button"
          disabled={isLocked || isLoading || !employeeId || pin.length < 4}
          onClick={() => submitLogin()}
          className="mt-6 flex h-[52px] w-full items-center justify-center rounded-md bg-primary text-[18px] font-semibold text-white shadow-card transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <button
          type="button"
          className="mt-4 flex h-[48px] w-full items-center justify-center text-[18px] font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          ลืม PIN?
        </button>
        <p className="mt-1 text-center text-[16px] text-text-muted">
          ติดต่อ HR ชั้น 1 โทร. 02-xxx-xxxx
        </p>

        <button
          type="button"
          disabled={isLocked}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-primary bg-white text-[16px] font-semibold text-primary transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        >
          <QrCode className="h-5 w-5" aria-hidden />
          สแกน QR บัตรพนักงาน
        </button>
        {!isLocked && attempts > 0 && (
          <p className="mt-3 text-center text-[16px] text-text-muted">
            เหลือโอกาสเข้าสู่ระบบ {remainingAttempts} ครั้ง
          </p>
        )}
      </section>
    </div>
  );
}
