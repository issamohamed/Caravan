import { checkBirthDate } from './dates'
import { checkDuplicate, duplicateFlag, type DuplicateCheck, type Person } from './duplicates'
import { checkNote } from './masking'
import { isSingleName } from './names'
import { checkPhone } from './phone'
import type { Flag, Severity } from './types'

export type ExistingRecord = Person & { id: string }
export type ReferralRow = Person & { row: number; note?: string | null }
export type RowResult = {
  row: number
  name: string
  status: 'ready' | Severity
  flags: Flag[]
  /** The referral note with ID-shaped numbers hidden. This is the only copy of the note to keep. */
  note: string | null
  /** Records worth comparing, closest first. */
  matches: { recordId: string; check: DuplicateCheck }[]
}

const WORST_FIRST: Severity[] = ['held', 'review', 'note']

/** Runs every check on one referral row. `today` is an ISO date. The inputs are never changed. */
export function checkRow(row: ReferralRow, records: ExistingRecord[], today: string): RowResult {
  const note = checkNote(row.note)
  const compared = records.map((record) => ({ recordId: record.id, check: checkDuplicate(row, record) }))
  const matches = compared.filter((c) => c.check.flagged).toSorted((a, b) => b.check.score - a.check.score)

  const flags = [
    checkBirthDate(row.dob, today),
    checkPhone(row.phone),
    note.flag,
    matches.length ? duplicateFlag(matches[0].check) : null,
    !matches.length && compared.some((c) => c.check.nameOrderDiffers) ? ({ check: 'name-order', severity: 'note', finding: 'Name order differs from the record on file. It’s kept as entered, not flipped.' } satisfies Flag) : null,
    isSingleName(row.name) ? ({ check: 'single-name', severity: 'note', finding: 'One legal name only. Accepted as entered; no placeholder last name added.' } satisfies Flag) : null,
  ].filter((flag): flag is Flag => flag !== null)

  return { row: row.row, name: row.name, status: WORST_FIRST.find((severity) => flags.some((flag) => flag.severity === severity)) ?? 'ready', flags, note: note.text, matches }
}
