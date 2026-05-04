import { AlertTriangle, Bell, WalletCards } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { currentEmployee } from "@/lib/mock/currentUser";
import { getRequestsByEmployee } from "@/lib/mock/requests";
import { payCycles } from "@/lib/mock/payrollCycles";
import { formatTHB } from "@/lib/utils/format";

const earnedWage = 9200;
const maxAllowed = 4600;
const previousAdvance = 1100;
const available = maxAllowed - previousAdvance;

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function EmployeeHomePage() {
  const cycle = payCycles[currentEmployee.payCycle];
  const recentRequests = getRequestsByEmployee(currentEmployee.id)
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="min-h-full bg-bg-page pb-5">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-text-primary">
            สวัสดี, {currentEmployee.nameTh} 👋
          </h1>
          <p className="mt-1 text-[16px] text-text-muted">
            วันจันทร์ที่ 5 พ.ค. 2568
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="relative flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="แจ้งเตือน"
          >
            <Bell className="h-5 w-5 text-text-secondary" aria-hidden />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-400" />
          </button>
          <Link
            href="/employee/profile"
            aria-label="โปรไฟล์"
            className="flex h-12 w-12 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <Avatar initials={currentEmployee.nameTh} size="sm" color="teal" />
          </Link>
        </div>
      </header>

      <section className="mx-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
        <p className="text-[16px] text-white/80">เบิกได้วันนี้</p>
        <div className="mt-1 font-sans text-[36px] font-bold leading-tight">
          {formatTHB(available)}
        </div>
        <div className="my-4 h-px bg-white/20" />
        <div className="grid grid-cols-2 gap-3 text-[16px]">
          <div>
            <p className="text-white/70">รายได้สะสม</p>
            <p className="font-semibold">{formatTHB(earnedWage)}</p>
          </div>
          <div>
            <p className="text-white/70">เบิกสูงสุด 50%</p>
            <p className="font-semibold">{formatTHB(maxAllowed)}</p>
          </div>
          <div>
            <p className="text-white/70">เบิกไปแล้ว</p>
            <p className="font-semibold">{formatTHB(previousAdvance)}</p>
          </div>
          <div>
            <p className="text-white/70">คงเหลือเบิกได้</p>
            <p className="font-semibold">{formatTHB(available)}</p>
          </div>
        </div>
        <Link
          href="/employee/request"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-[16px] font-semibold text-primary"
        >
          <WalletCards className="h-5 w-5" aria-hidden />
          ยื่นคำขอเบิกเงิน
        </Link>
      </section>

      <section className="mx-4 mt-4 rounded-lg border border-border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            รอบเงินเดือน พ.ค. 2568
          </h2>
          <span className="text-[16px] font-medium text-primary">
            จ่ายเงิน 31 พ.ค.
          </span>
        </div>
        <ProgressBar
          value={cycle.daysElapsed}
          max={cycle.totalDays}
          height="8px"
        />
        <div className="mt-2 flex items-center justify-between text-[16px] text-text-muted">
          <span>
            วันที่ {cycle.daysElapsed} / {cycle.totalDays}
          </span>
          <span>เหลือ 17 วัน</span>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[16px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>ตัดรอบ EWA: 28 พ.ค. (อีก 24 วัน)</span>
        </div>
      </section>

      <section className="mx-4 mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            คำขอล่าสุด
          </h2>
          <Link
            href="/employee/history"
            className="flex items-center text-[16px] font-medium text-primary"
          >
            ดูประวัติทั้งหมด →
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center">
            <p className="text-[16px] font-semibold text-text-primary">
              ยังไม่มีคำขอ
            </p>
            <p className="mt-1 text-[16px] text-text-muted">
              เริ่มต้นยื่นคำขอเบิกเงินได้เลย
            </p>
            <Link
              href="/employee/request"
              className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-[16px] font-semibold text-white"
            >
              ยื่นคำขอเลย
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((request) => {
              const [day, month] = formatRequestDate(request.requestedAt).split(
                " ",
              );
              return (
                <Link
                  key={request.id}
                  href="/employee/history"
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-card"
                >
                  <div className="w-11 text-center">
                    <div className="font-sans text-[20px] font-bold leading-none text-primary">
                      {day}
                    </div>
                    <div className="mt-1 text-[16px] text-text-muted">
                      {month}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-text-primary">
                      คำขอ EWA
                    </p>
                    <p className="truncate font-mono text-[14px] text-text-muted">
                      {request.referenceNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[16px] font-bold text-text-primary">
                      {formatTHB(request.amount)}
                    </p>
                    <StatusBadge status={request.status} size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
