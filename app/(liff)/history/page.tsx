import { Suspense } from 'react'
import { LiffHistoryPage } from '@/components/liff-history-page'

export default function HistoryPage() {
  return (
    <Suspense>
      <LiffHistoryPage />
    </Suspense>
  )
}
