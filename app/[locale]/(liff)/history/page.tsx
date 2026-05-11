import { Suspense } from "react";

import { LiffHistoryPage } from "@/components/liff-history-page";

export default function LocaleLiffHistoryPage() {
  return (
    <Suspense>
      <LiffHistoryPage />
    </Suspense>
  );
}
