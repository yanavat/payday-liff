import { describe, expect, it } from 'vitest'

import {
  createInMemoryEmployeeLinkStore,
  linkLineUserToEmployee,
  unlinkLineUser,
} from './employee-linking'

describe('employee linking', () => {
  it('links a LINE user to an employee and can resolve it later', async () => {
    const store = createInMemoryEmployeeLinkStore()

    const link = await linkLineUserToEmployee(store, {
      employeeId: 'EMP-0041',
      lineUserId: 'U1234567890',
    })

    await expect(store.findByLineUserId('U1234567890')).resolves.toEqual(link)
    expect(link).toMatchObject({
      employeeId: 'EMP-0041',
      lineUserId: 'U1234567890',
    })
  })

  it('removes a link when the employee unlinks their LINE account', async () => {
    const store = createInMemoryEmployeeLinkStore()
    await linkLineUserToEmployee(store, {
      employeeId: 'EMP-0041',
      lineUserId: 'U1234567890',
    })

    await unlinkLineUser(store, 'U1234567890')

    await expect(store.findByLineUserId('U1234567890')).resolves.toBeNull()
  })
})
