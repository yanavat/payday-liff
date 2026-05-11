'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, WifiOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { loadLiffClient } from '@/lib/liff-client'

const isMockMode = process.env.NEXT_PUBLIC_LIFF_MOCK === 'true'

export function LiffOfflineBanner() {
  const t = useTranslations('liff')
  const [isOnline, setIsOnline] = useState(true)
  const [isInClient, setIsInClient] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isMockMode) return
    let cancelled = false
    loadLiffClient().then((liff) => {
      if (!cancelled) setIsInClient(liff.isInClient())
    })
    return () => { cancelled = true }
  }, [])

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-3 text-[16px] font-medium text-amber-800"
      >
        <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
        {t('offlineMessage')}
      </div>
    )
  }

  if (!isInClient && !isMockMode) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-blue-50 px-4 py-3 text-[16px] font-medium text-blue-800"
      >
        <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
        {t('externalBrowserMessage')}
      </div>
    )
  }

  return null
}
