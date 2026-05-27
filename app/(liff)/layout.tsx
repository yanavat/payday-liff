import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast";
import { AuthGate } from "@/components/liff-auth-gate";
import { LiffShell } from "@/components/liff-shell";
import { LiffDeepLinkHandler } from "@/components/liff-deep-link-handler";

export default async function LiffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider>
        <AuthGate>
          <LiffDeepLinkHandler />
          <LiffShell>{children}</LiffShell>
        </AuthGate>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
