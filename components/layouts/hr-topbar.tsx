'use client'

import { Bell, HelpCircle, Search, Settings } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { hrUser } from '@/lib/mock'

interface HRTopbarProps {
  searchPlaceholder?: string
}

export function HRTopbar({ searchPlaceholder = 'ค้นหาคำร้องขอ...' }: HRTopbarProps) {
  const initials = hrUser.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="h-[34px] w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border border-white bg-red-500" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </button>
        <Avatar initials={initials} size="md" color="teal" />
      </div>
    </header>
  )
}
