import { cn } from '@/lib/utils'

export type WorkType = 'remote' | 'on-site' | 'hybrid'

interface WorkTypeBadgeProps {
  type: WorkType
  className?: string
}

const workTypeMap: Record<WorkType, { label: string; className: string }> = {
  remote: { label: 'Remote', className: 'bg-tag-remote-bg text-tag-remote-text' },
  'on-site': { label: 'On-site', className: 'bg-tag-onsite-bg text-tag-onsite-text' },
  hybrid: { label: 'Hybrid', className: 'bg-tag-hybrid-bg text-tag-hybrid-text' },
}

export function WorkTypeBadge({ type, className }: WorkTypeBadgeProps) {
  const item = workTypeMap[type]

  return (
    <span className={cn('pill font-medium', item.className, className)}>
      {item.label}
    </span>
  )
}
