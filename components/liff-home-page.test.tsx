import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

vi.mock('./liff-auth-gate', () => ({
  useLiffProfile: () => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
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
  },
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
  },
  nav: {
    profile: 'Profile',
  },
}

describe('LiffHomePage', () => {
  it('renders the employee home screen with the LINE profile picture', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.getByRole('heading', { name: 'Hello, Mock LINE User' })).toBeInTheDocument()
    expect(screen.getByAltText('Mock LINE User')).toHaveAttribute('src', 'https://profile.line.example/avatar.jpg')
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('Recent Requests')).toBeInTheDocument()
    expect(screen.queryByLabelText('การแจ้งเตือน')).not.toBeInTheDocument()
  })

  it('does not render hardcoded Thai copy when locale is English', () => {
    renderWithIntl(<LiffHomePage />, { locale: 'en', messages })

    expect(screen.queryByText('วงเงินที่เบิกได้')).not.toBeInTheDocument()
    expect(screen.queryByText('คำขอล่าสุด')).not.toBeInTheDocument()
    expect(screen.queryByText('ยื่นคำขอเบิกเงิน')).not.toBeInTheDocument()
  })
})
