import type { Flag } from './types'

/* Dates are compared as ISO strings (YYYY-MM-DD), so time zones can't shift a day.
   "Today" is always passed in: a check never reads the clock, so the same input always gives the same result. */

const MDY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const pad = (n: number) => String(n).padStart(2, '0')

/** Reads MM/DD/YYYY or YYYY-MM-DD and returns an ISO date, or null if it isn't a real calendar date. */
export function parseDate(value?: string | null): string | null {
  const text = value?.trim() ?? ''
  const mdy = MDY.exec(text)
  const iso = ISO.exec(text)
  if (!mdy && !iso) return null
  const [year, month, day] = mdy ? [Number(mdy[3]), Number(mdy[1]), Number(mdy[2])] : [Number(iso![1]), Number(iso![2]), Number(iso![3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Turns an ISO date into the MM/DD/YYYY the desk reads. */
export function displayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

/** Findings never repeat an unreadable value, in case something like an SSN was typed into a date field. */
export function checkBirthDate(value: string | null | undefined, today: string): Flag | null {
  if (!value?.trim()) return { check: 'dob-missing', severity: 'held', finding: 'Date of birth is blank. Without it the record can’t be matched safely.', action: 'request' }
  const iso = parseDate(value)
  if (!iso) return { check: 'dob-unreadable', severity: 'held', finding: 'Date of birth can’t be read as a date. Check it against the referral.', action: 'fixdate' }
  if (iso > today) return { check: 'dob-future', severity: 'held', finding: `Date of birth reads ${displayDate(iso)}, which is in the future. Likely a typo.`, action: 'fixdate' }
  return null
}

/** A blank end date means the coverage is open-ended. Coverage still counts on the day it ends. */
export function checkCoverageEnd(end: string | null | undefined, visitDate: string): Flag | null {
  if (!end?.trim()) return null
  const iso = parseDate(end)
  if (!iso) return { check: 'coverage-unreadable', severity: 'review', finding: 'Coverage end date can’t be read as a date. Check the card with the patient.', action: 'request' }
  if (iso < visitDate) return { check: 'coverage-ended', severity: 'held', finding: `Coverage ended ${displayDate(iso)}. Ask for a current card before the visit is billed.`, action: 'request' }
  return null
}
