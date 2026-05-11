/**
 * Mock-backed employee linking store for LINE userId → employee mapping.
 * In production this would be a database table.
 *
 * Used by:
 * - LIFFAuthGate (client-side localStorage for demo)
 * - Notification dispatch (server-side in-memory map for demo)
 */

// Server-side in-memory map for API routes / server functions
const serverLinks: Record<string, string> = {
  'mock-line-user': 'EMP-0001',
  'U00000000000000000000000000000001': 'EMP-0002',
  'U00000000000000000000000000000002': 'EMP-0003',
  'U00000000000000000000000000000003': 'EMP-0005',
  'U00000000000000000000000000000004': 'EMP-0007',
  'U00000000000000000000000000000005': 'EMP-0008',
  'U00000000000000000000000000000006': 'EMP-0009',
  'U00000000000000000000000000000007': 'EMP-0010',
  'U00000000000000000000000000000008': 'EMP-0012',
  'U00000000000000000000000000000009': 'EMP-0013',
  'U0000000000000000000000000000000a': 'EMP-0014',
  'U0000000000000000000000000000000b': 'EMP-0015',
  'U0000000000000000000000000000000c': 'EMP-0016',
  'U0000000000000000000000000000000d': 'EMP-0017',
  'U0000000000000000000000000000000e': 'EMP-0018',
  'U0000000000000000000000000000000f': 'EMP-0020',
}

export function getEmployeeIdByLineUserId(lineUserId: string): string | null {
  return serverLinks[lineUserId] ?? null
}

export function getLineUserIdByEmployeeId(employeeId: string): string | null {
  for (const [lineUserId, empId] of Object.entries(serverLinks)) {
    if (empId === employeeId) return lineUserId
  }
  return null
}

export function linkEmployee(lineUserId: string, employeeId: string): void {
  serverLinks[lineUserId] = employeeId
}

export function unlinkEmployee(lineUserId: string): void {
  delete serverLinks[lineUserId]
}

export function isLinked(lineUserId: string): boolean {
  return lineUserId in serverLinks
}
