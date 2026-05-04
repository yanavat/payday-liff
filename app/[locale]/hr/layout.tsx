import { HRLayoutShell } from '@/components/layouts/hr-layout'

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return <HRLayoutShell>{children}</HRLayoutShell>
}
