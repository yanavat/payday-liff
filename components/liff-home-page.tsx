"use client";

import { useEffect } from "react";
import { AlertTriangle, WalletCards } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useLiffProfile, useLinkedEmployeeId } from "@/components/liff-auth-gate";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withLiffLocale } from "@/lib/liff-routes";
import { formatTHB } from "@/lib/utils/format";
import { useEmployeeCurrentPeriod } from "@/lib/api/hooks/use-employees";
import { useEWARequests } from "@/lib/api/hooks/use-ewa-requests";
import type { EWAStatus } from "@/types";

const dateLocales: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  my: "my-MM",
};

function formatRequestDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function daysUntil(dateStr: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

const statusClasses: Record<EWAStatus, string> = {
  pending: "bg-status-pending-bg text-status-pending-text",
  approved: "bg-status-approved-bg text-status-approved-text",
  rejected: "bg-status-rejected-bg text-status-rejected-text",
  disbursed: "bg-status-disbursed-bg text-status-disbursed-text",
};

export function LiffHomePage() {
  const profile = useLiffProfile();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("home");
  const nav = useTranslations("nav");
  const status = useTranslations("status");

  const employeeId = useLinkedEmployeeId();
  const { data: currentPeriod, loading: periodLoading, refetch: refetchPeriod } =
    useEmployeeCurrentPeriod(employeeId);
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } =
    useEWARequests({ employeeId, limit: 3 });

  useEffect(() => {
    if (!employeeId) return;
    const id = setInterval(() => {
      void refetchPeriod();
      void refetchRequests();
    }, 30_000);
    return () => clearInterval(id);
  }, [employeeId, refetchPeriod, refetchRequests]);

  const available = currentPeriod
    ? currentPeriod.maxWithdrawable - currentPeriod.previousEWAThisPeriod
    : 0;
  const earnedWage = currentPeriod?.earnedToDate ?? 0;
  const maxAllowed = currentPeriod?.maxWithdrawable ?? 0;
  const previousAdvance = currentPeriod?.previousEWAThisPeriod ?? 0;
  const daysElapsed = currentPeriod?.daysElapsed ?? 0;
  const totalDays = currentPeriod?.totalDays ?? 1;
  const daysToPayday = currentPeriod ? daysUntil(currentPeriod.paydayDate) : 0;
  const daysToCutoff = currentPeriod ? daysUntil(currentPeriod.cutoffDate) : 0;

  const recentRequests = requestsData?.data?.slice(0, 3) ?? [];
  const showBalanceSkeleton = periodLoading && !currentPeriod;
  const showRequestsSkeleton = requestsLoading && !requestsData;

  return (
    <div className="bg-bg-page pb-5">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-[18px] font-semibold leading-tight text-text-primary">
            {t("greeting", { name: profile?.displayName ?? '' })}
          </h1>
          <p className="mt-1 text-[16px] text-text-muted">
            {new Intl.DateTimeFormat(dateLocales[locale] ?? "en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
        </div>
        <Link
          aria-label={nav("profile")}
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-bg transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          href={withLiffLocale(pathname, "/profile")}
        >
          {profile?.pictureUrl ? (
            <Image
              alt={profile.displayName}
              className="h-full w-full object-cover"
              height={48}
              src={profile.pictureUrl}
              unoptimized
              width={48}
            />
          ) : (
            <span className="text-sm font-semibold text-primary-dark">
              {(profile?.displayName ?? '').slice(0, 2)}
            </span>
          )}
        </Link>
      </header>

      <section className="mx-4 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-hover">
        <p className="text-[16px] text-white/80">{t("heroTitle")}</p>
        {showBalanceSkeleton ? (
          <div className="mt-1 h-10 w-32 animate-pulse rounded bg-white/20" />
        ) : (
          <div className="mt-1 font-sans text-[36px] font-bold leading-tight">
            {formatTHB(available)}
          </div>
        )}
        <div className="my-4 h-px bg-white/20" />
        <div className="grid grid-cols-2 gap-3 text-[16px]">
          <div>
            <p className="text-white/70">{t("earnedWage")}</p>
            <p className="font-semibold">{formatTHB(earnedWage)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("maxAllowed")}</p>
            <p className="font-semibold">{formatTHB(maxAllowed)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("previousAdvance")}</p>
            <p className="font-semibold">{formatTHB(previousAdvance)}</p>
          </div>
          <div>
            <p className="text-white/70">{t("remaining")}</p>
            <p className="font-semibold">{formatTHB(available)}</p>
          </div>
        </div>
        <Link
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-[16px] font-semibold text-primary"
          href={withLiffLocale(pathname, "/request")}
        >
          <WalletCards className="h-5 w-5" aria-hidden />
          {t("requestCta")}
        </Link>
      </section>

      <section className="mx-4 mt-4 rounded-lg border border-border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {t("payPeriod")}
          </h2>
          <span className="text-[16px] font-medium text-primary">
            {t("paydayCountdown", { days: daysToPayday })}
          </span>
        </div>
        <ProgressBar value={daysElapsed} max={totalDays} height="8px" />
        <div className="mt-2 flex items-center justify-between text-[16px] text-text-muted">
          <span>{t("dayProgress", { elapsed: daysElapsed, total: totalDays })}</span>
          <span>{t("cutoffWarning", { days: daysToCutoff })}</span>
        </div>
        {daysToCutoff <= 3 && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[16px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{t("cutoffWarning", { days: daysToCutoff })}</span>
          </div>
        )}
      </section>

      <section className="mx-4 mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {t("recentRequests")}
          </h2>
          <Link
            className="flex items-center text-[16px] font-medium text-primary"
            href={withLiffLocale(pathname, "/history")}
          >
            {t("viewAllHistory")}
          </Link>
        </div>
        {showRequestsSkeleton ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((request) => {
              const [day, month] = formatRequestDate(request.requestedAt, locale).split(" ");
              return (
                <Link
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-card transition-shadow duration-200 hover:shadow-hover"
                  href={withLiffLocale(pathname, `/history?id=${request.id}`)}
                  key={request.id}
                >
                  <div className="w-11 text-center">
                    <div className="font-sans text-[20px] font-bold leading-none text-primary">{day}</div>
                    <div className="mt-1 text-[16px] text-text-muted">{month}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-text-primary">{t("requestItemTitle")}</p>
                    <p className="truncate font-mono text-[14px] text-text-muted">{request.referenceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[16px] font-bold text-text-primary">{formatTHB(request.amount)}</p>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses[request.status]}`}>
                      {status(request.status)}
                    </span>
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
