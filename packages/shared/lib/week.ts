/**
 * BharatHunt weekly cycle: Friday 00:00:00.000 UTC → Thursday 23:59:59.999 UTC.
 *
 * ISO weeks run Monday→Sunday. A BH week is anchored to the ISO week's
 * Thursday (ISO weeks are defined by their Thursday), then expanded to the
 * Friday→Thursday window containing that day.
 *
 * Everyone — frontend and backend — imports from here so the convention is
 * guaranteed consistent.
 */

export interface WeekRange {
  start: Date;
  end: Date;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// ── BH week helpers ────────────────────────────────────────────────────

/**
 * Days since the most recent Friday (UTC).
 * Friday → 0, Saturday → 1, …, Thursday → 6.
 */
function daysSinceFriday(date: Date): number {
  const day = date.getUTCDay(); // 0=Sun … 5=Fri 6=Sat
  return (day + 2) % 7;
}

/**
 * Current (or given) BH week range anchored to Friday 00:00 UTC.
 */
export function getWeekRange(date: Date = new Date()): WeekRange {
  const days = daysSinceFriday(date);
  const start = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - days,
      0, 0, 0, 0,
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

// ── ISO week parsing ───────────────────────────────────────────────────

/**
 * Number of ISO weeks in a given year (52 or 53).
 * A year has 53 ISO weeks if Jan 1 is Thursday (common year)
 * or Dec 31 is Thursday (leap year).
 */
export function getIsoWeeksInYear(year: number): number {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));
  return jan1.getUTCDay() === 4 || dec31.getUTCDay() === 4 ? 53 : 52;
}

/**
 * Returns the current ISO week string (e.g. "2026-W30") for a given date.
 *
 * ISO weeks run Monday→Sunday; each week belongs to whichever year contains
 * its Thursday.  This function adjusts `date` to the Thursday of its ISO week
 * (going backwards for Fri/Sat/Sun, forwards for Mon/Tue/Wed), then computes
 * the week number from that Thursday's distance to Jan 4.
 */
export function getCurrentIsoWeek(date: Date = new Date()): string {
  // Move to the Thursday of the same ISO week (Mon-Sun).
  //   Mon: +3, Tue: +2, Wed: +1, Thu: 0, Fri: -1, Sat: -2, Sun: -3
  const thursday = new Date(date);
  thursday.setUTCDate(
    date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7),
  );

  const year = thursday.getUTCFullYear();

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));

  const weekNumber = Math.ceil(
    (thursday.getTime() - jan4.getTime()) / (7 * 86400000) + 1,
  );

  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * Parse an ISO week string like "2026-W30" into a BH Friday→Thursday window.
 * Uses the Thursday of that ISO week, then expands to the BH week containing it.
 */
export function getWeekRangeFromIsoWeek(weekStr: string): WeekRange {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!match) {
    throw new Error(
      `Invalid week format: ${weekStr}. Expected YYYY-Wnn (e.g. 2026-W30)`,
    );
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) {
    throw new Error(`Invalid ISO week number: ${week}`);
  }

  // Find Monday of ISO week 1 for this year (Jan 4 is always in week 1)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfJan4 = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (dayOfJan4 - 1));

  // Monday of target ISO week
  const mondayOfWeek = new Date(mondayWeek1);
  mondayOfWeek.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

  // Thursday of this ISO week → BH week containing that Thursday
  const thursday = new Date(mondayOfWeek);
  thursday.setUTCDate(mondayOfWeek.getUTCDate() + 3);

  return getWeekRange(thursday);
}

/**
 * Resolve list params into a concrete week range.
 * No week param → current week. week=YYYY-Wnn → that ISO week mapped to BH window.
 */
export function resolveWeekRange(
  week?: string,
  now: Date = new Date(),
): WeekRange {
  if (!week) return getWeekRange(now);
  return getWeekRangeFromIsoWeek(week);
}

// ── Navigation helpers ─────────────────────────────────────────────────

/**
 * Get the previous ISO week string.
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
 * Get the next ISO week string.
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

// ── Display helpers ────────────────────────────────────────────────────

/**
 * Format a week string into a human-readable label.
 * "2026-W30" → "Week 30 · Jul 18 – Jul 24, 2026"
 */
export function formatWeekLabel(weekStr: string): string {
  const { start, end } = getWeekRangeFromIsoWeek(weekStr);
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
 * Check if a week string represents the current week.
 */
export function isCurrentWeek(weekStr: string): boolean {
  return weekStr === getCurrentIsoWeek();
}
