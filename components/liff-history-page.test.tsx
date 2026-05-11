import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
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
  it('renders the history title', () => {
    renderWithIntl(<LiffHistoryPage />, { messages })
    expect(screen.getByRole('heading', { name: 'Withdrawal History' })).toBeInTheDocument()
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
