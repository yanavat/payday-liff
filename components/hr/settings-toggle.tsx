'use client'

import { cn } from '@/lib/utils'

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative h-[22px] w-10 rounded-full transition', checked ? 'bg-primary' : 'bg-gray-200')}
        aria-pressed={checked}
      >
        <span className={cn('absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition', checked ? 'left-5' : 'left-0.5')} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-text-primary">{label}</span>}
          {description && <span className="block text-caption text-text-muted">{description}</span>}
        </span>
      )}
    </label>
  )
}
