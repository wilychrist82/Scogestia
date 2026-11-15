import { describe, it, expect } from 'vitest'
import { formatAcademicYearDisplay, getDynamicAcademicYear } from '../lib/academic-year'

describe('Academic year helpers', () => {
  it('returns previous-current academic year before August (Jan-Jul)', () => {
    const july31 = new Date(2026, 6, 31) // month 6 = juillet
    expect(getDynamicAcademicYear('-', july31)).toBe('2025-2026')
    expect(getDynamicAcademicYear('/', july31)).toBe('2025/2026')
    expect(getDynamicAcademicYear(undefined, new Date(2026, 0, 15))).toBe('2025-2026')
  })

  it('returns current-next academic year starting in August (Aug-Dec)', () => {
    const aug1 = new Date(2026, 7, 1) // month 7 = août
    const nov15 = new Date(2026, 10, 15)
    expect(getDynamicAcademicYear('-', aug1)).toBe('2026-2027')
    expect(getDynamicAcademicYear('/', nov15)).toBe('2026/2027')
  })

  it('formats academic year strings consistently for UI and bulletins', () => {
    expect(formatAcademicYearDisplay('2026-2027')).toBe('2026 - 2027')
    expect(formatAcademicYearDisplay('2026/2027')).toBe('2026 - 2027')
    expect(formatAcademicYearDisplay(' 2026 - 2027 ')).toBe('2026 - 2027')
  })

  it('falls back to dynamic year when formatAcademicYearDisplay receives null or empty string', () => {
    const expected = getDynamicAcademicYear('-').replace('-', ' - ')
    expect(formatAcademicYearDisplay(null)).toBe(expected)
    expect(formatAcademicYearDisplay('   ')).toBe(expected)
  })
})
