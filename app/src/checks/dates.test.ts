import { describe, expect, it } from 'vitest'
import { checkBirthDate, checkCoverageEnd, displayDate, parseDate } from './dates'

const today = '2026-10-28'

describe('parseDate()', () => {
  it('reads both date formats', () => {
    expect(parseDate('03/14/1988')).toBe('1988-03-14')
    expect(parseDate('3/4/1988')).toBe('1988-03-04')
    expect(parseDate('1988-03-14')).toBe('1988-03-14')
    expect(parseDate('  03/14/1988 ')).toBe('1988-03-14')
  })

  it('accepts a leap day only in a leap year', () => {
    expect(parseDate('02/29/2024')).toBe('2024-02-29')
    expect(parseDate('02/29/2023')).toBeNull()
  })

  it.each(['02/30/1990', '13/01/2000', '00/10/2000', '01/02/26', 'not a date', '', null, undefined])('rejects %s', (value) => {
    expect(parseDate(value)).toBeNull()
  })
})

describe('displayDate()', () => {
  it('shows an ISO date the way the desk reads it', () => {
    expect(displayDate('2062-04-02')).toBe('04/02/2062')
  })
})

describe('checkBirthDate()', () => {
  it.each(['', '   ', null, undefined])('holds a blank date of birth (%s)', (value) => {
    expect(checkBirthDate(value, today)).toMatchObject({ check: 'dob-missing', severity: 'held', action: 'request' })
  })

  it('holds a date in the future and says which date (the seeded typo)', () => {
    const flag = checkBirthDate('04/02/2062', today)
    expect(flag).toMatchObject({ check: 'dob-future', severity: 'held', action: 'fixdate' })
    expect(flag?.finding).toContain('04/02/2062')
  })

  it('accepts a past date, and a baby born today', () => {
    expect(checkBirthDate('03/14/1988', today)).toBeNull()
    expect(checkBirthDate('10/28/2026', today)).toBeNull()
  })

  it('holds a date it can’t read, without repeating what was typed', () => {
    const flag = checkBirthDate('000-12-3456', today)
    expect(flag).toMatchObject({ check: 'dob-unreadable', severity: 'held' })
    expect(flag?.finding).not.toContain('000-12-3456')
  })
})

describe('checkCoverageEnd()', () => {
  it('holds coverage that ended before the visit', () => {
    const flag = checkCoverageEnd('09/30/2026', today)
    expect(flag).toMatchObject({ check: 'coverage-ended', severity: 'held', action: 'request' })
    expect(flag?.finding).toContain('Coverage ended 09/30/2026')
  })

  it('still counts coverage on the day it ends, and any time before', () => {
    expect(checkCoverageEnd('10/28/2026', today)).toBeNull()
    expect(checkCoverageEnd('12/31/2026', today)).toBeNull()
  })

  it.each(['', null, undefined])('treats a blank end date as open-ended (%s)', (value) => {
    expect(checkCoverageEnd(value, today)).toBeNull()
  })

  it('asks a person to look at an unreadable end date', () => {
    const flag = checkCoverageEnd('soon', today)
    expect(flag).toMatchObject({ check: 'coverage-unreadable', severity: 'review' })
    expect(flag?.finding).not.toContain('soon')
  })
})
