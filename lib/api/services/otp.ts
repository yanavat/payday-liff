export interface SendCodeResponse {
  codeId: string
  expiresAt: string
}

export interface VerifyCodeResponse {
  valid: boolean
}

const MOCK_CODE = '123456'
const TTL_MS = 5 * 60 * 1000

const pendingCodes = new Map<string, { code: string; expiresAt: number }>()

export async function sendCode(employeeId: string): Promise<SendCodeResponse> {
  const codeId = `${employeeId}-${Date.now()}`
  const expiresAt = Date.now() + TTL_MS
  pendingCodes.set(codeId, { code: MOCK_CODE, expiresAt })
  return { codeId, expiresAt: new Date(expiresAt).toISOString() }
}

export async function verifyCode(codeId: string, code: string): Promise<VerifyCodeResponse> {
  const pending = pendingCodes.get(codeId)
  if (!pending || Date.now() > pending.expiresAt) return { valid: false }
  if (pending.code !== code) return { valid: false }
  pendingCodes.delete(codeId)
  return { valid: true }
}
