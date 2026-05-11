'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { loadLiffClient } from '@/lib/liff-client'

type AuthState = 'loading' | 'ready' | 'error'

export function LIFFAuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading')

  useEffect(() => {
    let cancelled = false

    async function initializeLiff() {
      try {
        const liff = await loadLiffClient()
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID

        if (!liffId && process.env.NEXT_PUBLIC_LIFF_MOCK !== 'true') {
          throw new Error('NEXT_PUBLIC_LIFF_ID is required')
        }

        await liff.init({ liffId: liffId ?? 'mock-liff-id' })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        await liff.getProfile()

        if (!cancelled) {
          setAuthState('ready')
        }
      } catch {
        if (!cancelled) {
          setAuthState('error')
        }
      }
    }

    initializeLiff()

    return () => {
      cancelled = true
    }
  }, [])

  if (authState === 'loading') {
    return <main className="employee-screen">Loading PayDay+...</main>
  }

  if (authState === 'error') {
    return (
      <main className="employee-screen">
        <h1>Open in LINE</h1>
        <p>PayDay+ needs LINE to verify your employee account.</p>
      </main>
    )
  }

  return children
}
