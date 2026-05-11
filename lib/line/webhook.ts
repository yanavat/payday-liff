/**
 * LINE Webhook signature validation
 * Uses HMAC-SHA256 with the channel secret.
 * @see https://developers.line.biz/en/reference/messaging-api/#signature-validation
 */

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Validate the x-line-signature header against the raw request body.
 * Must use the raw body string (not parsed JSON) for correct hashing.
 */
export function validateWebhookSignature(
  channelSecret: string,
  body: string | Buffer,
  signature: string
): boolean {
  if (!channelSecret || !signature) return false

  const hmac = createHmac('sha256', channelSecret)
  hmac.update(body)
  const digest = hmac.digest('base64')

  try {
    const digestBuf = Buffer.from(digest)
    const signatureBuf = Buffer.from(signature)
    if (digestBuf.length !== signatureBuf.length) return false
    return timingSafeEqual(digestBuf, signatureBuf)
  } catch {
    return false
  }
}

/**
 * Return the channel secret from env (server-side only).
 */
export function getChannelSecret(): string | undefined {
  return process.env.LINE_CHANNEL_SECRET
}

/**
 * Check whether webhook validation can be performed.
 */
export function isWebhookValidationConfigured(): boolean {
  const secret = getChannelSecret()
  return typeof secret === 'string' && secret.length > 0 && secret !== 'mock-secret'
}
