import { screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const refetchPeriodMock = vi.fn()
const refetchRequestsMock = vi.fn()

vi.mock('@/components/liff-auth-gate', () => ({
  useLiffProfile: vi.fn(() => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  })),
  useLinkedEmployeeId: vi.fn(() => 'EMP-001'),
}))

vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployeeCurrentPeriod: vi.fn(() => ({
    data: {
      type: 'monthly',
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      paydayDate: '2026-05-31',
      cutoffDate: '2026-05-25',
      daysElapsed: 14,
      totalDays: 31,
      earnedToDate: 9200,
      workedDays: 14,
      totalWorkDays: 31,
      previousEWAThisPeriod: 1100,
      maxWithdrawable: 4600,
    },
    loading: false,
    error: null,
    refetch: refetchPeriodMock,
  })),
}))

vi.mock('@/lib/api/hooks/use-ewa-requests', () => ({
  useEWARequests: vi.fn(() => ({
    data: { data: [], total: 0, limit: 3, offset: 0 },
    loading: false,
    error: null,
    refetch: refetchRequestsMock,
  })),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { LiffHomePage } from './liff-home-page'

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    viewAll: 'View all',
  },
  home: {
    greeting: 'Hello, {name}',
    heroTitle: 'Available Balance',
    requestCta: 'Request Advance',
    payPeriod: 'Pay Period',
    cutoffWarning: 'Cutoff in {days} days',
    paydayCountdown: 'Payday in {days} days',
    recentRequests: 'Recent Requests',
    viewAllHistory: 'View all history',
    earnedWage: 'Earned wage',
    maxAllowed: 'Max allowed',
    previousAdvance: 'Withdrawn',
    remaining: 'Remaining',
    dayProgress: 'Day {elapsed} / {total}',
    requestItemTitle: 'Advance request',
    loading: 'Loading...',
  },
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
    all: 'All',
  },
  nav: {
    profile: 'Profile',
  },
}

describe('LiffHomePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    refetchPeriodMock.mockClear()
    refetchRequestsMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the employee home screen with the LINE profile picture', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.getByRole('heading', { name: 'Hello, Mock LINE User' })).toBeInTheDocument()
    expect(screen.getByAltText('Mock LINE User')).toHaveAttribute('src', 'https://profile.line.example/avatar.jpg')
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('Recent Requests')).toBeInTheDocument()
  })

  it('renders the available balance from currentPeriod API data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    // available = maxWithdrawable (4600) - previousEWAThisPeriod (1100) = 3500
    expect(screen.getAllByText('฿3,500').length).toBeGreaterThan(0)
  })

  it('renders pay period progress from currentPeriod data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    expect(screen.getByText('Day 14 / 31')).toBeInTheDocument()
  })

  it('sets up a 30-second polling interval on mount', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(refetchPeriodMock).toHaveBeenCalledTimes(1)
    expect(refetchRequestsMock).toHaveBeenCalledTimes(1)
  })

  it('clears polling interval on unmount', () => {
    const { unmount } = renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    unmount()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(refetchPeriodMock).toHaveBeenCalledTimes(0)
    expect(refetchRequestsMock).toHaveBeenCalledTimes(0)
  })

  it('does not render hardcoded Thai copy when locale is English', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    expect(screen.queryByText('วงเงินที่เบิกได้')).not.toBeInTheDocument()
  })
})
