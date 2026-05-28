import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'
import type { EWAHistoryRequestDto } from '@/lib/api/types'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/history'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockRequests: EWAHistoryRequestDto[] = [
  {
    id: 'EWA-2025-000014',
    companyId: 'COMP-001',
    employeeId: 'EMP-001',
    status: 'disbursed',
    requestedAt: '2026-05-10T08:00:00.000Z',
    amount: 4000,
    requestedAmount: 4000,
    referenceNumber: 'REF-20260510-0014',
    reason: 'emergency',
    transferFee: 15,
    netTransferAmount: 3985,
    netAmount: 3985,
    hrNote: '',
    employeeNote: '',
    earnedToDate: 12000,
    maxWithdrawable: 6000,
    periodLabel: 'May 2026',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    workedDays: 10,
    payCycle: 'monthly',
    isOnBehalf: false,
    autoApproved: true,
    actorId: 'EMP-001',
    actorName: 'Somchai Smith',
    approvedBy: 'System',
    approvedAt: '2026-05-10T08:01:00.000Z',
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    disbursedAt: '2026-05-10T09:00:00.000Z',
    createdAt: '2026-05-10T08:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
  },
]

const backendHistoryRequest: EWAHistoryRequestDto = {
  id: 'EWA-20260528-0001-918',
  companyId: 'COMP-001',
  employeeId: 'EMP-0001',
  status: 'pending',
  requestedAmount: 1100,
  transferFee: 15,
  netAmount: 1085,
  earnedToDate: 18409,
  maxWithdrawable: 9204,
  periodLabel: 'May 2026',
  periodStart: '2026-05-01',
  periodEnd: '2026-05-31',
  workedDays: 9,
  isOnBehalf: false,
  autoApproved: false,
  actorId: 'EMP-0001',
  actorName: 'อนันต์ ศรีสุวรรณ',
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  disbursedAt: null,
  createdAt: '2026-05-27T17:19:50.000Z',
  updatedAt: '2026-05-27T17:19:50.000Z',
}

const useEWARequestsMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/liff-auth-gate', () => ({
  useAuth: () => ({
    employee: { id: 'EMP-001', employeeCode: 'EMP-001' },
  }),
}))

vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployee: () => ({
    data: { bankAccountMasked: 'xxx-x-xx123-4' },
  }),
}))

vi.mock('@/lib/api/hooks/use-ewa-requests', () => ({
  useEWARequests: useEWARequestsMock,
}))

import { useSearchParams } from 'next/navigation'
import { LiffHistoryPage } from './liff-history-page'

const mockUseSearchParams = vi.mocked(useSearchParams)

const messages = {
  ...defaultMessages,
  history: {
    title: 'Withdrawal History',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    total: 'Total',
    requestedDate: 'Requested',
    approvedDate: 'Approved',
    transferDate: 'Transferred',
    approvedBy: 'Approved By',
    exportPaySlip: 'Export pay slip PDF',
    transferFee: 'Transfer Fee',
    netTransferAmount: 'Net Transfer Amount',
    requestCount: '{count} requests',
  },
  requests: { title: 'EWA Request' },
  requestDetail: { hrNote: 'HR note' },
  profile: { bankAccount: 'Bank account' },
  requestWizard: {
    ...defaultMessages.requestWizard,
    step1: 'Select Amount',
    reasons: {
      emergency: 'Emergency',
      medical: 'Medical expenses',
      education: 'Education',
      utility: 'Utilities',
      other: 'Other',
    },
  },
  home: { requestCta: 'Make a request' },
}

describe('LiffHistoryPage', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as never)
    useEWARequestsMock.mockReturnValue({
      data: { data: mockRequests, total: 1, limit: 10, offset: 0 },
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    })
  })

  it('renders the history title', () => {
    renderWithIntl(<LiffHistoryPage />, { messages })
    expect(screen.getByRole('heading', { name: 'Withdrawal History' })).toBeInTheDocument()
  })

  it('loads history requests from the backend hook for the authenticated employee', () => {
    renderWithIntl(<LiffHistoryPage />, { messages })

    expect(useEWARequestsMock).toHaveBeenCalledWith({ employeeId: 'EMP-001', limit: 10 })
    expect(screen.getByText('REF-20260510-0014')).toBeInTheDocument()
    expect(screen.getAllByText('฿4,000').length).toBeGreaterThan(0)
  })

  it('renders the real backend history response shape', () => {
    useEWARequestsMock.mockReturnValue({
      data: {
        data: [backendHistoryRequest],
        total: 1,
        limit: 10,
        offset: 0,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    })

    renderWithIntl(<LiffHistoryPage />, { messages })

    expect(screen.getByText('EWA-20260528-0001-918')).toBeInTheDocument()
    expect(screen.getAllByText('฿1,100').length).toBeGreaterThan(0)
    expect(screen.queryByText('requestWizard.reasons.undefined')).not.toBeInTheDocument()
  })

  it('does not crash when backend request date fields are missing or invalid', () => {
    useEWARequestsMock.mockReturnValue({
      data: {
        data: [
          {
            ...mockRequests[0],
            id: 'EWA-BAD-DATE',
            requestedAt: '',
            createdAt: 'not-a-date',
            referenceNumber: 'REF-BAD-DATE',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    })

    renderWithIntl(<LiffHistoryPage />, { messages })

    expect(screen.getByText('REF-BAD-DATE')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('does not build an undefined translation key when backend omits reason', () => {
    useEWARequestsMock.mockReturnValue({
      data: {
        data: [
          {
            ...mockRequests[0],
            id: 'EWA-NO-REASON',
            referenceNumber: 'REF-NO-REASON',
            reason: undefined,
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
      retry: vi.fn(),
    })

    renderWithIntl(<LiffHistoryPage />, { messages })

    expect(screen.getByText('REF-NO-REASON')).toBeInTheDocument()
    expect(screen.queryByText('requestWizard.reasons.undefined')).not.toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('does NOT show export pay slip PDF button even when a card is expanded', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('id=EWA-2025-000014') as never)
    renderWithIntl(<LiffHistoryPage />, { messages })
    // Card IS expanded (Transfer Fee detail row is visible)
    expect(screen.getByText('Transfer Fee')).toBeInTheDocument()
    // But no PDF export button
    expect(screen.queryByRole('button', { name: /Export pay slip PDF/i })).not.toBeInTheDocument()
  })

  it('auto-expands the card matching the deep-link ?id param', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('id=EWA-2025-000014') as never)
    renderWithIntl(<LiffHistoryPage />, { messages })
    expect(screen.getByText('Transfer Fee')).toBeInTheDocument()
  })

  it('does not auto-expand anything when deep-link id does not match', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('id=NONEXISTENT') as never)
    renderWithIntl(<LiffHistoryPage />, { messages })
    expect(screen.queryByText('Transfer Fee')).not.toBeInTheDocument()
  })
})
