/**
 * Mock-backed employee linking store for LINE userId → employee mapping.
 * In production this would be a database table.
 *
 * Used by:
 * - AuthGate (client-side localStorage for demo)
 * - Notification dispatch (server-side in-memory map for demo)
 */

interface EmployeeLink {
  employeeId: string
  companyId: string
}

// Server-side in-memory map for API routes / server functions
const serverLinks: Record<string, EmployeeLink> = {
  'mock-line-user': { employeeId: 'EMP-0001', companyId: 'company-smpc' },
  'U00000000000000000000000000000001': { employeeId: 'EMP-0002', companyId: 'company-smpc' },
  'U00000000000000000000000000000002': { employeeId: 'EMP-0003', companyId: 'company-smpc' },
  'U00000000000000000000000000000003': { employeeId: 'EMP-0005', companyId: 'company-smpc' },
  'U00000000000000000000000000000004': { employeeId: 'EMP-0007', companyId: 'company-smpc' },
  'U00000000000000000000000000000005': { employeeId: 'EMP-0008', companyId: 'company-smpc' },
  'U00000000000000000000000000000006': { employeeId: 'EMP-0009', companyId: 'company-smpc' },
  'U00000000000000000000000000000007': { employeeId: 'EMP-0010', companyId: 'company-smpc' },
  'U00000000000000000000000000000008': { employeeId: 'EMP-0012', companyId: 'company-smpc' },
  'U00000000000000000000000000000009': { employeeId: 'EMP-0013', companyId: 'company-smpc' },
  'U0000000000000000000000000000000a': { employeeId: 'EMP-0014', companyId: 'company-smpc' },
  'U0000000000000000000000000000000b': { employeeId: 'EMP-0015', companyId: 'company-smpc' },
  'U0000000000000000000000000000000c': { employeeId: 'EMP-0016', companyId: 'company-smpc' },
  'U0000000000000000000000000000000d': { employeeId: 'EMP-0017', companyId: 'company-smpc' },
  'U0000000000000000000000000000000e': { employeeId: 'EMP-0018', companyId: 'company-smpc' },
  'U0000000000000000000000000000000f': { employeeId: 'EMP-0020', companyId: 'company-smpc' },
}

export function getEmployeeIdByLineUserId(lineUserId: string): string | null {
  return serverLinks[lineUserId]?.employeeId ?? null
}

export function getLineUserIdByEmployeeId(employeeId: string): string | null {
  for (const [lineUserId, link] of Object.entries(serverLinks)) {
    if (link.employeeId === employeeId) return lineUserId
  }
  return null
}

export function linkEmployee(lineUserId: string, employeeId: string, companyId: string): void {
  serverLinks[lineUserId] = { employeeId, companyId }
}

export function unlinkEmployee(lineUserId: string): void {
  delete serverLinks[lineUserId]
}

export function isLinked(lineUserId: string): boolean {
  return lineUserId in serverLinks
}
