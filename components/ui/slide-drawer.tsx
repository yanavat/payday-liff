'use client'

import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SlideDrawer({ open, onClose, title, children, footer, className }: SlideDrawerProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    if (!open) return
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-modal animate-slide-in-right',
          className,
        )}
      >
        <header className="flex min-h-14 items-center justify-between border-b border-border px-5">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-border p-5">{footer}</footer>}
      </aside>
    </div>
  )
}
