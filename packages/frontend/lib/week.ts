/**
 * ISO week helpers for the leaderboard week picker.
 *
 * A BH (BharatHunt) week runs Friday 00:00 UTC → Thursday 23:59:59 UTC.
 * An ISO week runs Monday → Sunday.
 * To map an ISO week to a BH week we take the ISO week's Thursday
 * and expand to the BH window containing that day.
 */

export interface WeekRange {
  start: Date;
  end: Date;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Number of ISO weeks in a given year (52 or 53).
 * A year has 53 ISO weeks if Jan 1 is Thursday (common year)
 * or Dec 31 is Thursday (leap year).
 */
function getIsoWeeksInYear(year: number): number {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));
  return jan1.getUTCDay() === 4 || dec31.getUTCDay() === 4 ? 53 : 52;
}

/**
 * Returns the current ISO week string (e.g. "2026-W30") for a given date.
 */
export function getCurrentIsoWeek(date: Date = new Date()): string {
  // Find the Thursday of the week containing `date`
  const day = date.getUTCDay(); // 0=Sun … 6=Sat
  const thursdayOffset = (4 - day + 7) % 7; // days until next Thursday
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + thursdayOffset);

  const year = thursday.getUTCFullYear();

  // Find Jan 4 (always in ISO week 1)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const weekNumber = Math.ceil(
    (thursday.getTime() - mondayWeek1.getTime()) / (7 * 86400000) + 1,
  );

  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * Convert "YYYY-Wnn" to a BH Friday→Thursday range.
 */
export function getWeekRangeFromIso(weekStr: string): WeekRange {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!match) {
    throw new Error(`Invalid week format: ${weekStr}. Expected YYYY-Wnn`);
  }

  const year = Number(match[1]);
  const week = Number(match[2]);

  // Find Monday of ISO week 1 for this year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfJan4 = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (dayOfJan4 - 1));

  // Monday of target ISO week
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

  // Thursday of ISO week
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);

  // BH week: Friday → Thursday containing that Thursday
  const day = thursday.getUTCDay(); // 0=Sun … 5=Fri 6=Sat
  const daysSinceFriday = (day + 2) % 7;

  const start = new Date(
    Date.UTC(
      thursday.getUTCFullYear(),
      thursday.getUTCMonth(),
      thursday.getUTCDate() - daysSinceFriday,
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format a week string into a human-readable label.
 * "2026-W30" → "Week 30 · Jul 18 – Jul 24, 2026"
 */
export function formatWeekLabel(weekStr: string): string {
  const { start, end } = getWeekRangeFromIso(weekStr);
  const startMonth = MONTH_NAMES[start.getUTCMonth()];
  const endMonth = MONTH_NAMES[end.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = start.getUTCFullYear();

  const weekNum = weekStr.split("-W")[1]?.replace(/^0/, "") ?? "";

  if (startMonth === endMonth) {
    return `Week ${weekNum} · ${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `Week ${weekNum} · ${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/**
 * Get the previous ISO week string by decrementing the week number.
 */
export function getPrevWeek(weekStr: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!match) return weekStr;
  let year = Number(match[1]);
  let week = Number(match[2]);
  week--;
  if (week < 1) {
    year--;
    week = getIsoWeeksInYear(year);
  }
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Get the next ISO week string by incrementing the week number.
 */
export function getNextWeek(weekStr: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!match) return weekStr;
  let year = Number(match[1]);
  let week = Number(match[2]);
  week++;
  if (week > getIsoWeeksInYear(year)) {
    year++;
    week = 1;
  }
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Check if a week string represents the current week.
 */
export function isCurrentWeek(weekStr: string): boolean {
  return weekStr === getCurrentIsoWeek();
}
