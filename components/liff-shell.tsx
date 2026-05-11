import type { ReactNode } from 'react'
import { LiffBottomTabBar } from './liff-bottom-tab-bar'
import { LiffOfflineBanner } from './liff-offline-banner'

export function LiffShell({ children }: { children: ReactNode }) {
  return (
    <div className="employee-screen">
      <LiffOfflineBanner />
      <main className="liff-content-area">{children}</main>
      <LiffBottomTabBar />
    </div>
  )
}
