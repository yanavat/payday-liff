import { redirect } from 'next/navigation'

// Root page: redirect to HR dashboard by default
// In a real app, you'd check auth state and redirect accordingly
export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/hr/dashboard`)
}
