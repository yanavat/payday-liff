import { HRLayoutShell } from "@/components/layouts/hr-layout";
import { PageTransition } from "@/components/ui/page-transition";

export default function HRAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HRLayoutShell>
      <PageTransition>{children}</PageTransition>
    </HRLayoutShell>
  );
}
