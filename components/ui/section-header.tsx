import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  onMore?: () => void
  className?: string
}

export function SectionHeader({ title, description, action, onMore, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-section-title text-text-primary">{title}</h2>
        {description && <p className="mt-1 text-caption text-text-muted">{description}</p>}
      </div>
      {action ?? (
        onMore && (
          <button
            type="button"
            onClick={onMore}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        )
      )}
    </div>
  )
}
