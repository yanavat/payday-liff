'use client'

import { usePathname } from '@/i18n/navigation'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-page-fade-in">
      {children}
    </div>
  )
}
