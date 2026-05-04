import Image from 'next/image'
import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarColor = 'teal' | 'navy' | 'amber' | 'auto'

interface AvatarProps {
  initials: string
  src?: string
  alt?: string
  size?: AvatarSize
  color?: AvatarColor
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-16 w-16 text-2xl',
}

const colorClasses: Record<AvatarColor, string> = {
  teal: 'bg-primary text-white',
  navy: 'bg-text-primary text-white',
  amber: 'bg-amber-100 text-amber-900',
  auto: 'bg-primary-bg text-primary-dark',
}

function resolveAutoColor(initials: string): AvatarColor {
  const colors: AvatarColor[] = ['teal', 'navy', 'amber']
  const total = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colors[total % colors.length]
}

export function Avatar({
  initials,
  src,
  alt,
  size = 'md',
  color = 'auto',
  className,
}: AvatarProps) {
  const normalized = initials.trim().slice(0, 2).toUpperCase()
  const resolvedColor = color === 'auto' ? resolveAutoColor(normalized) : color

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold leading-none',
        sizeClasses[size],
        !src && colorClasses[resolvedColor],
        className,
      )}
      aria-label={alt ?? normalized}
    >
      {src ? (
        <Image src={src} alt={alt ?? normalized} fill sizes="64px" className="object-cover" />
      ) : (
        <span>{normalized}</span>
      )}
    </span>
  )
}
