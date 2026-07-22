import { describe, it, expect } from 'vitest'
import { engagementSummary } from '../index'

describe('engagementSummary', () => {
  it('formats vote count and includes comment count', () => {
    expect(engagementSummary(42, 3)).toBe('42 votes · 3 comments')
  })

  it('abbreviates thousands', () => {
    expect(engagementSummary(1_234, 56)).toBe('1.2k votes · 56 comments')
  })
})
