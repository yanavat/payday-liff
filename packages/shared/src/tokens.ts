export const paydayColorTokens = [
  '--color-primary',
  '--color-primary-dark',
  '--color-primary-bg',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-bg-page',
  '--color-bg-canvas',
  '--color-border',
] as const

export type PaydayColorToken = (typeof paydayColorTokens)[number]
