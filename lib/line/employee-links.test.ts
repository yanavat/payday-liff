import { describe, it, expect } from 'vitest'
import {
  getEmployeeIdByLineUserId,
  getLineUserIdByEmployeeId,
  linkEmployee,
  unlinkEmployee,
  isLinked,
} from './employee-links'

describe('employee-links', () => {
  it('returns employee id for known line user', () => {
    expect(getEmployeeIdByLineUserId('mock-line-user')).toBe('EMP-0001')
  })

  it('returns null for unknown line user', () => {
    expect(getEmployeeIdByLineUserId('unknown')).toBeNull()
  })

  it('resolves line user id from employee id', () => {
    expect(getLineUserIdByEmployeeId('EMP-0001')).toBe('mock-line-user')
  })

  it('returns null for unlinked employee', () => {
    expect(getLineUserIdByEmployeeId('UNKNOWN')).toBeNull()
  })

  it('links and unlinks employees', () => {
    linkEmployee('new-line-user', 'EMP-0002')
    expect(isLinked('new-line-user')).toBe(true)
    expect(getEmployeeIdByLineUserId('new-line-user')).toBe('EMP-0002')

    unlinkEmployee('new-line-user')
    expect(isLinked('new-line-user')).toBe(false)
  })
})
