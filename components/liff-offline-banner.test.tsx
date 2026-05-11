// components/liff-offline-banner.test.tsx
import { screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(),
}))

import { loadLiffClient } from '@/lib/liff-client'
import { LiffOfflineBanner } from './liff-offline-banner'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const mockLoadLiffClient = vi.mocked(loadLiffClient)

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(() => {
  setOnline(true)
  mockLoadLiffClient.mockResolvedValue({ isInClient: () => true } as never)
})

afterEach(() => {
  setOnline(true)
})

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

function renderBanner() {
  return renderWithIntl(<LiffOfflineBanner />, { messages })
}

describe('LiffOfflineBanner', () => {
  it('renders nothing when online and in LINE client', async () => {
    const { container } = renderBanner()
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('shows wifi-off banner when navigator.onLine is false', async () => {
    setOnline(false)
    renderBanner()
    expect(await screen.findByRole('alert')).toHaveTextContent('No internet connection')
  })

  it('shows open-in-LINE banner when online but not in LINE client', async () => {
    mockLoadLiffClient.mockResolvedValue({ isInClient: () => false } as never)
    renderBanner()
    expect(await screen.findByText('Open in LINE for the full experience')).toBeInTheDocument()
  })

  it('wifi-off banner takes priority over not-in-client', async () => {
    setOnline(false)
    mockLoadLiffClient.mockResolvedValue({ isInClient: () => false } as never)
    renderBanner()
    expect(await screen.findByText('No internet connection')).toBeInTheDocument()
    expect(screen.queryByText('Open in LINE for the full experience')).not.toBeInTheDocument()
  })

  it('suppresses open-in-LINE banner in mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_LIFF_MOCK', 'true')
    vi.resetModules()
    const { loadLiffClient: freshLoadLiffClient } = await import('@/lib/liff-client')
    vi.mocked(freshLoadLiffClient).mockResolvedValue({ isInClient: () => false } as never)
    const { LiffOfflineBanner: FreshBanner } = await import('./liff-offline-banner')
    const { container } = renderWithIntl(<FreshBanner />, { messages })
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
