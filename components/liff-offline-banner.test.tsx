// components/liff-offline-banner.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/liff-client', () => ({
  loadLiffClient: vi.fn(),
}))

import { loadLiffClient } from '@/lib/liff-client'
import { LiffOfflineBanner } from './liff-offline-banner'

const mockLoadLiffClient = vi.mocked(loadLiffClient)

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(() => {
  setOnline(true)
  mockLoadLiffClient.mockResolvedValue({ isInClient: () => true } as never)
})

afterEach(() => {
  setOnline(true)
})

describe('LiffOfflineBanner', () => {
  it('renders nothing when online and in LINE client', async () => {
    const { container } = render(<LiffOfflineBanner />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('shows wifi-off banner when navigator.onLine is false', async () => {
    setOnline(false)
    render(<LiffOfflineBanner />)
    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่มีอินเทอร์เน็ต')
  })

  it('shows open-in-LINE banner when online but not in LINE client', async () => {
    mockLoadLiffClient.mockResolvedValue({ isInClient: () => false } as never)
    render(<LiffOfflineBanner />)
    expect(await screen.findByText('เปิดใน LINE เพื่อใช้งานได้ครบถ้วน')).toBeInTheDocument()
  })

  it('wifi-off banner takes priority over not-in-client', async () => {
    setOnline(false)
    mockLoadLiffClient.mockResolvedValue({ isInClient: () => false } as never)
    render(<LiffOfflineBanner />)
    expect(await screen.findByText('ไม่มีอินเทอร์เน็ต')).toBeInTheDocument()
    expect(screen.queryByText('เปิดใน LINE เพื่อใช้งานได้ครบถ้วน')).not.toBeInTheDocument()
  })
})
