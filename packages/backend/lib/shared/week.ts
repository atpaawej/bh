/**
 * BharatHunt weekly cycle: Friday 00:00:00.000 UTC → Thursday 23:59:59.999 UTC.
 */

export interface WeekRange {
  start: Date
  end: Date
}

/**
 * Days since the most recent Friday (UTC).
 * Friday → 0, Saturday → 1, …, Thursday → 6.
 */
function daysSinceFriday(date: Date): number {
  const day = date.getUTCDay() // 0=Sun … 5=Fri 6=Sat
  return (day + 2) % 7
}

/**
 * Current (or given) BH week range anchored to Friday 00:00 UTC.
 */
export function getWeekRange(date: Date = new Date()): WeekRange {
  const days = daysSinceFriday(date)
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - days, 0, 0, 0, 0)
  )
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Parse an ISO week string like "2026-W30" into a BH Friday→Thursday window.
 * Uses the Thursday of that ISO week (ISO weeks are defined by their Thursday),
 * then expands to the BH week containing that day.
 */
export function getWeekRangeFromIsoWeek(weekStr: string): WeekRange {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr)
  if (!match) {
    throw new Error(`Invalid week format: ${weekStr}. Expected YYYY-Wnn (e.g. 2026-W30)`)
  }

  const year = Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > 53) {
    throw new Error(`Invalid ISO week number: ${week}`)
  }

  // ISO week: Thursday of week 1 is the Thursday of the year that is in week 1
  // Algorithm: Jan 4 is always in week 1; find Monday of week 1, then add weeks
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfJan4 = jan4.getUTCDay() || 7 // Mon=1 … Sun=7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (dayOfJan4 - 1))

  const mondayOfWeek = new Date(mondayWeek1)
  mondayOfWeek.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7)

  // Thursday of this ISO week
  const thursday = new Date(mondayOfWeek)
  thursday.setUTCDate(mondayOfWeek.getUTCDate() + 3)

  return getWeekRange(thursday)
}

/**
 * Resolve list params into a concrete week range.
 * No week param → current week. week=YYYY-Wnn → that ISO week mapped to BH window.
 */
export function resolveWeekRange(week?: string, now: Date = new Date()): WeekRange {
  if (!week) return getWeekRange(now)
  return getWeekRangeFromIsoWeek(week)
}
