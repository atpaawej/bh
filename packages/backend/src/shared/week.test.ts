import { describe, it, expect } from 'vitest'
import { getWeekRange, getWeekRangeFromIsoWeek, resolveWeekRange } from './week'

describe('getWeekRange', () => {
  it('anchors a Friday to that day at 00:00 UTC through next Thursday 23:59:59.999', () => {
    // Friday 17 July 2026
    const friday = new Date(Date.UTC(2026, 6, 17, 14, 30, 0))
    const { start, end } = getWeekRange(friday)

    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-23T23:59:59.999Z')
  })

  it('maps Thursday back to the Friday that opened the week', () => {
    // Thursday 23 July 2026
    const thursday = new Date(Date.UTC(2026, 6, 23, 10, 0, 0))
    const { start, end } = getWeekRange(thursday)

    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-23T23:59:59.999Z')
  })

  it('maps Saturday to the previous Friday', () => {
    const saturday = new Date(Date.UTC(2026, 6, 18, 8, 0, 0))
    const { start } = getWeekRange(saturday)
    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
  })

  it('maps Monday mid-week to the same Friday start', () => {
    const monday = new Date(Date.UTC(2026, 6, 20, 12, 0, 0))
    const { start, end } = getWeekRange(monday)
    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-23T23:59:59.999Z')
  })

  it('rolls to a new week on the next Friday', () => {
    const nextFriday = new Date(Date.UTC(2026, 6, 24, 0, 0, 0))
    const { start, end } = getWeekRange(nextFriday)
    expect(start.toISOString()).toBe('2026-07-24T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-30T23:59:59.999Z')
  })
})

describe('getWeekRangeFromIsoWeek', () => {
  it('rejects invalid formats', () => {
    expect(() => getWeekRangeFromIsoWeek('2026-30')).toThrow(/Invalid week format/)
    expect(() => getWeekRangeFromIsoWeek('W30')).toThrow(/Invalid week format/)
  })

  it('returns a Friday→Thursday window for a valid ISO week', () => {
    // ISO 2026-W30: Mon 20 Jul – Sun 26 Jul; Thursday = 23 Jul → BH week Fri 17 – Thu 23
    const { start, end } = getWeekRangeFromIsoWeek('2026-W30')
    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-23T23:59:59.999Z')
  })
})

describe('resolveWeekRange', () => {
  it('defaults to the current week when week is omitted', () => {
    const now = new Date(Date.UTC(2026, 6, 20, 12, 0, 0))
    const { start } = resolveWeekRange(undefined, now)
    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
  })

  it('uses the ISO week when provided', () => {
    const { start } = resolveWeekRange('2026-W30')
    expect(start.toISOString()).toBe('2026-07-17T00:00:00.000Z')
  })
})
