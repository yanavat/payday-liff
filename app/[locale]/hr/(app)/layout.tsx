import { HRLayoutShell } from "@/components/layouts/hr-layout";
import { HRAuthGate } from "@/components/hr/hr-auth-gate";
import { PageTransition } from "@/components/ui/page-transition";

export default function HRAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HRAuthGate>
      <HRLayoutShell>
        <PageTransition>{children}</PageTransition>
      </HRLayoutShell>
    </HRAuthGate>
  );
}
