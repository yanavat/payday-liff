import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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

vi.mock('@/lib/api/services/otp', () => ({
  sendCode: vi.fn().mockResolvedValue({ codeId: 'test-code-id', expiresAt: new Date(Date.now() + 300_000).toISOString() }),
  verifyCode: vi.fn().mockImplementation(async (_codeId: string, code: string) => ({
    valid: code === '123456',
  })),
}))

vi.mock('@/components/liff-auth-gate', () => ({
  useLiffProfile: () => null,
  useLinkedEmployeeId: () => 'EMP-001',
}))

import { sendCode, verifyCode } from '@/lib/api/services/otp'
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
    shareReceiptText: 'Advance request submitted\nAmount: {amount}\nReference: {reference}',
    withdrawAll: 'Withdraw All',
    otpLabel: 'Confirmation code (OTP)',
    otpHint: 'Enter the code sent to you',
    invalidOtp: 'Invalid code',
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
    vi.mocked(sendCode).mockClear()
    vi.mocked(verifyCode).mockClear()
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
  })

  it('calls sendCode with the employee ID when entering step 2', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalledWith('EMP-001'))
  })

  it('shows OTP input', () => {
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
  })

  it('shows OTP label', () => {
    expect(screen.getByText('Confirmation code (OTP)')).toBeInTheDocument()
  })

  it('Confirm button is disabled until 6 digits are entered', () => {
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled()
  })

  it('shows error and stays on step 2 when wrong OTP is entered', async () => {
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Invalid code')
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })

  it('advances to step 3 with correct OTP 123456', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Request Submitted!')
  })

  it('back button returns to step 1', () => {
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(screen.getByText('Available Balance')).toBeInTheDocument()
  })
})

describe('LiffRequestPage — step 3 success', () => {
  beforeEach(async () => {
    vi.mocked(sendCode).mockClear()
    vi.mocked(verifyCode).mockClear()
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Request Submitted!')
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
})
