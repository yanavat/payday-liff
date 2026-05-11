import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./liff-auth-gate', () => ({
  useLiffProfile: () => ({
    userId: 'U1234567890',
    displayName: 'Mock LINE User',
    pictureUrl: 'https://profile.line.example/avatar.jpg',
  }),
}))

import { LiffHomePage } from './liff-home-page'

describe('LiffHomePage', () => {
  it('renders the employee home screen with the LINE profile picture', () => {
    render(<LiffHomePage />)

    expect(screen.getByRole('heading', { name: 'สวัสดี, สมชาย ใจดี' })).toBeInTheDocument()
    expect(screen.getByAltText('Mock LINE User')).toHaveAttribute('src', 'https://profile.line.example/avatar.jpg')
    expect(screen.getByText('วงเงินที่เบิกได้')).toBeInTheDocument()
    expect(screen.getByText('คำขอล่าสุด')).toBeInTheDocument()
    expect(screen.queryByLabelText('การแจ้งเตือน')).not.toBeInTheDocument()
  })
})
