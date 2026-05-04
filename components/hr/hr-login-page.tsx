"use client";

import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function HRLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("hr@paydayplus.co");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    window.setTimeout(() => {
      if (
        email.toLowerCase().trim() === "hr@paydayplus.co" &&
        password === "123456"
      ) {
        router.push("/hr/dashboard");
        return;
      }

      setIsLoading(false);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }, 500);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-page px-6 py-10">
      <div className="absolute inset-0 opacity-[0.35] [background:radial-gradient(circle_at_30%_20%,var(--color-primary-bg)_0,var(--color-primary-bg)_28%,transparent_29%),radial-gradient(circle_at_72%_76%,var(--color-primary-subtle)_0,var(--color-primary-subtle)_32%,transparent_33%)]" />
      <section className="relative w-full max-w-[400px] rounded-xl border border-border bg-bg-canvas p-8 shadow-modal">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-hover">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            PayDay+
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary">
            เข้าสู่ระบบ HR
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            ระบบรับคำขอเงินล่วงหน้าพนักงาน
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="hr-email"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              อีเมล
            </label>
            <div
              className={cn(
                "flex h-11 items-center rounded-md border bg-bg-secondary px-3 transition",
                error
                  ? "border-red-300"
                  : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
              )}
            >
              <Mail
                className="mr-2 h-4 w-4 shrink-0 text-text-muted"
                aria-hidden
              />
              <input
                id="hr-email"
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.co.th"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="hr-password"
                className="block text-sm font-medium text-text-primary"
              >
                รหัสผ่าน
              </label>
              <Link
                href="/hr/forgot-password"
                className="text-xs font-medium text-text-muted transition hover:text-primary"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div
              className={cn(
                "flex h-11 items-center rounded-md border bg-bg-secondary px-3 transition",
                error
                  ? "border-red-300"
                  : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
              )}
            >
              <LockKeyhole
                className="mr-2 h-4 w-4 shrink-0 text-text-muted"
                aria-hidden
              />
              <input
                id="hr-password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword((value) => !value)}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition hover:bg-bg-canvas hover:text-text-primary disabled:cursor-not-allowed"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          {error && (
            <p className="text-center text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </form>

        <div className="mt-6 rounded-md bg-primary-subtle px-3 py-2 text-center text-xs leading-5 text-text-secondary">
          Demo: hr@paydayplus.co / 123456
        </div>
      </section>
    </main>
  );
}
