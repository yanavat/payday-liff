import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

import { LiffBottomTabBar } from './liff-bottom-tab-bar'

const messages = {
  ...defaultMessages,
  nav: {
    home: 'หน้าหลัก',
    request: 'เบิกเงิน',
    history: 'ประวัติ',
    profile: 'โปรไฟล์',
  },
}

describe('LiffBottomTabBar', () => {
  it('renders links to all four LIFF routes', () => {
    renderWithIntl(<LiffBottomTabBar />, { messages })
    expect(screen.getByRole('link', { name: /หน้าหลัก/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /เบิกเงิน/i })).toHaveAttribute('href', '/request')
    expect(screen.getByRole('link', { name: /ประวัติ/i })).toHaveAttribute('href', '/history')
    expect(screen.getByRole('link', { name: /โปรไฟล์/i })).toHaveAttribute('href', '/profile')
  })

  it('marks the home tab active on the root path', () => {
    renderWithIntl(<LiffBottomTabBar />, { messages })
    expect(screen.getByRole('link', { name: /หน้าหลัก/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /เบิกเงิน/i })).not.toHaveAttribute('aria-current')
  })
})
