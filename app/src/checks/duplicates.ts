import { parseDate } from './dates'
import { compareNames } from './names'
import { phoneDigits } from './phone'
import type { Flag } from './types'

export type Person = { name: string; dob?: string | null; phone?: string | null; memberId?: string | null }
export type FieldResult = 'same' | 'close' | 'different' | 'missing'
export type FieldCheck = { field: 'name' | 'dob' | 'phone' | 'memberId'; result: FieldResult; why?: string }
export type DuplicateCheck = { score: number; flagged: boolean; fields: FieldCheck[]; nameOrderDiffers: boolean }

/** Points out of 100. A name alone can't reach the flag line, because many people share a name. */
const POINTS = { nameSame: 30, nameClose: 20, dob: 30, phone: 20, memberId: 20 }
const FLAG_AT = 40

const LABELS = { dob: 'date of birth', phone: 'phone', memberId: 'insurance ID' } as const

function compareValues(a: string | null, b: string | null): FieldResult {
  if (!a || !b) return 'missing'
  return a === b ? 'same' : 'different'
}

const cleanMemberId = (value?: string | null) => (value ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase() || null

/** Scores how likely two records are the same person. It only ever reports: nothing is merged here. */
export function checkDuplicate(incoming: Person, existing: Person): DuplicateCheck {
  const name = compareNames(incoming.name, existing.name)
  const dob = compareValues(parseDate(incoming.dob), parseDate(existing.dob))
  const phone = compareValues(phoneDigits(incoming.phone) || null, phoneDigits(existing.phone) || null)
  const memberId = compareValues(cleanMemberId(incoming.memberId), cleanMemberId(existing.memberId))

  const score = (name.result === 'same' ? POINTS.nameSame : name.result === 'close' ? POINTS.nameClose : 0) + (dob === 'same' ? POINTS.dob : 0) + (phone === 'same' ? POINTS.phone : 0) + (memberId === 'same' ? POINTS.memberId : 0)

  // Spouses can share a phone and a plan. With different names, only a matching date of birth (twins, a typo) is worth a look.
  const nameAgrees = name.result === 'same' || name.result === 'close'
  return {
    score,
    flagged: score >= FLAG_AT && (nameAgrees || dob === 'same'),
    fields: [
      { field: 'name', result: name.result, why: name.why },
      { field: 'dob', result: dob },
      { field: 'phone', result: phone },
      { field: 'memberId', result: memberId },
    ],
    nameOrderDiffers: name.orderDiffers,
  }
}

export function duplicateFlag(check: DuplicateCheck): Flag {
  const matched = check.fields.flatMap((f) => (f.field !== 'name' && f.result === 'same' ? [LABELS[f.field]] : []))
  const list = matched.length > 1 ? `${matched.slice(0, -1).join(', ')} and ${matched[matched.length - 1]}` : matched[0]
  const name = check.fields[0]
  const ending = name.result === 'close' ? `. Name: ${name.why![0].toLowerCase()}${name.why!.slice(1)}.` : name.result === 'same' ? ', and the name is the same.' : ', but the name is different. It could be a relative.'
  return {
    check: 'duplicate',
    severity: 'review',
    finding: `Possible duplicate. ${list[0].toUpperCase()}${list.slice(1)} ${matched.length > 1 ? 'match' : 'matches'} an existing record${ending}`,
    action: 'compare',
  }
}
