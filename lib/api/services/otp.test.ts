import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendCode, verifyCode } from './otp'

afterEach(() => {
  vi.useRealTimers()
})

describe('OTP service — sendCode', () => {
  it('returns a codeId containing the employeeId and a future expiresAt', async () => {
    const result = await sendCode('EMP-001')
    expect(result.codeId).toContain('EMP-001')
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('OTP service — verifyCode', () => {
  it('returns valid: true for the correct code 123456', async () => {
    const { codeId } = await sendCode('EMP-001')
    expect((await verifyCode(codeId, '123456')).valid).toBe(true)
  })

  it('returns valid: false for a wrong code', async () => {
    const { codeId } = await sendCode('EMP-001')
    expect((await verifyCode(codeId, '999999')).valid).toBe(false)
  })

  it('returns valid: false for an unknown codeId', async () => {
    expect((await verifyCode('no-such-id', '123456')).valid).toBe(false)
  })

  it('returns valid: false after 5 minutes (expiry)', async () => {
    vi.useFakeTimers()
    const { codeId } = await sendCode('EMP-001')
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    expect((await verifyCode(codeId, '123456')).valid).toBe(false)
  })

  it('code is single-use: valid: false on second verify', async () => {
    const { codeId } = await sendCode('EMP-001')
    await verifyCode(codeId, '123456')
    expect((await verifyCode(codeId, '123456')).valid).toBe(false)
  })
})
