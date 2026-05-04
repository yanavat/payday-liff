'use client'

import {
  BarChart3,
  FileText,
  Gauge,
  Headphones,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const mainNav = [
  { href: '/hr/dashboard', label: 'แดชบอร์ด', icon: Gauge },
  { href: '/hr/requests', label: 'คำร้องขอ', icon: FileText },
  { href: '/hr/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/hr/employees', label: 'พนักงาน', icon: Users },
  { href: '/hr/settings', label: 'การตั้งค่า', icon: Settings },
]

const footerNav = [
  { href: '/hr/support', label: 'สนับสนุน', icon: Headphones },
  { href: '/', label: 'ออกจากระบบ', icon: LogOut },
]

export function HRSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[200px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 py-4">
      <div className="px-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-base font-bold text-white">
            E
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-bold leading-[22.5px] text-emerald-600">EWA Pro</div>
            <div className="truncate text-[10px] leading-[15px] text-slate-500">แผงควบคุมผู้ดูแลระบบ HR</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[6px] px-3" aria-label="HR navigation">
        {mainNav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-[38px] items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                active
                  ? 'bg-emerald-500 text-white shadow-card'
                  : 'text-slate-600 hover:bg-primary-bg hover:text-primary-dark',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 pt-[18px]">
        {footerNav.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-[38px] items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-primary-bg hover:text-primary-dark"
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
