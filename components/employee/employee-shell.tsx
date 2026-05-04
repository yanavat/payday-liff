'use client'

import { BottomTabBar } from '@/components/employee/bottom-tab-bar'
import { usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/employee/login'

  return (
    <div className="employee-screen">
      <main className={cn('flex-1 overflow-auto', !isLogin && 'pb-16')}>
        {children}
      </main>
      {!isLogin && <BottomTabBar />}
    </div>
  )
}
