import { OnBehalfRequestPage } from '@/components/hr/on-behalf-request-page'

export default function EmployeeRequestPage({ params }: { params: { id: string } }) {
  return <OnBehalfRequestPage employeeId={params.id} />
}
