/**
 * Dayjs configuration for EWA PayDay+
 *
 * Features:
 * - Buddhist Era (BE) year support: +543 to Gregorian (e.g. 2025 → 2568)
 * - Thai locale (th)
 * - Myanmar locale (my)
 * - Relative time (e.g. "3 ชั่วโมงที่แล้ว")
 * - Duration support
 */
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import 'dayjs/locale/my'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// Register all plugins
dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(buddhistEra)
dayjs.extend(weekOfYear)

// Default locale: Thai
dayjs.locale('th')

export default dayjs

// ── Locale switcher ─────────────────────────────────────────
// Call this when the user changes language
export function setDayjsLocale(locale: 'th' | 'en' | 'my') {
  const localeMap = { th: 'th', en: 'en', my: 'my' }
  dayjs.locale(localeMap[locale])
}

// ── Buddhist Era helpers ────────────────────────────────────

/**
 * Format a date in Thai Buddhist Era
 * e.g. formatBE('2025-05-14') → "14 พฤษภาคม 2568"
 */
export function formatBE(date: string | Date | dayjs.Dayjs, format = 'D MMMM BBBB'): string {
  return dayjs(date).locale('th').format(format)
}

/**
 * Format a date in short BE format
 * e.g. formatBEShort('2025-05-14') → "14/05/2568"
 */
export function formatBEShort(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).locale('th').format('DD/MM/BBBB')
}

/**
 * Format with English Gregorian year (for EN locale)
 * e.g. formatEN('2025-05-14') → "14 May 2025"
 */
export function formatEN(date: string | Date | dayjs.Dayjs, format = 'D MMMM YYYY'): string {
  return dayjs(date).locale('en').format(format)
}

/**
 * Format date based on current locale
 * Returns BE year for Thai, Gregorian for EN/MY
 */
export function formatLocale(
  date: string | Date | dayjs.Dayjs,
  locale: 'th' | 'en' | 'my',
  format?: string,
): string {
  if (locale === 'th') {
    return formatBE(date, format)
  }
  return dayjs(date).locale(locale === 'my' ? 'my' : 'en').format(format ?? 'D MMMM YYYY')
}

/**
 * Get relative time string
 * e.g. "3 ชั่วโมงที่แล้ว" (th) or "3 hours ago" (en)
 */
export function fromNow(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).fromNow()
}

/**
 * Calculate days remaining until a date
 * Returns negative if date is in the past
 */
export function daysUntil(targetDate: string | Date): number {
  return dayjs(targetDate).diff(dayjs(), 'day')
}

/**
 * Calculate pay period progress percentage
 */
export function payPeriodProgress(elapsed: number, total: number): number {
  return Math.min(Math.round((elapsed / total) * 100), 100)
}

/**
 * Get short day names in Thai (for weekly selector)
 */
export const thaiDayNames = {
  mon: 'จันทร์',
  tue: 'อังคาร',
  wed: 'พุธ',
  thu: 'พฤหัสบดี',
  fri: 'ศุกร์',
  sat: 'เสาร์',
  sun: 'อาทิตย์',
}
