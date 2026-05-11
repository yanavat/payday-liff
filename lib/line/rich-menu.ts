/**
 * LINE Rich Menu configuration for PayDay+ LIFF app.
 * Provides persistent entry points: Home, Request, History, Profile.
 *
 * @see https://developers.line.biz/en/reference/messaging-api/#rich-menu
 *
 * Rich menus are configured server-side via the Messaging API.
 */

export interface RichMenuArea {
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  action: {
    type: 'uri'
    uri: string
  }
}

export interface RichMenuPayload {
  size: {
    width: number
    height: number
  }
  selected: boolean
  name: string
  chatBarText: string
  areas: RichMenuArea[]
}

const LIFF_URL_BASE = process.env.NEXT_PUBLIC_LIFF_URL ?? 'https://liff.line.me/xxxxxxxxx'

/**
 * Build the default Rich Menu payload for PayDay+.
 * Uses a 4-column compact layout (2500×843).
 */
export function buildPaydayRichMenu(): RichMenuPayload {
  const homeUrl = `${LIFF_URL_BASE}?page=home`
  const requestUrl = `${LIFF_URL_BASE}?page=request`
  const historyUrl = `${LIFF_URL_BASE}?page=history`
  const profileUrl = `${LIFF_URL_BASE}?page=profile`

  const colWidth = 625 // 2500 / 4
  const fullHeight = 843

  return {
    size: {
      width: 2500,
      height: fullHeight,
    },
    selected: true,
    name: 'PayDay+ Main Menu',
    chatBarText: 'PayDay+ Menu',
    areas: [
      {
        bounds: { x: 0, y: 0, width: colWidth, height: fullHeight },
        action: { type: 'uri', uri: homeUrl },
      },
      {
        bounds: { x: colWidth, y: 0, width: colWidth, height: fullHeight },
        action: { type: 'uri', uri: requestUrl },
      },
      {
        bounds: { x: colWidth * 2, y: 0, width: colWidth, height: fullHeight },
        action: { type: 'uri', uri: historyUrl },
      },
      {
        bounds: { x: colWidth * 3, y: 0, width: colWidth, height: fullHeight },
        action: { type: 'uri', uri: profileUrl },
      },
    ],
  }
}

/**
 * Create or update the rich menu via the LINE Messaging API.
 * Returns the rich menu ID on success.
 */
export async function createRichMenu(token: string, payload: RichMenuPayload): Promise<string | null> {
  if (!token || token === 'mock-token') {
    console.log('[LINE Rich Menu Mock] create:', JSON.stringify(payload))
    return 'mock-rich-menu-id'
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[LINE Rich Menu] create failed: ${res.status} ${body}`)
      return null
    }

    const json = (await res.json()) as { richMenuId: string }
    return json.richMenuId ?? null
  } catch (err) {
    console.error('[LINE Rich Menu] create exception:', err)
    return null
  }
}

/**
 * Set the default rich menu for all users.
 */
export async function setDefaultRichMenu(token: string, richMenuId: string): Promise<boolean> {
  if (!token || token === 'mock-token') {
    console.log(`[LINE Rich Menu Mock] setDefault: ${richMenuId}`)
    return true
  }

  try {
    const res = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[LINE Rich Menu] setDefault failed: ${res.status} ${body}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[LINE Rich Menu] setDefault exception:', err)
    return false
  }
}
