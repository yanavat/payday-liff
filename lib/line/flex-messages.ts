/**
 * LINE Flex Message templates for PayDay+ notifications.
 * @see https://developers.line.biz/en/docs/messaging-api/flex-message-elements/
 *
 * All templates use the Bubble container type with a compact hero + body layout.
 */

import type { EWARequest, Employee, PayCycleInfo } from '@/lib/api'
import { formatTHB } from '@/lib/utils/format'

// ── Helpers ─────────────────────────────────────────────────

const PRIMARY_COLOR = '#2DBD8F'
const DARK_COLOR = '#1E1D1B'
const SECONDARY_COLOR = '#6B7280'
const RED_COLOR = '#EF4444'
const AMBER_COLOR = '#F59E0B'

function label(text: string, color: string = SECONDARY_COLOR, size: string = 'xs', weight: string = 'bold') {
  return {
    type: 'text' as const,
    text,
    size,
    color,
    weight: weight as 'bold' | 'regular',
    flex: 1,
  }
}

function value(text: string, color: string = DARK_COLOR, size: string = 'sm', align: 'end' | 'start' = 'end') {
  return {
    type: 'text' as const,
    text,
    size,
    color,
    align,
    weight: 'bold' as const,
    flex: 2,
  }
}

function separator() {
  return {
    type: 'separator' as const,
    margin: 'sm' as const,
    color: '#E5E7EB',
  }
}

function row(labelEl: unknown, valueEl: unknown, margin: string = 'sm') {
  return {
    type: 'box' as const,
    layout: 'horizontal' as const,
    margin: margin as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    contents: [labelEl, valueEl],
  }
}

function primaryButton(label: string, url: string) {
  return {
    type: 'button' as const,
    style: 'primary' as const,
    color: PRIMARY_COLOR,
    action: {
      type: 'uri' as const,
      label,
      uri: url,
    },
    margin: 'md' as const,
    height: 'sm' as const,
  }
}

function heroBlock(title: string, subtitle: string, icon: string) {
  return {
    type: 'box' as const,
    layout: 'horizontal' as const,
    contents: [
      {
        type: 'text' as const,
        text: icon,
        size: 'xl',
        flex: 0,
      },
      {
        type: 'box' as const,
        layout: 'vertical' as const,
        margin: 'md' as const,
        contents: [
          {
            type: 'text' as const,
            text: title,
            weight: 'bold' as const,
            size: 'lg',
            color: '#FFFFFF',
          },
          {
            type: 'text' as const,
            text: subtitle,
            size: 'xs',
            color: '#FFFFFFBB',
            margin: 'xs' as const,
          },
        ],
      },
    ],
    backgroundColor: PRIMARY_COLOR,
    paddingAll: 'lg' as const,
  }
}

// ── Templates ───────────────────────────────────────────────

/**
 * Flex Message: EWA request approved
 */
export function approvedFlexMessage(
  request: EWARequest,
  employee: Employee,
  locale: 'th' | 'en' | 'my',
  liffUrlBase: string
): unknown {
  const title = locale === 'th' ? 'คำขอได้รับการอนุมัติ' : 'Request Approved'
  const subtitle = locale === 'th' ? `คำขอ ${request.id}` : `Request ${request.id}`
  const viewUrl = `${liffUrlBase}?page=history&id=${request.id}`

  return {
    type: 'flex',
    altText: `${title} · ${formatTHB(request.amount)}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: heroBlock(title, subtitle, '✅'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          row(label(locale === 'th' ? 'จำนวน' : 'Amount'), value(formatTHB(request.amount), PRIMARY_COLOR)),
          row(label(locale === 'th' ? 'ค่าธรรมเนียม' : 'Fee'), value(formatTHB(request.transferFee))),
          row(
            label(locale === 'th' ? 'โอนเข้า' : 'Net'),
            value(formatTHB(request.netTransferAmount), PRIMARY_COLOR)
          ),
          separator(),
          row(
            label(locale === 'th' ? 'สถานะ' : 'Status'),
            value(locale === 'th' ? 'อนุมัติแล้ว' : 'Approved', PRIMARY_COLOR)
          ),
          primaryButton(locale === 'th' ? 'ดูรายละเอียด' : 'View Details', viewUrl),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}

/**
 * Flex Message: EWA request rejected
 */
export function rejectedFlexMessage(
  request: EWARequest,
  employee: Employee,
  locale: 'th' | 'en' | 'my',
  liffUrlBase: string
): unknown {
  const title = locale === 'th' ? 'คำขอถูกปฏิเสธ' : 'Request Rejected'
  const subtitle = locale === 'th' ? `คำขอ ${request.id}` : `Request ${request.id}`
  const viewUrl = `${liffUrlBase}?page=history&id=${request.id}`

  return {
    type: 'flex',
    altText: `${title} · ${formatTHB(request.amount)}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: '❌', size: 'xl', flex: 0 },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#FFFFFF' },
              { type: 'text', text: subtitle, size: 'xs', color: '#FFFFFFBB', margin: 'xs' },
            ],
          },
        ],
        backgroundColor: RED_COLOR,
        paddingAll: 'lg',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          row(label(locale === 'th' ? 'จำนวน' : 'Amount'), value(formatTHB(request.amount))),
          row(
            label(locale === 'th' ? 'สถานะ' : 'Status'),
            value(locale === 'th' ? 'ปฏิเสธ' : 'Rejected', RED_COLOR)
          ),
          request.hrNote
            ? row(label(locale === 'th' ? 'หมายเหตุ' : 'Note'), value(request.hrNote, SECONDARY_COLOR, 'xs'))
            : { type: 'spacer', size: 'xs' },
          primaryButton(locale === 'th' ? 'ดูรายละเอียด' : 'View Details', viewUrl),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}

