import { describe, expect, it } from 'vitest'
import { compareNames, isSingleName, jaroWinkler, nameTokens } from './names'

describe('jaroWinkler()', () => {
  it('matches the published reference values', () => {
    expect(jaroWinkler('martha', 'marhta')).toBeCloseTo(0.961, 3)
    expect(jaroWinkler('dwayne', 'duane')).toBeCloseTo(0.84, 2)
  })

  it('is 1 for identical strings and 0 for nothing in common', () => {
    expect(jaroWinkler('amina', 'amina')).toBe(1)
    expect(jaroWinkler('abc', 'xyz')).toBe(0)
  })
})

describe('nameTokens()', () => {
  it('reads “Last, First” as First Last', () => {
    expect(nameTokens('Okafor, James').map((t) => t.key)).toEqual(['james', 'okafor'])
  })

  it('splits hyphens and drops periods and apostrophes', () => {
    expect(nameTokens("Anne-Marie O'Brien").map((t) => t.key)).toEqual(['anne', 'marie', 'obrien'])
    expect(nameTokens('J. Okafor').map((t) => t.key)).toEqual(['j', 'okafor'])
  })

  it('ignores blank names', () => {
    expect(nameTokens('   ')).toEqual([])
  })
})

describe('compareNames()', () => {
  it('treats case, accents and “Last, First” as the same name', () => {
    expect(compareNames('MARIA SANTOS', 'maria santos').result).toBe('same')
    expect(compareNames('Nguyễn Lan', 'Nguyen Lan').result).toBe('same')
    expect(compareNames('Santos, Maria', 'Maria Santos').result).toBe('same')
  })

  it('calls a listed spelling variant close and says which one', () => {
    const c = compareNames('Amina Warsame', 'Aamina Warsame')
    expect(c.result).toBe('close')
    expect(c.why).toContain('Common spelling variant')
    expect(c.why).toMatch(/Amina \/ Aamina|Aamina \/ Amina/)
  })

  it('catches variants that similarity scoring alone would miss', () => {
    expect(compareNames('Muhammad Ali', 'Mohamed Ali').result).toBe('close')
    expect(compareNames('Catherine Holm', 'Katherine Holm').result).toBe('close')
  })

  it('calls a likely typo close', () => {
    const c = compareNames('Lindqvist Peter', 'Lindquist Peter')
    expect(c.result).toBe('close')
    expect(c.why).toMatch(/Close spelling/)
  })

  it('calls an added family name close (the seeded duplicate)', () => {
    const c = compareNames('Amina Warsame Abdi', 'Aamina Warsame')
    expect(c.result).toBe('close')
    expect(c.why).toMatch(/plus an added name/)
  })

  it('calls family-name-first order close, without flipping anything', () => {
    const c = compareNames('Nguyen Thi Lan', 'Lan Thi Nguyen')
    expect(c).toMatchObject({ result: 'close', orderDiffers: true })
    expect(c.why).toMatch(/different order/)
  })

  it('calls a single legal name close to a longer record', () => {
    const c = compareNames('Sukarni', 'Sukarni Wijaya')
    expect(c.result).toBe('close')
    expect(c.why).toMatch(/single name/)
  })

  it('lets an initial stand in for a name, if another part really matches', () => {
    expect(compareNames('J. Okafor', 'James Okafor').result).toBe('close')
    expect(compareNames('J.', 'James Okafor').result).toBe('different')
    expect(compareNames('K. Okafor', 'James Okafor').result).toBe('different')
  })

  it('keeps different people different', () => {
    expect(compareNames('Maria Santos', 'Ana Santos').result).toBe('different')
    expect(compareNames('Jan Lee', 'Jen Lee').result).toBe('different')
    expect(compareNames('Li Wei', 'Le Wei').result).toBe('different')
  })

  it('reports a blank name as missing, not as a mismatch', () => {
    expect(compareNames('', 'Maria Santos').result).toBe('missing')
    expect(compareNames('Maria Santos', '  ').result).toBe('missing')
  })
})

describe('isSingleName()', () => {
  it('spots one legal name, but not an initial or a full name', () => {
    expect(isSingleName('Sukarni')).toBe(true)
    expect(isSingleName('J.')).toBe(false)
    expect(isSingleName('Sukarni Wijaya')).toBe(false)
    expect(isSingleName('')).toBe(false)
  })
})
