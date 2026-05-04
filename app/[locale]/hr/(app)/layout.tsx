import { HRLayoutShell } from "@/components/layouts/hr-layout";

export default function HRAppLayout({ children }: { children: React.ReactNode }) {
  return <HRLayoutShell>{children}</HRLayoutShell>;
}
