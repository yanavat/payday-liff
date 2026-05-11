import type { EWAStatus } from '@payday/shared'

export type PaydayNotificationType =
  | 'request_approved'
  | 'request_rejected'
  | 'disbursement_complete'
  | 'payday_reminder'
  | 'cutoff_warning'
  | 'monthly_summary'

export interface PaydayNotificationCommand {
  type: PaydayNotificationType
  lineUserId: string
  requestId?: string
  amount?: number
  status?: EWAStatus
}

export interface NotificationDispatcher {
  dispatch(command: PaydayNotificationCommand): Promise<void>
}

export function createMemoryNotificationDispatcher(): NotificationDispatcher & {
  sent: PaydayNotificationCommand[]
} {
  const sent: PaydayNotificationCommand[] = []

  return {
    sent,
    async dispatch(command) {
      sent.push(command)
    },
  }
}
