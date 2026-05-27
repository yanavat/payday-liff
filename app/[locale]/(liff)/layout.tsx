import type { ReactNode } from "react";

import { AuthGate } from "@/components/liff-auth-gate";
import { LiffDeepLinkHandler } from "@/components/liff-deep-link-handler";
import { LiffShell } from "@/components/liff-shell";

export default function LocaleLiffLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <LiffDeepLinkHandler />
      <LiffShell>{children}</LiffShell>
    </AuthGate>
  );
}
