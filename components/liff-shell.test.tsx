import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LiffShell } from './liff-shell'

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }))
vi.mock('next-intl', () => ({ useTranslations: () => (k: string) => k }))
vi.mock('./liff-offline-banner', () => ({
  LiffOfflineBanner: () => null,
}))
vi.mock('./liff-bottom-tab-bar', () => ({
  LiffBottomTabBar: () => <nav data-testid="tab-bar" />,
}))

describe('LiffShell', () => {
  it('gives main the liff-content-area class so safe-area padding is applied via CSS', () => {
    render(<LiffShell>content</LiffShell>)
    expect(screen.getByRole('main')).toHaveClass('liff-content-area')
  })
})
