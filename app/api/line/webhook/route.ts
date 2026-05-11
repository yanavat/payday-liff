/**
 * POST /api/line/webhook
 * Receives LINE webhook events (messages, follows, postbacks).
 * Validates the x-line-signature header before processing.
 *
 * @see https://developers.line.biz/en/reference/messaging-api/#webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSignature, getChannelSecret, isWebhookValidationConfigured } from '@/lib/line/webhook'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-line-signature') ?? ''
  const rawBody = await request.text()

  // Validate signature when configured
  const channelSecret = getChannelSecret()
  if (channelSecret && channelSecret !== 'mock-secret') {
    const valid = validateWebhookSignature(channelSecret, rawBody, signature)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    // Mock / dev mode: log and accept
    console.log('[LINE Webhook Mock] signature validation skipped')
  }

  try {
    const events = (JSON.parse(rawBody) as { events?: unknown[] }).events ?? []

    for (const event of events) {
      handleLineEvent(event)
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      validated: isWebhookValidationConfigured(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[LINE Webhook] processing error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Event Handlers ──────────────────────────────────────────

function handleLineEvent(event: unknown) {
  const e = event as Record<string, unknown>
  const type = e.type as string

  switch (type) {
    case 'message':
      console.log('[LINE Webhook] message event:', JSON.stringify(e))
      break
    case 'follow':
      console.log('[LINE Webhook] follow event — user subscribed:', e.source)
      break
    case 'unfollow':
      console.log('[LINE Webhook] unfollow event — user unsubscribed:', e.source)
      break
    case 'postback':
      console.log('[LINE Webhook] postback event:', JSON.stringify(e))
      break
    default:
      console.log(`[LINE Webhook] unhandled event type: ${type}`)
  }
}
