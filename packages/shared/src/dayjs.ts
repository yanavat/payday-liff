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

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(buddhistEra)
dayjs.extend(weekOfYear)
dayjs.locale('th')

export default dayjs

export function setDayjsLocale(locale: 'th' | 'en' | 'my') {
  const localeMap = { th: 'th', en: 'en', my: 'my' }
  dayjs.locale(localeMap[locale])
}
