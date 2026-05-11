import type { ReactNode } from 'react'
import { LiffBottomTabBar } from './liff-bottom-tab-bar'
import { LiffOfflineBanner } from './liff-offline-banner'

export function LiffShell({ children }: { children: ReactNode }) {
  return (
    <div className="employee-screen">
      <LiffOfflineBanner />
      <main className="flex-1 overflow-auto pb-16">{children}</main>
      <LiffBottomTabBar />
    </div>
  )
}
