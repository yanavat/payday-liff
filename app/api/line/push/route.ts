/**
 * POST /api/line/push
 * Server-side proxy for LINE Messaging API push messages.
 * Requires server-side channel access token (never exposed to client).
 *
 * Body: { to: string, messages: unknown[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { pushMessage, isLineMessagingConfigured } from '@/lib/line/messaging-api'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { to?: string; messages?: unknown[] }

    if (!body.to || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Invalid payload: "to" and "messages" are required' }, { status: 400 })
    }

    const success = await pushMessage({ to: body.to, messages: body.messages })

    if (!success) {
      return NextResponse.json({ error: 'Push message failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true, configured: isLineMessagingConfigured() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
