export interface LiffIdentity {
  lineUserId: string
  displayName: string
  pictureUrl?: string
}

export interface AppSession {
  employeeId: string
  lineUserId: string
  issuedAt: string
}

export async function createMockLiffSession(input: {
  employeeId: string
  identity: LiffIdentity
}): Promise<AppSession> {
  return {
    employeeId: input.employeeId,
    lineUserId: input.identity.lineUserId,
    issuedAt: new Date().toISOString(),
  }
}
