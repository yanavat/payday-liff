import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_Thai } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransition } from "@/components/ui/page-transition";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PayDay+ | Earned Wage Access",
    template: "%s | PayDay+",
  },
  description: "Earned Wage Access Platform — Factory Edition",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = params;

  // Validate locale
  if (!routing.locales.includes(locale as "th" | "en" | "my")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSansThai.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('payday-dark-mode') === 'true' && location.pathname.includes('/hr/')) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <PageTransition>{children}</PageTransition>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
