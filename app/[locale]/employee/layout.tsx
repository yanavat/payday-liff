import { EmployeeShell } from '@/components/employee/employee-shell'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeShell>{children}</EmployeeShell>
}
