import type { ReactNode } from 'react'
import { HRSidebar } from './hr-sidebar'
import { HRTopbar } from './hr-topbar'

interface HRLayoutShellProps {
  children: ReactNode
}

export function HRLayoutShell({ children }: HRLayoutShellProps) {
  return (
    <div className="flex min-h-screen bg-bg-page text-text-primary">
      <HRSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <HRTopbar />
        <main className="min-h-0 flex-1 overflow-auto px-5 py-5">
          {children}
        </main>
      </div>
    </div>
  )
}
