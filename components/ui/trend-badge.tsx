import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendBadgeProps {
  value: number
  label?: string
  showArrow?: boolean
  className?: string
}

export function TrendBadge({ value, label, showArrow = true, className }: TrendBadgeProps) {
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
  const Icon = direction === 'positive' ? ArrowUp : direction === 'negative' ? ArrowDown : Minus
  const formatted = `${value > 0 ? '+' : ''}${value}%`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none',
        direction === 'positive' && 'bg-green-100 text-green-700',
        direction === 'negative' && 'bg-red-100 text-red-700',
        direction === 'neutral' && 'bg-bg-secondary text-text-secondary',
        className,
      )}
    >
      {showArrow && <Icon aria-hidden className="h-3 w-3" />}
      {formatted}
      {label && <span className="text-current/70">{label}</span>}
    </span>
  )
}
