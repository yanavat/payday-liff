import { cn } from '@/lib/utils'

export type PayCycle = 'monthly' | 'weekly'

interface PayCycleBadgeProps {
  type: PayCycle
  className?: string
}

const payCycleMap: Record<PayCycle, { label: string; className: string }> = {
  monthly: {
    label: 'รายเดือน',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  weekly: {
    label: 'รายสัปดาห์',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
}

export function PayCycleBadge({ type, className }: PayCycleBadgeProps) {
  const item = payCycleMap[type]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-badge font-medium leading-none',
        item.className,
        className,
      )}
    >
      {item.label}
    </span>
  )
}
