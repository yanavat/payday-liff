'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

interface FilterButtonProps {
  label?: string
  value?: string
  options: FilterOption[]
  onChange: (value: string) => void
  className?: string
}

export function FilterButton({
  label = 'ตัวกรอง',
  value,
  options,
  onChange,
  className,
}: FilterButtonProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-text-primary shadow-card transition hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-expanded={open}
      >
        <Filter className="h-4 w-4 text-text-muted" aria-hidden />
        <span>{selected?.label ?? label}</span>
        <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 min-w-44 overflow-hidden rounded-md border border-border bg-white py-1 shadow-hover">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm text-text-primary hover:bg-primary-subtle focus:bg-primary-subtle focus:outline-none"
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 text-primary" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
