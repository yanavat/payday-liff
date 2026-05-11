'use client'

import { ClipboardList, Home, User, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLiffPathActive, withLiffLocale } from '@/lib/liff-routes'
import { cn } from '@/lib/utils'
import { getRequestsByEmployee } from '@/lib/mock/requests'
import { currentEmployee } from '@/lib/mock/currentUser'

const tabs = [
  { labelKey: 'home', href: '/', icon: Home },
  { labelKey: 'request', href: '/request', icon: WalletCards },
  { labelKey: 'history', href: '/history', icon: ClipboardList },
  { labelKey: 'profile', href: '/profile', icon: User },
] as const

export function LiffBottomTabBar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const pendingCount = getRequestsByEmployee(currentEmployee.id).filter(
    (r) => r.status === 'pending',
  ).length

  return (
    <nav className="employee-bottom-tab z-20" aria-label={t('home')}>
      <div className="mx-auto flex w-full max-w-[390px] justify-around">
        {tabs.map((tab) => {
          const active = isLiffPathActive(pathname, tab.href)
          const href = withLiffLocale(pathname, tab.href)
          const Icon = tab.icon
          const showBadge = tab.href === '/history' && pendingCount > 0

          return (
            <Link
              key={tab.href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium leading-none transition hover:text-primary',
                active ? 'text-primary' : 'text-text-muted',
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                {showBadge && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[12px] font-bold text-bg-canvas">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className="!text-[14px]">{t(tab.labelKey as keyof typeof t)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
