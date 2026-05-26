import { screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const refetchPeriodMock = vi.fn()
const refetchRequestsMock = vi.fn()
const useAuthMock = vi.hoisted(() =>
  vi.fn(() => ({
    employee: { id: 'EMP-001', employeeCode: 'EMP-001' },
    isInLiff: true,
  })),
)

vi.mock('@/components/liff-auth-gate', () => ({
  useAuth: useAuthMock,
  useLiffProfile: vi.fn(() => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  })),
}))

vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployeeCurrentPeriod: vi.fn(() => ({
    data: {
      label: 'May 2026',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      payDate: '2026-05-31',
      cutoffDate: '2026-05-25',
      workedDays: 14,
      totalWorkDays: 22,
      earnedToDate: 9200,
      previousEWAThisPeriod: 1100,
      maxWithdrawable: 4600,
      usedRequests: 1,
      remainingRequests: 1,
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

import { useEWARequests } from '@/lib/api/hooks/use-ewa-requests'
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
    useAuthMock.mockReturnValue({
      employee: { id: 'EMP-001', employeeCode: 'EMP-001' },
      isInLiff: true,
    })
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

  it('uses avatar fallback instead of LINE picture outside LIFF', () => {
    useAuthMock.mockReturnValue({
      employee: { id: 'EMP-001', employeeCode: 'EMP-001' },
      isInLiff: false,
    })

    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.queryByAltText('Mock LINE User')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Mock LINE User')).toBeInTheDocument()
  })

  it('renders the available balance from currentPeriod API data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    // available = maxWithdrawable (4600) - previousEWAThisPeriod (1100) = 3500
    expect(screen.getAllByText('฿3,500').length).toBeGreaterThan(0)
  })

  it('renders pay period progress from currentPeriod data', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })
    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(screen.getByText('Day 14 / 22')).toBeInTheDocument()
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

  it('renders recent requests from backend EWA shape', () => {
    vi.mocked(useEWARequests).mockReturnValue({
      data: {
        data: [
          {
            id: 'EWA-20260310-0001-763',
            companyId: 'COMP-001',
            employeeId: 'EMP-0001',
            status: 'disbursed',
            requestedAmount: 4000,
            transferFee: 15,
            netAmount: 3985,
            earnedToDate: 30682,
            maxWithdrawable: 15341,
            periodLabel: 'March 2026',
            periodStart: '2026-03-01',
            periodEnd: '2026-03-31',
            workedDays: 15,
            isOnBehalf: false,
            autoApproved: true,
            actorId: 'EMP-0001',
            actorName: 'Anan Srisuwan',
            approvedBy: 'system',
            approvedAt: '2026-03-10T00:00:00.000Z',
            rejectedBy: null,
            rejectedAt: null,
            rejectionReason: null,
            disbursedAt: '2026-03-11T00:00:00.000Z',
            createdAt: '2026-05-12T05:46:44.000Z',
            updatedAt: '2026-05-12T05:46:44.000Z',
          },
        ],
        total: 1,
        limit: 3,
        offset: 0,
      },
      loading: false,
      error: null,
      refetch: refetchRequestsMock,
    })

    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.getByText('EWA-20260310-0001-763')).toBeInTheDocument()
    expect(screen.getByText('฿4,000')).toBeInTheDocument()
    expect(screen.getByText('Disbursed')).toBeInTheDocument()
  })
})
