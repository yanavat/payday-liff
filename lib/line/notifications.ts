/**
 * Typed notification commands for LINE Messaging API push notifications.
 * Each command maps to a business event and builds the appropriate Flex Message.
 */

import type { EWARequest, Employee, PayCycleInfo } from '@/types'
import { pushMessage } from './messaging-api'
import {
  approvedFlexMessage,
  rejectedFlexMessage,
  disbursedFlexMessage,
  paydayReminderFlexMessage,
  cutoffWarningFlexMessage,
  monthlySummaryFlexMessage,
} from './flex-messages'

// ── Notification Types ─────────────────────────────────────

export type NotificationType =
  | 'request_approved'
  | 'request_rejected'
  | 'disbursement_complete'
  | 'payday_reminder'
  | 'cutoff_warning'
  | 'monthly_summary'

export interface NotificationPayload {
  type: NotificationType
  lineUserId: string
  locale?: 'th' | 'en' | 'my'
}

export interface RequestNotificationPayload extends NotificationPayload {
  type: 'request_approved' | 'request_rejected' | 'disbursement_complete'
  request: EWARequest
  employee: Employee
}

export interface PaydayReminderPayload extends NotificationPayload {
  type: 'payday_reminder'
  payCycleInfo: PayCycleInfo
  employee: Employee
}

export interface CutoffWarningPayload extends NotificationPayload {
  type: 'cutoff_warning'
  payCycleInfo: PayCycleInfo
  employee: Employee
}

export interface MonthlySummaryPayload extends NotificationPayload {
  type: 'monthly_summary'
  month: string // e.g. "May 2025"
  totalEarned: number
  totalWithdrawn: number
  remainingBalance: number
  requestCount: number
  employee: Employee
}

export type TypedNotificationCommand =
  | RequestNotificationPayload
  | PaydayReminderPayload
  | CutoffWarningPayload
  | MonthlySummaryPayload

// ── Dispatch ──────────────────────────────────────────────

/**
 * Dispatch a typed notification command to a LINE user.
 * In mock mode this logs to the console and returns true.
 */
export async function dispatchNotification(cmd: TypedNotificationCommand): Promise<boolean> {
  const locale = cmd.locale ?? 'th'
  const liffUrlBase = process.env.NEXT_PUBLIC_LIFF_URL ?? 'https://liff.line.me/xxxxxxxxx'

  switch (cmd.type) {
    case 'request_approved':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [approvedFlexMessage(cmd.request, cmd.employee, locale, liffUrlBase)],
      })

    case 'request_rejected':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [rejectedFlexMessage(cmd.request, cmd.employee, locale, liffUrlBase)],
      })

    case 'disbursement_complete':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [disbursedFlexMessage(cmd.request, cmd.employee, locale, liffUrlBase)],
      })

    case 'payday_reminder':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [paydayReminderFlexMessage(cmd.payCycleInfo, cmd.employee, locale)],
      })

    case 'cutoff_warning':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [cutoffWarningFlexMessage(cmd.payCycleInfo, cmd.employee, locale)],
      })

    case 'monthly_summary':
      return pushMessage({
        to: cmd.lineUserId,
        messages: [
          monthlySummaryFlexMessage(
            cmd.month,
            cmd.totalEarned,
            cmd.totalWithdrawn,
            cmd.remainingBalance,
            cmd.requestCount,
            cmd.employee,
            locale
          ),
        ],
      })

    default:
      return false
  }
}

/**
 * Build a deep-link LIFF URL for a specific screen.
 */
export function buildLiffDeepLink(base: string, screen: 'home' | 'request' | 'history' | 'profile', requestId?: string): string {
  const url = new URL(base)
  url.searchParams.set('page', screen)
  if (requestId) url.searchParams.set('id', requestId)
  return url.toString()
}
