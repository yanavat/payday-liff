import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  color?: 'primary' | 'amber' | 'red'
  height?: '4px' | '6px' | '8px' | '10px'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

const colorClasses = {
  primary: 'bg-primary',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

export function ProgressBar({
  value,
  max,
  color = 'primary',
  height = '6px',
  showLabel = false,
  label,
  animated = true,
  className,
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1)
  const percent = Math.min(Math.max((value / safeMax) * 100, 0), 100)
  const text = label ?? `${value} / ${max}`

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-caption text-text-muted">
          <span>{text}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-full bg-border"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-full', colorClasses[color], animated && 'transition-all duration-300 ease-out')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
