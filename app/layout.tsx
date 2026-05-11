import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'PayDay+ LIFF',
  description: 'Employee earned wage access mini app',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
