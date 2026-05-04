import { cn } from '@/lib/utils'

interface SkeletonRowProps {
  columns?: number
  className?: string
}

export function SkeletonRow({ columns = 4, className }: SkeletonRowProps) {
  return (
    <div className={cn('grid h-[52px] items-center gap-4 border-b border-border-light px-4', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className="h-3 rounded-full bg-bg-secondary animate-pulse" />
      ))}
    </div>
  )
}
