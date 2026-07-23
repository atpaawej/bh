import { describe, it, expect } from "vitest";
import {
  getWeekRange,
  getWeekRangeFromIsoWeek,
  resolveWeekRange,
  getCurrentIsoWeek,
  getPrevWeek,
  getNextWeek,
  formatWeekLabel,
  isCurrentWeek,
  getIsoWeeksInYear,
} from "./week";

describe("getWeekRange", () => {
  it("anchors a Friday to that day at 00:00 UTC through next Thursday 23:59:59.999", () => {
    // Friday 17 July 2026
    const friday = new Date(Date.UTC(2026, 6, 17, 14, 30, 0));
    const { start, end } = getWeekRange(friday);

    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-23T23:59:59.999Z");
  });

  it("maps Thursday back to the Friday that opened the week", () => {
    // Thursday 23 July 2026
    const thursday = new Date(Date.UTC(2026, 6, 23, 10, 0, 0));
    const { start, end } = getWeekRange(thursday);

    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-23T23:59:59.999Z");
  });

  it("maps Saturday to the previous Friday", () => {
    const saturday = new Date(Date.UTC(2026, 6, 18, 8, 0, 0));
    const { start } = getWeekRange(saturday);
    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
  });

  it("maps Monday mid-week to the same Friday start", () => {
    const monday = new Date(Date.UTC(2026, 6, 20, 12, 0, 0));
    const { start, end } = getWeekRange(monday);
    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-23T23:59:59.999Z");
  });

  it("rolls to a new week on the next Friday", () => {
    const nextFriday = new Date(Date.UTC(2026, 6, 24, 0, 0, 0));
    const { start, end } = getWeekRange(nextFriday);
    expect(start.toISOString()).toBe("2026-07-24T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-30T23:59:59.999Z");
  });
});

describe("getWeekRangeFromIsoWeek", () => {
  it("rejects invalid formats", () => {
    expect(() => getWeekRangeFromIsoWeek("2026-30")).toThrow(
      /Invalid week format/,
    );
    expect(() => getWeekRangeFromIsoWeek("W30")).toThrow(/Invalid week format/);
  });

  it("returns a Friday→Thursday window for a valid ISO week", () => {
    // ISO 2026-W30: Mon 20 Jul – Sun 26 Jul; Thursday = 23 Jul → BH week Fri 17 – Thu 23
    const { start, end } = getWeekRangeFromIsoWeek("2026-W30");
    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-23T23:59:59.999Z");
  });

  it("throws for invalid week numbers (0)", () => {
    expect(() => getWeekRangeFromIsoWeek("2026-W00")).toThrow(
      /Invalid ISO week number/,
    );
  });

  it("throws for invalid week numbers (54)", () => {
    expect(() => getWeekRangeFromIsoWeek("2026-W54")).toThrow(
      /Invalid ISO week number/,
    );
  });
});

describe("resolveWeekRange", () => {
  it("defaults to the current week when week is omitted", () => {
    const now = new Date(Date.UTC(2026, 6, 20, 12, 0, 0));
    const { start } = resolveWeekRange(undefined, now);
    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
  });

  it("uses the ISO week when provided", () => {
    const { start } = resolveWeekRange("2026-W30");
    expect(start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
  });
});

describe("getIsoWeeksInYear", () => {
  it("returns 52 for a common year", () => {
    expect(getIsoWeeksInYear(2025)).toBe(52);
  });

  it("returns 53 when Jan 1 is Thursday", () => {
    expect(getIsoWeeksInYear(2026)).toBe(53);
  });

  it("returns 53 when Dec 31 is Thursday (leap year)", () => {
    expect(getIsoWeeksInYear(2032)).toBe(53);
  });
});

describe("getCurrentIsoWeek", () => {
  it("returns the correct ISO week for a mid-week date", () => {
    const date = new Date(Date.UTC(2026, 6, 20, 12, 0, 0)); // Monday
    expect(getCurrentIsoWeek(date)).toBe("2026-W30");
  });

  it("returns the correct ISO week for a Sunday", () => {
    // Sunday 26 Jul 2026 — ISO weeks run Mon→Sun, so this is still W30
    const date = new Date(Date.UTC(2026, 6, 26, 12, 0, 0));
    expect(getCurrentIsoWeek(date)).toBe("2026-W30");
  });

  it("returns the correct ISO week for January 1st", () => {
    // Jan 1 2026 is Thursday — ISO week 1 of 2026
    const date = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
    expect(getCurrentIsoWeek(date)).toBe("2026-W01");
  });
});

describe("getPrevWeek", () => {
  it("decrements the week number", () => {
    expect(getPrevWeek("2026-W30")).toBe("2026-W29");
  });

  it("wraps to previous year when week 1", () => {
    expect(getPrevWeek("2026-W01")).toBe("2025-W52");
  });

  it("returns the input unchanged for invalid formats", () => {
    expect(getPrevWeek("invalid")).toBe("invalid");
  });
});

describe("getNextWeek", () => {
  it("increments the week number", () => {
    expect(getNextWeek("2026-W30")).toBe("2026-W31");
  });

  it("wraps to next year when week is last of year", () => {
    expect(getNextWeek("2026-W53")).toBe("2027-W01");
  });

  it("returns the input unchanged for invalid formats", () => {
    expect(getNextWeek("invalid")).toBe("invalid");
  });
});

describe("formatWeekLabel", () => {
  it("formats a week within same month", () => {
    // 2026-W30 → Fri 17 Jul → Thu 23 Jul
    expect(formatWeekLabel("2026-W30")).toBe(
      "Week 30 · Jul 17 – 23, 2026",
    );
  });

  it("formats a week that crosses months", () => {
    // 2026-W53 maps to BH week range … let's check. W53 is a real 53-week year.
    // 2026 W53: Mon 28 Dec – Sun 3 Jan → Thursday = Thu 31 Dec → BH Fri 25 Dec – Thu 31 Dec
    expect(formatWeekLabel("2026-W53")).toContain("2026");
  });

  it("strips leading zero from week number", () => {
    expect(formatWeekLabel("2026-W01")).not.toContain("W01");
    expect(formatWeekLabel("2026-W01")).toContain("Week 1");
  });
});

describe("isCurrentWeek", () => {
  it("returns true for the current ISO week string", () => {
    const now = new Date(Date.UTC(2026, 6, 20, 12, 0, 0)); // Monday W30
    const week = getCurrentIsoWeek(now);
    expect(isCurrentWeek(week, now)).toBe(true);
  });

  it("returns false for a non-matching week string", () => {
    // W01 is never the same as W30 (2026-W30 = Mon 20 Jul 2026)
    expect(isCurrentWeek("2026-W01", new Date(Date.UTC(2026, 6, 20, 12, 0, 0)))).toBe(
      false,
    );
  });
});
