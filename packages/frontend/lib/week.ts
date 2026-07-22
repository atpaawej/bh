/**
 * ISO week helpers for the leaderboard week picker.
 *
 * Re-exports from @bh/shared so the backend and frontend share one
 * implementation.  Only display helpers that couple strongly to the
 * frontend's label formatting live here.
 */
export {
  getIsoWeeksInYear,
  getCurrentIsoWeek,
  getWeekRangeFromIsoWeek,
  getPrevWeek,
  getNextWeek,
  formatWeekLabel,
  isCurrentWeek,
  resolveWeekRange,
  getWeekRange,
} from "@bh/shared";
export type { WeekRange } from "@bh/shared";
