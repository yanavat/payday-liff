export function formatTHB(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`
}

export function formatTHBCompact(amount: number): string {
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `฿${(amount / 1_000).toFixed(1)}K`
  return formatTHB(amount)
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatTrend(value: number): string {
  return value >= 0 ? `+${value}%` : `${value}%`
}

export function maskAccount(account: string): string {
  const parts = account.split(' ')
  if (parts.length < 2) return account
  const bank = parts[0]
  const num = parts[1]
  return `${bank} ${num}`
}

export function generateRefNumber(date?: Date): string {
  const d = date ?? new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  return `REF-${ymd}-${rand}`
}
