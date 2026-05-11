import type { ReactNode } from "react";

import { LIFFAuthGate } from "@/components/liff-auth-gate";
import { LiffDeepLinkHandler } from "@/components/liff-deep-link-handler";
import { LiffShell } from "@/components/liff-shell";

export default function LocaleLiffLayout({ children }: { children: ReactNode }) {
  return (
    <LIFFAuthGate>
      <LiffDeepLinkHandler />
      <LiffShell>{children}</LiffShell>
    </LIFFAuthGate>
  );
}
