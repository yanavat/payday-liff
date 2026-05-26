"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export function HRLoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [email, setEmail] = useState("hr@paydayplus.co");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/hr/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        window.localStorage.removeItem("payday-session");
        router.push("/hr/dashboard");
        return;
      }

      setError(t("wrongPin", { attempts: 0 }));
    } catch {
      setError(t("wrongPin", { attempts: 0 }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-page px-6 py-10">
      <div className="absolute inset-0 opacity-[0.35] [background:radial-gradient(circle_at_30%_20%,var(--color-primary-bg)_0,var(--color-primary-bg)_28%,transparent_29%),radial-gradient(circle_at_72%_76%,var(--color-primary-subtle)_0,var(--color-primary-subtle)_32%,transparent_33%)]" />
      <div className="absolute right-4 top-4 z-10">
        <LocaleSwitcher />
      </div>
      <section className="relative w-full max-w-[400px] rounded-xl border border-border bg-bg-canvas p-8 shadow-modal">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-start gap-2">
            <BrandLogo className="mx-0" size={40} />
            <span className="text-base font-semibold text-primary">
              PayDay+
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-text-primary">
            {t("hrTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {t("hrSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="hr-email"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Email
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
                placeholder="hr@paydayplus.co"
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
                Password
              </label>
              <Link
                href="/hr/forgot-password"
                className="text-xs font-medium text-text-muted transition hover:text-primary"
              >
                {t("forgotPin")}
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
                placeholder="******"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword((value) => !value)}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition hover:bg-bg-canvas hover:text-text-primary disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide" : "Show"}
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
            {isLoading ? t("loading") : t("loginButton")}
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
