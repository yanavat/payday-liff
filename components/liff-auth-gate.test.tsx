import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LiffClient } from '@/lib/liff-client'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

import { LIFFAuthGate, useLiffProfile } from './liff-auth-gate'

const loadLiffClientMock = vi.fn()

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: () => loadLiffClientMock(),
}))

function createLiffClient(overrides: Partial<LiffClient> = {}): LiffClient {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn(() => true),
    login: vi.fn(),
    isInClient: vi.fn(() => true),
    getProfile: vi.fn().mockResolvedValue({
      userId: 'U1234567890',
      displayName: 'Mock LINE User',
      pictureUrl: undefined,
      statusMessage: undefined,
    }),
    ...overrides,
  } as unknown as LiffClient
}

const messages = {
  ...defaultMessages,
  liff: {
    loading: 'Loading PayDay+...',
    openInLine: 'Open in LINE',
    openInLineDescription: 'PayDay+ needs LINE to verify your employee account.',
    openInLineButton: 'Open in LINE',
    linkTitle: 'Link employee account',
    linkDescription: 'Enter your employee ID once to connect PayDay+ with your LINE account.',
    employeeIdLabel: 'Employee ID',
    employeeIdPlaceholder: 'EMP-0001',
    linkButton: 'Link account',
    offlineMessage: 'No internet connection',
    externalBrowserMessage: 'Open in LINE for the full experience',
  },
}

function renderGate(children = <p>Employee app</p>) {
  return renderWithIntl(<LIFFAuthGate>{children}</LIFFAuthGate>, { messages })
}

describe('LIFFAuthGate', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', 'test-liff-id')
    vi.stubEnv('NEXT_PUBLIC_LIFF_MOCK', 'false')
    loadLiffClientMock.mockResolvedValue(createLiffClient())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('asks first-time LINE users to link an employee ID', async () => {
    renderGate()

    expect(await screen.findByRole('heading', { name: 'Link employee account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Employee ID')).toBeInTheDocument()
    expect(screen.queryByText('Employee app')).not.toBeInTheDocument()
  })

  it('saves the employee link and then shows the app', async () => {
    renderGate()

    fireEvent.change(await screen.findByLabelText('Employee ID'), {
      target: { value: 'EMP-0041' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Link account' }))

    await waitFor(() => {
      expect(screen.getByText('Employee app')).toBeInTheDocument()
    })
    expect(JSON.parse(localStorage.getItem('payday-liff-employee-links') ?? '{}')).toEqual({
      U1234567890: 'EMP-0041',
    })
  })

  it('shows an Open in LINE link when opened outside the LINE client', async () => {
    loadLiffClientMock.mockResolvedValue(createLiffClient({ isInClient: vi.fn(() => false) as LiffClient['isInClient'] }))

    renderGate()

    const link = await screen.findByRole('link', { name: 'Open in LINE' })

    expect(link).toHaveAttribute('href', 'https://liff.line.me/test-liff-id')
    expect(screen.queryByText('Employee app')).not.toBeInTheDocument()
  })

  it('provides the LINE profile to authenticated child components', async () => {
    localStorage.setItem('payday-liff-employee-links', JSON.stringify({ U1234567890: 'EMP-0041' }))

    function ProfileConsumer() {
      const profile = useLiffProfile()

      return <p>{profile?.pictureUrl}</p>
    }

    loadLiffClientMock.mockResolvedValue(
      createLiffClient({
        getProfile: vi.fn().mockResolvedValue({
          userId: 'U1234567890',
          displayName: 'Mock LINE User',
          pictureUrl: 'https://profile.line.example/avatar.jpg',
          statusMessage: undefined,
        }) as LiffClient['getProfile'],
      }),
    )

    renderGate(<ProfileConsumer />)

    expect(await screen.findByText('https://profile.line.example/avatar.jpg')).toBeInTheDocument()
  })
})
