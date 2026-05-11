'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, WifiOff } from 'lucide-react'
import { loadLiffClient } from '@/lib/liff-client'

export function LiffOfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInClient, setIsInClient] = useState(true)
  const isMockMode = process.env.NEXT_PUBLIC_LIFF_MOCK === 'true'

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
    loadLiffClient().then((liff) => setIsInClient(liff.isInClient()))
  }, [isMockMode])

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-3 text-[16px] font-medium text-amber-800"
      >
        <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
        ไม่มีอินเทอร์เน็ต
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
        เปิดใน LINE เพื่อใช้งานได้ครบถ้วน
      </div>
    )
  }

  return null
}
