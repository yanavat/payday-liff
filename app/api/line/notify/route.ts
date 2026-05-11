/**
 * POST /api/line/notify
 * Server-side notification dispatch endpoint.
 * Accepts a TypedNotificationCommand, resolves the LINE userId from the
 * employee record, builds the Flex Message, and sends via the Messaging API.
 *
 * This keeps the channel access token server-side while allowing the HR UI
 * to trigger push notifications on approval / rejection / disbursement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { dispatchNotification } from '@/lib/line/notifications'
import { getLineUserIdByEmployeeId } from '@/lib/line/employee-links'
import { employees } from '@/lib/mock'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const type = body.type as string
    const employeeId = (body.employee as Record<string, unknown>)?.id as string | undefined

    if (!type || !employeeId) {
      return NextResponse.json(
        { error: 'Missing "type" or "employee.id"' },
        { status: 400 }
      )
    }

    const lineUserId = getLineUserIdByEmployeeId(employeeId)
    if (!lineUserId) {
      console.log(`[LINE Notify] no LINE user linked for employee ${employeeId}`)
      // Silently succeed — not all employees may have LINE linked
      return NextResponse.json({ success: true, sent: false, reason: 'not_linked' })
    }

    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const locale = (body.locale as 'th' | 'en' | 'my') ?? 'th'

    // Build the correct command based on type
    switch (type) {
      case 'request_approved':
      case 'request_rejected':
      case 'disbursement_complete': {
        const request = body.request as Record<string, unknown>
        const success = await dispatchNotification({
          type,
          lineUserId,
          locale,
          request: request as unknown as import('@/types').EWARequest,
          employee,
        })
        return NextResponse.json({ success, sent: success, type, lineUserId: lineUserId.slice(0, 8) + '...' })
      }

      case 'payday_reminder': {
        const payCycleInfo = body.payCycleInfo as Record<string, unknown>
        const success = await dispatchNotification({
          type: 'payday_reminder',
          lineUserId,
          locale,
          payCycleInfo: payCycleInfo as unknown as import('@/types').PayCycleInfo,
          employee,
        })
        return NextResponse.json({ success, sent: success, type })
      }

      case 'cutoff_warning': {
        const payCycleInfo = body.payCycleInfo as Record<string, unknown>
        const success = await dispatchNotification({
          type: 'cutoff_warning',
          lineUserId,
          locale,
          payCycleInfo: payCycleInfo as unknown as import('@/types').PayCycleInfo,
          employee,
        })
        return NextResponse.json({ success, sent: success, type })
      }

      case 'monthly_summary': {
        const { month, totalEarned, totalWithdrawn, remainingBalance, requestCount } = body as Record<string, unknown>
        const success = await dispatchNotification({
          type: 'monthly_summary',
          lineUserId,
          locale,
          month: month as string,
          totalEarned: totalEarned as number,
          totalWithdrawn: totalWithdrawn as number,
          remainingBalance: remainingBalance as number,
          requestCount: requestCount as number,
          employee,
        })
        return NextResponse.json({ success, sent: success, type })
      }

      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[LINE Notify] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