/**
 * Flex Message: Disbursement complete
 */
export function disbursedFlexMessage(
  request: EWARequest,
  employee: Employee,
  locale: 'th' | 'en' | 'my',
  liffUrlBase: string
): unknown {
  const title = locale === 'th' ? 'โอนเงินเสร็จสิ้น' : 'Transfer Complete'
  const subtitle = locale === 'th' ? `เลขที่ ${request.referenceNumber}` : `Ref ${request.referenceNumber}`
  const viewUrl = `${liffUrlBase}?page=history&id=${request.id}`

  return {
    type: 'flex',
    altText: `${title} · ${formatTHB(request.netTransferAmount)}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: heroBlock(title, subtitle, '💸'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          row(label(locale === 'th' ? 'โอนเข้า' : 'Transferred'), value(formatTHB(request.netTransferAmount), PRIMARY_COLOR)),
          row(label(locale === 'th' ? 'เลขที่' : 'Reference'), value(request.referenceNumber)),
          row(
            label(locale === 'th' ? 'บัญชี' : 'Account'),
            value(employee.bankAccountMasked, SECONDARY_COLOR, 'xs')
          ),
          separator(),
          row(
            label(locale === 'th' ? 'สถานะ' : 'Status'),
            value(locale === 'th' ? 'โอนเงินแล้ว' : 'Disbursed', PRIMARY_COLOR)
          ),
          primaryButton(locale === 'th' ? 'ดูใบเสร็จ' : 'View Receipt', viewUrl),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}

/**
 * Flex Message: Payday reminder
 */
export function paydayReminderFlexMessage(
  payCycleInfo: PayCycleInfo,
  employee: Employee,
  locale: 'th' | 'en' | 'my'
): unknown {
  const title = locale === 'th' ? 'แจ้งเตือนวันจ่ายเงิน' : 'Payday Reminder'
  const subtitle =
    locale === 'th'
      ? `วันจ่ายเงิน: ${payCycleInfo.paydayDate}`
      : `Payday: ${payCycleInfo.paydayDate}`

  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: heroBlock(title, subtitle, '💰'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          row(
            label(locale === 'th' ? 'รอบจ่าย' : 'Cycle'),
            value(
              locale === 'th'
                ? `${payCycleInfo.periodStart} - ${payCycleInfo.periodEnd}`
                : `${payCycleInfo.periodStart} - ${payCycleInfo.periodEnd}`
            )
          ),
          row(
            label(locale === 'th' ? 'วันจ่าย' : 'Payday'),
            value(payCycleInfo.paydayDate, PRIMARY_COLOR)
          ),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}

/**
 * Flex Message: Cutoff warning
 */
export function cutoffWarningFlexMessage(
  payCycleInfo: PayCycleInfo,
  employee: Employee,
  locale: 'th' | 'en' | 'my'
): unknown {
  const title = locale === 'th' ? 'ใกล้ถึงวันปิดรับคำขอ' : 'Cutoff Warning'
  const subtitle =
    locale === 'th'
      ? `วันปิดรับ: ${payCycleInfo.cutoffDate}`
      : `Cutoff: ${payCycleInfo.cutoffDate}`

  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: '⚠️', size: 'xl', flex: 0 },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#FFFFFF' },
              { type: 'text', text: subtitle, size: 'xs', color: '#FFFFFFBB', margin: 'xs' },
            ],
          },
        ],
        backgroundColor: AMBER_COLOR,
        paddingAll: 'lg',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          row(
            label(locale === 'th' ? 'วันปิดรับ' : 'Cutoff Date'),
            value(payCycleInfo.cutoffDate, AMBER_COLOR)
          ),
          row(
            label(locale === 'th' ? 'รอบจ่าย' : 'Pay Cycle'),
            value(payCycleInfo.type === 'monthly' ? 'รายเดือน' : 'รายสัปดาห์')
          ),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}

/**
 * Flex Message: Monthly summary
 */
export function monthlySummaryFlexMessage(
  month: string,
  totalEarned: number,
  totalWithdrawn: number,
  remainingBalance: number,
  requestCount: number,
  employee: Employee,
  locale: 'th' | 'en' | 'my'
): unknown {
  const title = locale === 'th' ? 'สรุปรายเดือน' : 'Monthly Summary'
  const subtitle = month

  return {
    type: 'flex',
    altText: `${title} · ${month}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: heroBlock(title, subtitle, '📊'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          row(label(locale === 'th' ? 'พนักงาน' : 'Employee'), value(employee.nameTh)),
          separator(),
          row(label(locale === 'th' ? 'รายได้' : 'Earned'), value(formatTHB(totalEarned))),
          row(label(locale === 'th' ? 'เบิกไปแล้ว' : 'Withdrawn'), value(formatTHB(totalWithdrawn), RED_COLOR)),
          row(
            label(locale === 'th' ? 'คงเหลือ' : 'Remaining'),
            value(formatTHB(remainingBalance), PRIMARY_COLOR)
          ),
          row(label(locale === 'th' ? 'จำนวนครั้ง' : 'Requests'), value(`${requestCount} ครั้ง`)),
        ],
        paddingAll: 'lg',
        spacing: 'sm',
      },
    },
  }
}
