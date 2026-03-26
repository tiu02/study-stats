import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDuration, formatDate, STATUS_LABELS, getUrgency, hexToRgb, cardBackground } from './format'

// --------------- formatDuration ---------------

describe('formatDuration', () => {
  it('returns "0m" for 0', () => {
    expect(formatDuration(0)).toBe('0m')
  })

  it('returns "0m" for null', () => {
    expect(formatDuration(null)).toBe('0m')
  })

  it('returns "0m" for undefined', () => {
    expect(formatDuration(undefined)).toBe('0m')
  })

  it('returns "0m" for NaN', () => {
    expect(formatDuration(NaN)).toBe('0m')
  })

  it('returns minutes only for values under 60', () => {
    expect(formatDuration(30)).toBe('30m')
  })

  it('returns hours only when remainder minutes are 0', () => {
    expect(formatDuration(60)).toBe('1h')
  })

  it('returns hours and minutes combined', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })

  it('handles multi-hour durations with leftover minutes', () => {
    expect(formatDuration(125)).toBe('2h 5m')
  })

  it('handles exactly 24 hours', () => {
    expect(formatDuration(1440)).toBe('24h')
  })
})

// --------------- formatDate ---------------

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('formats a Date object', () => {
    // Use Date constructor (not string) to avoid timezone-dependent date parsing
    expect(formatDate(new Date(2026, 2, 25))).toBe('Mar 25, 2026')
  })

  it('formats a Firestore timestamp (object with toDate)', () => {
    const ts = { toDate: () => new Date(2026, 3, 1) }
    expect(formatDate(ts)).toBe('Apr 1, 2026')
  })

  it('formats an ISO datetime string', () => {
    // Local datetime string (no Z suffix) avoids timezone boundary issues
    expect(formatDate('2026-06-15T12:00:00')).toBe('Jun 15, 2026')
  })
})

// --------------- STATUS_LABELS ---------------

describe('STATUS_LABELS', () => {
  it('maps complete', () => {
    expect(STATUS_LABELS['complete']).toBe('Complete')
  })

  it('maps in-progress', () => {
    expect(STATUS_LABELS['in-progress']).toBe('In Progress')
  })

  it('maps incomplete', () => {
    expect(STATUS_LABELS['incomplete']).toBe('Incomplete')
  })
})

// --------------- getUrgency ---------------

describe('getUrgency', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Pin "now" to Mar 25, 2026 noon local time
    vi.setSystemTime(new Date(2026, 2, 25, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for null', () => {
    expect(getUrgency(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getUrgency(undefined)).toBeNull()
  })

  it('returns "overdue" for yesterday', () => {
    expect(getUrgency(new Date(2026, 2, 24))).toBe('overdue')
  })

  it('returns "overdue" for dates further in the past', () => {
    expect(getUrgency(new Date(2026, 1, 1))).toBe('overdue')
  })

  it('returns "urgent" for today (0 calendar days until due)', () => {
    expect(getUrgency(new Date(2026, 2, 25))).toBe('urgent')
  })

  it('returns "urgent" for 1 day from now', () => {
    expect(getUrgency(new Date(2026, 2, 26))).toBe('urgent')
  })

  it('returns "urgent" for exactly 2 days from now', () => {
    expect(getUrgency(new Date(2026, 2, 27))).toBe('urgent')
  })

  it('returns "soon" for 3 days from now', () => {
    expect(getUrgency(new Date(2026, 2, 28))).toBe('soon')
  })

  it('returns "soon" for exactly 5 days from now', () => {
    expect(getUrgency(new Date(2026, 2, 30))).toBe('soon')
  })

  it('returns null for 6 days from now', () => {
    expect(getUrgency(new Date(2026, 2, 31))).toBeNull()
  })

  it('returns null for far-future dates', () => {
    expect(getUrgency(new Date(2026, 11, 31))).toBeNull()
  })

  it('accepts a Firestore timestamp object with toDate()', () => {
    const ts = { toDate: () => new Date(2026, 2, 24) }
    expect(getUrgency(ts)).toBe('overdue')
  })
})

// --------------- hexToRgb ---------------

describe('hexToRgb', () => {
  it('parses a 6-digit hex with #', () => {
    expect(hexToRgb('#6366F1')).toEqual({ r: 99, g: 102, b: 241 })
  })

  it('parses black (#000000)', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses white (#ffffff)', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('works without leading #', () => {
    expect(hexToRgb('6366F1')).toEqual({ r: 99, g: 102, b: 241 })
  })

  it('returns null for null', () => {
    expect(hexToRgb(null)).toBeNull()
  })

  it('returns null for an invalid string', () => {
    expect(hexToRgb('not-a-color')).toBeNull()
  })

  it('returns null for 3-character shorthand hex (not supported by regex)', () => {
    expect(hexToRgb('#fff')).toBeNull()
  })
})

// --------------- cardBackground ---------------

describe('cardBackground', () => {
  it('returns an rgba string at 0.04 opacity for a valid hex', () => {
    expect(cardBackground('#000000')).toBe('rgba(0, 0, 0, 0.04)')
  })

  it('falls back to indigo when hex is null', () => {
    expect(cardBackground(null)).toBe('rgba(99, 102, 241, 0.04)')
  })

  it('falls back to indigo when hex is undefined', () => {
    expect(cardBackground(undefined)).toBe('rgba(99, 102, 241, 0.04)')
  })

  it('returns undefined for a truthy but invalid hex (no fallback applied)', () => {
    // hexToRgb('not-valid') → null → cardBackground returns undefined
    expect(cardBackground('not-valid')).toBeUndefined()
  })

  it('computes white correctly', () => {
    expect(cardBackground('#ffffff')).toBe('rgba(255, 255, 255, 0.04)')
  })
})
