import { cn } from '@/lib/utils'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'disbursed'

interface StatusBadgeProps {
  status: RequestStatus
  size?: 'sm' | 'md'
  className?: string
}

const statusMap: Record<RequestStatus, { label: string; className: string }> = {
  pending: {
    label: 'รออนุมัติ',
    className: 'bg-status-pending-bg text-status-pending-text animate-pulse-badge',
  },
  approved: {
    label: 'อนุมัติแล้ว',
    className: 'bg-status-approved-bg text-status-approved-text',
  },
  rejected: {
    label: 'ไม่อนุมัติ',
    className: 'bg-status-rejected-bg text-status-rejected-text',
  },
  disbursed: {
    label: 'โอนแล้ว',
    className: 'bg-status-disbursed-bg text-status-disbursed-text',
  },
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const item = statusMap[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none',
        size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-badge',
        item.className,
        className,
      )}
    >
      {item.label}
    </span>
  )
}
