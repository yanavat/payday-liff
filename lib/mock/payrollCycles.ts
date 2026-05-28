import type { PayCycleInfo } from '@/lib/api'

// Current pay cycle data (relative to May 2025)
export const monthlyPayCycle: PayCycleInfo = {
  type: 'monthly',
  periodStart: '2025-05-01',
  periodEnd: '2025-05-31',
  paydayDate: '2025-05-31',
  cutoffDate: '2025-05-28',
  daysElapsed: 14,
  totalDays: 31,
}

export const weeklyPayCycle: PayCycleInfo = {
  type: 'weekly',
  periodStart: '2025-05-12',
  periodEnd: '2025-05-16',
  paydayDate: '2025-05-16',
  cutoffDate: '2025-05-15',
  daysElapsed: 3,
  totalDays: 5,
}

export const payCycles = {
  monthly: monthlyPayCycle,
  weekly: weeklyPayCycle,
}
