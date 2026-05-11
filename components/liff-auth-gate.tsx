'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

import { loadLiffClient } from '@/lib/liff-client'

type AuthState = 'loading' | 'ready' | 'linking' | 'external' | 'error'
export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

const EMPLOYEE_LINKS_STORAGE_KEY = 'payday-liff-employee-links'
const LiffProfileContext = createContext<LiffProfile | null>(null)

export function useLiffProfile() {
  return useContext(LiffProfileContext)
}

export function LIFFAuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [profile, setProfile] = useState<LiffProfile | null>(null)
  const [lineUserId, setLineUserId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const isMockMode = process.env.NEXT_PUBLIC_LIFF_MOCK === 'true'

  useEffect(() => {
    let cancelled = false

    async function initializeLiff() {
      try {
        const liff = await loadLiffClient()

        if (!liffId && !isMockMode) {
          throw new Error('NEXT_PUBLIC_LIFF_ID is required')
        }

        await liff.init({ liffId: liffId ?? 'mock-liff-id' })

        if (!isMockMode && !liff.isInClient()) {
          if (!cancelled) {
            setAuthState('external')
          }
          return
        }

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()

        if (!getLinkedEmployeeId(profile.userId)) {
          if (!cancelled) {
            setProfile(profile)
            setLineUserId(profile.userId)
            setAuthState('linking')
          }
          return
        }

        if (!cancelled) {
          setProfile(profile)
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
  }, [isMockMode, liffId])

  function handleLinkEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmployeeId = employeeId.trim()
    if (!trimmedEmployeeId || !lineUserId) {
      return
    }

    saveLinkedEmployeeId(lineUserId, trimmedEmployeeId)
    setAuthState('ready')
  }

  if (authState === 'loading') {
    return <main className="employee-screen p-5">Loading PayDay+...</main>
  }

  if (authState === 'external') {
    return (
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">Open in LINE</h1>
        <p className="mt-2 text-text-secondary">PayDay+ needs LINE to verify your employee account.</p>
        <a
          className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 font-medium text-white"
          href={`https://liff.line.me/${liffId}`}
        >
          Open in LINE
        </a>
      </main>
    )
  }

  if (authState === 'linking') {
    return (
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">Link employee account</h1>
        <p className="mt-2 text-text-secondary">Enter your employee ID once to connect PayDay+ with your LINE account.</p>
        <form className="mt-6 space-y-4" onSubmit={handleLinkEmployee}>
          <label className="block text-sm font-medium text-text-primary" htmlFor="employee-id">
            Employee ID
          </label>
          <input
            className="h-12 w-full rounded-md border border-border bg-bg-canvas px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            id="employee-id"
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder="EMP-0001"
            value={employeeId}
          />
          <button
            className="h-12 w-full rounded-md bg-primary px-5 font-medium text-white disabled:opacity-50"
            disabled={!employeeId.trim()}
            type="submit"
          >
            Link account
          </button>
        </form>
      </main>
    )
  }

  if (authState === 'error') {
    return (
      <main className="employee-screen p-5">
        <h1 className="text-2xl font-semibold">Open in LINE</h1>
        <p className="mt-2 text-text-secondary">PayDay+ needs LINE to verify your employee account.</p>
        {liffId ? (
          <a
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-5 font-medium text-white"
            href={`https://liff.line.me/${liffId}`}
          >
            Open in LINE
          </a>
        ) : null}
      </main>
    )
  }

  return <LiffProfileContext.Provider value={profile}>{children}</LiffProfileContext.Provider>
}

function getLinkedEmployeeId(lineUserId: string): string | null {
  return readEmployeeLinks()[lineUserId] ?? null
}

function saveLinkedEmployeeId(lineUserId: string, employeeId: string) {
  const links = readEmployeeLinks()
  links[lineUserId] = employeeId
  localStorage.setItem(EMPLOYEE_LINKS_STORAGE_KEY, JSON.stringify(links))
}

function readEmployeeLinks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(EMPLOYEE_LINKS_STORAGE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}
