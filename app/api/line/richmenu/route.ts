/**
 * POST /api/line/richmenu
 * Configure the default LINE Rich Menu for PayDay+.
 * Creates the rich menu and sets it as the default for all users.
 *
 * Requires server-side LINE_CHANNEL_ACCESS_TOKEN.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildPaydayRichMenu, createRichMenu, setDefaultRichMenu } from '@/lib/line/rich-menu'
import { isLineMessagingConfigured } from '@/lib/line/messaging-api'

export async function POST(request: NextRequest) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, { status: 503 })
  }

  try {
    const payload = buildPaydayRichMenu()
    const richMenuId = await createRichMenu(token, payload)

    if (!richMenuId) {
      return NextResponse.json({ error: 'Failed to create rich menu' }, { status: 502 })
    }

    const defaulted = await setDefaultRichMenu(token, richMenuId)

    if (!defaulted) {
      return NextResponse.json(
        { error: 'Rich menu created but failed to set as default', richMenuId },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      richMenuId,
      configured: isLineMessagingConfigured(),
      areas: payload.areas.map((a) => ({
        bounds: a.bounds,
        uri: a.action.uri,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
