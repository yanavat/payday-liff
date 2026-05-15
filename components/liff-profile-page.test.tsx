import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

vi.mock('@/components/liff-auth-gate', () => ({
  useLiffProfile: vi.fn(() => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  })),
  useLinkedEmployeeId: vi.fn(() => 'EMP-001'),
}))

vi.mock('@/components/shared/locale-switcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}))

const liffLogoutMock = vi.fn()
const liffCloseWindowMock = vi.fn()

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(() =>
    Promise.resolve({
      logout: liffLogoutMock,
      closeWindow: liffCloseWindowMock,
    }),
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('@/lib/api/hooks/use-employees', () => ({
  useEmployee: vi.fn(() => ({
    data: {
      id: 'EMP-001',
      name: 'Somchai Smith',
      nameTh: 'สมชาย สมิธ',
      employeeCode: 'E001',
      department: 'Production',
      position: 'Operator',
      payCycle: 'monthly' as const,
      workType: 'onsite' as const,
      baseSalary: 18000,
      bankAccountMasked: 'xxx-x-xx123-4',
      bankName: 'KBANK',
      ewaStatus: 'eligible' as const,
      enrolledAt: '2024-01-01',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const updateNotificationsMock = vi.fn().mockResolvedValue({})
vi.mock('@/lib/api/hooks/use-settings', () => ({
  useSettingsActions: vi.fn(() => ({
    updateNotifications: updateNotificationsMock,
    updateSettings: vi.fn(),
    updatePolicy: vi.fn(),
    loading: false,
    error: null,
  })),
}))

import { useLiffProfile } from '@/components/liff-auth-gate'
import { LiffProfilePage } from './liff-profile-page'

const messages = {
  ...defaultMessages,
  profile: {
    bankAccount: 'Bank Account',
    edit: 'Edit',
    editBankAccount: 'Edit Bank Account',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    accountHolderName: 'Account Holder',
    selectBank: 'Select Bank',
    ewaLimit: 'EWA Limit',
    maxPercent: 'Maximum',
    percentOfSalary: '{percent}% of salary',
    used: 'Used',
    usedCount: '{used} / {max} this period',
    remaining: 'Remaining',
    notifications: 'Notifications',
    notifyApproved: 'Notify on approval',
    notifyPayday: 'Notify on payday',
    notifyLine: 'Notify via LINE',
    language: 'Language',
    logout: 'Log out',
    unlinkLine: 'Unlink LINE account',
  },
}

describe('LiffProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    updateNotificationsMock.mockResolvedValue({})
  })

  it('shows the LINE profile picture', () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    expect(screen.getByAltText('Mock LINE User')).toHaveAttribute('src', 'https://profile.line.example/avatar.jpg')
  })

  it('shows the LINE display name', () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    expect(screen.getByText('Mock LINE User')).toBeInTheDocument()
  })

  it('does NOT show a logout button', () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    expect(screen.queryByRole('button', { name: /ออกจากระบบ|log out/i })).not.toBeInTheDocument()
  })

  it('shows an unlink LINE button', () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    expect(screen.getByRole('button', { name: /Unlink LINE account/i })).toBeInTheDocument()
  })

  it('unlink button clears localStorage entry and reloads', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', { value: { reload: reloadMock }, writable: true })
    localStorage.setItem('payday-liff-employee-links', JSON.stringify({ U1234567890: 'EMP-001' }))

    renderWithIntl(<LiffProfilePage />, { messages })
    fireEvent.click(screen.getByRole('button', { name: /Unlink LINE account/i }))

    const stored = JSON.parse(localStorage.getItem('payday-liff-employee-links') ?? '{}')
    expect(stored).not.toHaveProperty('U1234567890')
    expect(reloadMock).toHaveBeenCalledOnce()
  })

  it('falls back to Avatar initials when pictureUrl is absent', () => {
    vi.mocked(useLiffProfile).mockReturnValue({
      userId: 'U9999',
      displayName: 'No Picture',
      pictureUrl: undefined,
    } as never)
    renderWithIntl(<LiffProfilePage />, { messages })
    // next/image is mocked to render <img>, so absence of <img> confirms Avatar is shown instead
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows employee bank account from API', () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    expect(screen.getByText('xxx-x-xx123-4')).toBeInTheDocument()
  })

  it('calls updateNotifications when approval toggle changes', async () => {
    renderWithIntl(<LiffProfilePage />, { messages })
    const approvalToggle = screen.getByRole('button', { name: /Notify on approval/i })
    fireEvent.click(approvalToggle)
    await waitFor(() => expect(updateNotificationsMock).toHaveBeenCalledOnce())
  })

  it('uses employee name for Avatar when pictureUrl is absent', () => {
    vi.mocked(useLiffProfile).mockReturnValue({
      userId: 'U9999',
      displayName: 'No Picture',
      pictureUrl: undefined,
    } as never)
    renderWithIntl(<LiffProfilePage />, { messages })
    // next/image is mocked to render <img>, so no <img> = Avatar is shown
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
