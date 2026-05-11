import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'
import { loadLiffClient } from '@/lib/liff-client'

const { confettiMock } = vi.hoisted(() => ({ confettiMock: vi.fn() }))
vi.mock('canvas-confetti', () => ({ default: confettiMock }))

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(() => Promise.resolve({ isInClient: () => false, shareTargetPicker: vi.fn() })),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className, style }: { href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <a href={href} className={className} style={style}>{children}</a>
  ),
}))

import { LiffRequestPage } from './liff-request-page'

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    next: 'Next',
    error: 'An error occurred',
    confirm: 'Confirm',
    employeeName: 'Employee Name',
    employeeId: 'Employee ID',
    requestDate: 'Request Date',
    status: 'Status',
    success: 'Your request has been submitted',
  },
  requestWizard: {
    step1: 'Select Amount',
    step2: 'Confirm',
    step3: 'Done',
    availableBalance: 'Available Balance',
    customAmount: 'Custom Amount',
    amountError: 'Amount exceeds your limit',
    remainingBalance: 'Remaining balance',
    reason: 'Reason',
    reasons: {
      emergency: 'Emergency',
      medical: 'Medical expenses',
      education: 'Education',
      utility: 'Utilities',
      other: 'Other',
    },
    summaryCard: 'Summary',
    requestedAmount: 'Requested Amount',
    transferFee: 'Transfer Fee',
    netTransferAmount: 'Net Transfer Amount',
    bankAccount: 'Bank Account',
    deductionWarning: 'Will be deducted on {date}',
    enterPin: 'Confirm with PIN',
    editBack: 'Edit',
    successTitle: 'Request Submitted!',
    referenceNumber: 'Reference Number',
    backToHome: 'Back to Home',
    shareReceipt: 'Share Receipt',
    withdrawAll: 'Withdraw All',
  },
}

function goToStep2() {
  fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
}

describe('LiffRequestPage — step 1', () => {
  beforeEach(() => renderWithIntl(<LiffRequestPage />, { messages }))

  it('shows available balance', () => {
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('฿3,500')).toBeInTheDocument()
  })

  it('renders quick amount buttons', () => {
    expect(screen.getByRole('button', { name: '฿1,000' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '฿2,000' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '฿3,000' })).toBeInTheDocument()
  })

  it('disables Next button when amount is invalid', () => {
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '9999' } })
    expect(screen.getByRole('button', { name: /Next →/i })).toBeDisabled()
  })

  it('advances to step 2 with valid amount', () => {
    goToStep2()
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })
})

describe('LiffRequestPage — step 2 OTP', () => {
  beforeEach(() => {
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
  })

  it('shows OTP input instead of PIN pad', () => {
    expect(screen.queryByTestId('pin-pad')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
  })

  it('shows OTP label', () => {
    expect(screen.getByText('รหัสยืนยัน (OTP)')).toBeInTheDocument()
  })

  it('Confirm button is disabled until 6 digits are entered', () => {
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } })
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled()
  })

  it('shows error and stays on step 2 when wrong OTP is entered', () => {
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(screen.getByText('รหัสไม่ถูกต้อง')).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })

  it('advances to step 3 with correct OTP 000000', () => {
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(screen.getByText('Request Submitted!')).toBeInTheDocument()
  })

  it('back button returns to step 1', () => {
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
  })
})

describe('LiffRequestPage — step 3 success', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  })

  afterEach(() => {
    vi.useRealTimers()
    confettiMock.mockClear()
  })

  it('shows success title and receipt', () => {
    expect(screen.getByText('Request Submitted!')).toBeInTheDocument()
    expect(screen.getByText('Reference Number')).toBeInTheDocument()
  })

  it('back-to-home link points to LIFF root', () => {
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('hides share button when not in LINE client', () => {
    expect(screen.queryByRole('button', { name: /Share Receipt/i })).not.toBeInTheDocument()
  })

  it('fires confetti after 300ms', async () => {
    await vi.advanceTimersByTimeAsync(400)
    expect(confettiMock).toHaveBeenCalledTimes(2)
  })

  it('shows share button and calls shareTargetPicker when in LINE client', async () => {
    // Restore real timers for this test so async promise resolution works
    vi.useRealTimers()
    const shareTargetPickerMock = vi.fn().mockResolvedValue(undefined)
    const inClientLiff = {
      isInClient: () => true,
      shareTargetPicker: shareTargetPickerMock,
    } as never
    // First call: useEffect (isInClient detection); second call: handleShare
    vi.mocked(loadLiffClient)
      .mockResolvedValueOnce(inClientLiff)
      .mockResolvedValueOnce(inClientLiff)
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    // wait for the isInClient effect to resolve and the share button to appear
    await screen.findByRole('button', { name: /Share Receipt/i })
    fireEvent.click(screen.getByRole('button', { name: /Share Receipt/i }))
    await vi.waitFor(() => expect(shareTargetPickerMock).toHaveBeenCalledTimes(1))
  })
})
