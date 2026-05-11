/**
 * LINE Messaging API adapter
 * Server-side only. Channel access token must never reach the client.
 */

export interface LinePushMessage {
  to: string // LINE userId
  messages: unknown[]
}

export interface LineMulticastMessage {
  to: string[] // LINE userIds
  messages: unknown[]
}

const LINE_API_BASE = 'https://api.line.me/v2/bot'

function getChannelAccessToken(): string | undefined {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN
}

/**
 * Send a push message to a single LINE user.
 * Returns true if the API reports success (even in mock mode).
 */
export async function pushMessage(payload: LinePushMessage): Promise<boolean> {
  const token = getChannelAccessToken()

  // Mock mode: no real token, log and succeed
  if (!token || token === 'mock-token') {
    console.log('[LINE Messaging API Mock] pushMessage:', JSON.stringify(payload))
    return true
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[LINE Messaging API] push failed: ${res.status} ${body}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[LINE Messaging API] push exception:', err)
    return false
  }
}

/**
 * Send the same message to multiple LINE users.
 */
export async function multicastMessage(payload: LineMulticastMessage): Promise<boolean> {
  const token = getChannelAccessToken()

  if (!token || token === 'mock-token') {
    console.log('[LINE Messaging API Mock] multicast:', JSON.stringify(payload))
    return true
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/message/multicast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[LINE Messaging API] multicast failed: ${res.status} ${body}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[LINE Messaging API] multicast exception:', err)
    return false
  }
}

/**
 * Validate that server-side LINE credentials are configured.
 */
export function isLineMessagingConfigured(): boolean {
  const token = getChannelAccessToken()
  return typeof token === 'string' && token.length > 0 && token !== 'mock-token'
}
