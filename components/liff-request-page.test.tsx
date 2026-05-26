import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const { confettiMock, createMock, previewMock } = vi.hoisted(() => ({
  confettiMock: vi.fn(),
  createMock: vi.fn(),
  previewMock: vi.fn(),
}))
vi.mock('canvas-confetti', () => ({ default: confettiMock }))

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(() => Promise.resolve({ isInClient: () => false, shareTargetPicker: vi.fn() })),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className, style }: { href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <a href={href} className={className} style={style}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}))

vi.mock('@/lib/api/services/otp', () => ({
  sendCode: vi.fn().mockResolvedValue({ codeId: 'test-code-id', expiresAt: new Date(Date.now() + 300_000).toISOString() }),
  verifyCode: vi.fn().mockImplementation(async (_codeId: string, code: string) => ({
    valid: code === '123456',
  })),
}))

vi.mock('@/components/liff-auth-gate', () => ({
  useAuth: () => ({
    employee: { id: 'EMP-001', employeeCode: 'EMP-001' },
    isInLiff: false,
  }),
  useLiffProfile: () => ({
    userId: 'U123',
    displayName: 'Test User',
  }),
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
  })),
  useEmployee: vi.fn(() => ({
    data: {
      id: 'EMP-001',
      nameTh: 'สมชาย ใจดี',
      employeeCode: 'EMP-001',
      bankAccountMasked: 'xxx-x-xx123-4',
    },
    loading: false,
    error: null,
  })),
}))

vi.mock('@/lib/api/hooks/use-ewa-requests', () => ({
  usePreviewEWARequest: vi.fn(() => ({
    preview: previewMock,
    loading: false,
    error: null,
  })),
  useEWARequestActions: vi.fn(() => ({
    create: createMock,
    loading: false,
    error: null,
  })),
}))

import { sendCode, verifyCode } from '@/lib/api/services/otp'
import { LiffRequestPage } from './liff-request-page'

const previewResult = {
  requestedAmount: 3000,
  transferFee: 15,
  netAmount: 2985,
  policy: { minAmount: 500, maxAmount: 10000, maxPercent: 50, maxRequests: 2 },
}

const createdRequest = {
  id: 'EWA-20260525-001',
  companyId: 'co-1',
  employeeId: 'EMP-001',
  status: 'pending' as const,
  requestedAmount: 3000,
  transferFee: 15,
  netAmount: 2985,
  earnedToDate: 9200,
  maxWithdrawable: 4600,
  periodLabel: 'May 2026',
  periodStart: '2026-05-01',
  periodEnd: '2026-05-31',
  workedDays: 14,
  isOnBehalf: false,
  autoApproved: false,
  actorId: 'EMP-001',
  actorName: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  disbursedAt: null,
  createdAt: '2026-05-25T09:32:00.000Z',
  updatedAt: '2026-05-25T09:32:00.000Z',
}

const messages = {
  ...defaultMessages,
  common: {
    ...defaultMessages.common,
    next: 'Next',
    error: 'An error occurred',
    errorLoadingData: 'Could not load data',
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
  beforeEach(() => {
    previewMock.mockResolvedValue(previewResult)
    renderWithIntl(<LiffRequestPage />, { messages })
  })

  it('shows available balance from current period', () => {
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

  it('advances to step 2 with valid amount', async () => {
    goToStep2()
    await waitFor(() => expect(screen.getByText('Summary')).toBeInTheDocument())
  })
})

describe('LiffRequestPage — step 2 OTP', () => {
  beforeEach(async () => {
    vi.mocked(sendCode).mockClear()
    vi.mocked(verifyCode).mockClear()
    createMock.mockReset()
    previewMock.mockResolvedValue(previewResult)
    createMock.mockResolvedValue(createdRequest)
    renderWithIntl(<LiffRequestPage />, { messages })
    goToStep2()
    await waitFor(() => expect(previewMock).toHaveBeenCalled())
  })

  it('calls sendCode with the employee ID when entering step 2', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalledWith('EMP-001'))
  })

  it('previews the request with employeeId and amount', () => {
    expect(previewMock).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'EMP-001', amount: 3000 }),
    )
  })

  it('shows employee name from API in summary', async () => {
    await waitFor(() => {
      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    })
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
    expect(createMock).not.toHaveBeenCalled()
  })

  it('creates EWA request and advances to step 3 with correct OTP', async () => {
    await waitFor(() => expect(sendCode).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 3000, reason: 'medical' }),
    ))
    expect(createMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'EMP-001' }),
    )
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
    createMock.mockReset()
    previewMock.mockResolvedValue(previewResult)
    createMock.mockResolvedValue(createdRequest)
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

  it('shows success title and receipt with API reference id', () => {
    expect(screen.getByText('Request Submitted!')).toBeInTheDocument()
    expect(screen.getByText('EWA-20260525-001')).toBeInTheDocument()
  })

  it('back-to-home link points to LIFF root', () => {
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/en')
  })

  it('hides share button when not in LINE client', () => {
    expect(screen.queryByRole('button', { name: /Share Receipt/i })).not.toBeInTheDocument()
  })
})
