import { describe, expect, it } from 'vitest'
import { initial, reducer, type Act, type WebState } from './store'

const run = (s: WebState, ...acts: Act[]) => acts.reduce(reducer, s)
const ticks = (s: WebState, n: number) => run(s, ...Array.from({ length: n }, () => ({ type: 'tick' }) as Act))

describe('initial state', () => {
  it('starts live, on the first tick, with the import waiting for review', () => {
    const s = initial()
    expect(s).toMatchObject({ live: true, tick: 0, liveEvent: null })
    expect(s.imp.stage).toBe('review')
  })

  it('gives each run its own copy of the demo data', () => {
    const a = initial()
    const b = initial()
    a.arrivals[0].name = 'Changed'
    expect(b.arrivals[0].name).not.toBe('Changed')
  })
})

describe('check-in steps', () => {
  it('marks one step by its id and leaves the others alone', () => {
    const s0 = initial()
    const a = s0.arrivals[0]
    const [first, ...rest] = Object.keys(a.steps)
    const s = run(s0, { type: 'step', id: a.id, step: first, state: 'desk', note: 'Done at the desk' })
    const after = s.arrivals.find((x) => x.id === a.id)!
    expect(after.steps[first]).toBe('desk')
    expect(after.stepNotes?.[first]).toBe('Done at the desk')
    for (const k of rest) expect(after.steps[k]).toBe(a.steps[k])
  })

  it('keeps every patient’s progress when a routine’s steps are reordered (progress is stored by step id)', () => {
    const s0 = initial()
    const r = s0.routines[0]
    const reordered = run(s0, { type: 'routine', id: r.id, patch: { steps: [...r.steps].reverse() } })
    expect(reordered.routines[0].steps.map((x) => x.id)).toEqual([...r.steps].reverse().map((x) => x.id))
    expect(reordered.arrivals).toEqual(s0.arrivals)
  })
})

/* Principle 4: every decision has a reason and an audit entry. */
describe('audit log', () => {
  it('adds entries to the top with a new id and a 24-hour time', () => {
    const s0 = initial()
    const s = run(
      s0,
      { type: 'audit', entry: { type: 'override', what: 'First', who: 'DS', reason: 'Because', where: 'Desk 4' } },
      { type: 'audit', entry: { type: 'override', what: 'Second', who: 'DS', reason: 'Because', where: 'Desk 4' } },
    )
    expect(s.audit).toHaveLength(s0.audit.length + 2)
    expect(s.audit[0].what).toBe('Second')
    expect(s.audit[0].id).toBeGreaterThan(s.audit[1].id)
    expect(s.audit[0].time).toMatch(/^\d{2}:\d{2}$/)
    expect(s.audit[0].reason).toBe('Because')
  })
})

describe('undo', () => {
  it('replace puts back the exact earlier state', () => {
    const before = initial()
    const changed = run(before, { type: 'queue', id: before.queue[0].id, patch: { status: 'resolved' } })
    expect(changed.queue[0].status).toBe('resolved')
    expect(run(changed, { type: 'replace', state: before })).toBe(before)
  })
})

describe('question sets', () => {
  it('publishing bumps the version, goes live, clears edit marks and records history', () => {
    const s0 = initial()
    const set = s0.qsets[0]
    const edited = run(s0, { type: 'qitem', set: set.id, item: set.items[0].id, patch: { simple: 'New words', edited: true } })
    expect(edited.qsets[0].items[0]).toMatchObject({ simple: 'New words', edited: true })
    const s = run(edited, { type: 'publish', set: set.id, what: 'Reworded question 1', by: 'DS' })
    const after = s.qsets[0]
    expect(after.version).toBe(set.version + 1)
    expect(after.status).toBe('live')
    expect(after.items.every((it) => !it.edited)).toBe(true)
    expect(after.history[0]).toMatchObject({ v: set.version + 1, by: 'DS', what: 'Reworded question 1' })
  })
})

describe('imports', () => {
  it('patches one row by its row number', () => {
    const s0 = initial()
    const row = s0.imp.rows[0]
    const s = run(s0, { type: 'row', row: row.row, patch: { status: 'ready' } })
    expect(s.imp.rows[0].status).toBe('ready')
    expect(s.imp.rows.slice(1)).toEqual(s0.imp.rows.slice(1))
  })
})

describe('the scripted live morning', () => {
  it('checks Linda Osei in by phone on the third tick', () => {
    const s = ticks(initial(), 3)
    expect(s.phone.find((p) => p.id === 'osei')).toMatchObject({ state: 'checked', number: '216' })
    expect(s.liveEvent).toMatchObject({ kind: 'checked', phoneId: 'osei' })
    expect(s.audit[0].what).toMatch(/Linda Osei checked in by phone/)
  })

  it('has Grace Holm start on the fourth tick and ask for help on the seventh', () => {
    const four = ticks(initial(), 4)
    expect(four.phone.find((p) => p.id === 'holm')).toMatchObject({ state: 'progress', q: 1 })
    const seven = ticks(four, 3)
    expect(seven.phone.find((p) => p.id === 'holm')?.state).toBe('help')
    expect(seven.liveEvent).toMatchObject({ kind: 'help', phoneId: 'holm' })
  })

  it('does nothing to a patient the desk already helped', () => {
    const four = ticks(initial(), 4)
    const going = run(four, { type: 'phone', id: 'holm', patch: { state: 'going' } })
    expect(ticks(going, 3).phone.find((p) => p.id === 'holm')?.state).toBe('going')
  })

  it('pausing flips the flag the timer reads', () => {
    const s = run(initial(), { type: 'live', on: false })
    expect(s.live).toBe(false)
  })
})
