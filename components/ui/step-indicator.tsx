import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                  isComplete && 'border-primary bg-primary text-white',
                  isActive && 'border-primary bg-bg-canvas text-primary',
                  !isComplete && !isActive && 'border-border bg-bg-secondary text-text-muted',
                )}
              >
                {isComplete ? <Check className="h-4 w-4" aria-hidden /> : stepNumber}
              </span>
              <span className={cn('truncate text-sm font-medium', isActive ? 'text-text-primary' : 'text-text-muted')}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && <span className="mx-3 h-px flex-1 bg-border" />}
          </li>
        )
      })}
    </ol>
  )
}
