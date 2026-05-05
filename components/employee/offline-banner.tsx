"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

export function OfflineBanner() {
  const t = useTranslations("common");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-3 text-[16px] font-medium text-amber-800"
    >
      <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
      {t("offlineBanner")}
    </div>
  );
}
