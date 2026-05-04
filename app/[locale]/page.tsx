import { redirect } from 'next/navigation'

// Root page: redirect to HR dashboard by default
// In a real app, you'd check auth state and redirect accordingly
export default function RootPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/hr/dashboard`)
}
