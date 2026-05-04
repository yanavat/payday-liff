import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  message: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, message, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-bg text-primary">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </div>
      <p className="mt-4 text-sm font-semibold text-text-primary">{message}</p>
      {description && <p className="mt-1 max-w-sm text-caption text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
