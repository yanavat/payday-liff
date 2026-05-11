import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl, defaultMessages } from '@/tests/i18n/test-utils'

const usePathnameMock = vi.fn(() => '/')

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
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
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/')
  })

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

  it('keeps locale-prefixed links and active state after language switch', () => {
    usePathnameMock.mockReturnValue('/en/profile')

    renderWithIntl(<LiffBottomTabBar />, { messages })

    expect(screen.getByRole('link', { name: /หน้าหลัก/i })).toHaveAttribute('href', '/en')
    expect(screen.getByRole('link', { name: /เบิกเงิน/i })).toHaveAttribute('href', '/en/request')
    expect(screen.getByRole('link', { name: /ประวัติ/i })).toHaveAttribute('href', '/en/history')
    expect(screen.getByRole('link', { name: /โปรไฟล์/i })).toHaveAttribute('href', '/en/profile')
    expect(screen.getByRole('link', { name: /โปรไฟล์/i })).toHaveAttribute('aria-current', 'page')
  })
})
