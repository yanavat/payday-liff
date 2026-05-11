import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ToastProvider } from '@/components/ui/toast'
import { LIFFAuthGate } from '@/components/liff-auth-gate'
import { LiffShell } from '@/components/liff-shell'

export default async function LiffLayout({ children }: { children: ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <ToastProvider>
        <LIFFAuthGate>
          <LiffShell>{children}</LiffShell>
        </LIFFAuthGate>
      </ToastProvider>
    </NextIntlClientProvider>
  )
}
