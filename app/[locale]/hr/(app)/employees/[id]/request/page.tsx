import { OnBehalfRequestPage } from '@/components/hr/on-behalf-request-page'

export default async function EmployeeRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <OnBehalfRequestPage employeeId={id} />
}
