import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, Check, ChevronDown, Download, FileUp, RefreshCw, Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { cn, downloadText, toCsv } from '../../shared/util'
import { fhirTargets, importRows as seedRows, type ImportRow } from '../data'
import { nowHM, useStore } from '../store'
import { Button, Card, Chip, H2, Modal, PageHeader, Segmented, inputCls } from '../ui'

type F = 'all' | 'review' | 'held' | 'ready'
const stages = ['Read file', 'Map fields', 'Run checks', 'Review', 'Commit'] as const

export function Imports() {
  const { s, dispatch, go, log, undoable } = useStore()
  const imp = s.imp
  const [filter, setFilter] = useState<F>('all')
  const [showAll, setShowAll] = useState(false)
  const [processing, setProcessing] = useState<{ file: string; stage: number } | null>(null)
  const [drag, setDrag] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [fixing, setFixing] = useState<number | null>(null)
  const [fixDate, setFixDate] = useState('1962-04-02')
  const fileRef = useRef<HTMLInputElement>(null)

  const counts = {
    ready: imp.rows.filter((r) => r.status === 'ready').length,
    review: imp.rows.filter((r) => r.status === 'review').length,
    held: imp.rows.filter((r) => r.status === 'held').length,
    committed: imp.rows.filter((r) => r.status === 'committed').length,
  }
  const filtered = imp.rows.filter((r) => (filter === 'all' ? true : filter === 'ready' ? r.status === 'ready' || r.status === 'committed' : r.status === filter))
  const sorted = filter === 'all' ? [...filtered].sort((a, b) => rank(a) - rank(b)) : filtered
  const visible = showAll ? sorted : sorted.slice(0, 9)
  const currentStage = imp.stage === 'committed' ? 4 : 3

  const startImport = (file: string) => {
    setProcessing({ file, stage: 0 })
    ;[1, 2, 3].forEach((n, i) => window.setTimeout(() => setProcessing({ file, stage: n }), 650 * (i + 1)))
    window.setTimeout(() => {
      setProcessing(null)
      dispatch({
        type: 'imp',
        patch: {
          file,
          at: nowHM(),
          stage: 'review',
          rows: structuredClone(seedRows),
          mapDirty: false,
          recent: [{ file, meta: `24 rows · today ${nowHM()}`, status: 'review' }, ...imp.recent.filter((r) => r.file !== file).slice(0, 3)],
        },
      })
      log('import', `Imported ${file}: 24 rows, 16 ready, 4 to review, 2 held, 2 notes`, 'Uploaded at the desk', 'Imports')
      toast.success(`${file} is staged and checked.`, { description: 'Nothing is saved to a record until you commit.' })
    }, 2700)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    startImport(f?.name ?? 'dropped_file.csv')
  }

  const actOn = (r: ImportRow) => {
    if (r.action === 'compare') go('review', 'q-dup')
    else if (r.action === 'request') {
      dispatch({ type: 'row', row: r.row, patch: { requested: true } })
      log('import', `Requested missing information for row ${r.row} (${r.name})`, 'Asked the referring office', 'Imports')
      toast.success('Request sent to the referring office.', { description: 'The row stays staged until they reply.' })
    } else if (r.action === 'mask') {
      undoable(`Mask confirmed for row ${r.row}.`, [
        { type: 'row', row: r.row, patch: { status: 'ready', finding: 'Number masked and confirmed. Ready to commit.' } },
        { type: 'queue', id: 'q-mask', patch: { status: 'resolved', decision: 'Kept masked' } },
        { type: 'audit', entry: { type: 'check', what: `Confirmed the masked number in row ${r.row} (${r.name})`, who: 'DS', reason: 'ID numbers aren’t kept in notes', where: 'Imports' } },
      ])
    } else if (r.action === 'fixdate') setFixing(r.row)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Bring data in"
        title="Imports"
        description="Drop a file and Caravan maps it, checks every row, and shows you the problems before anything touches a patient record."
        actions={
          <Button
            icon={<Download size={16} aria-hidden="true" />}
            onClick={() => downloadText(`${imp.file.replace(/\.\w+$/, '')}-check-report.csv`, toCsv(imp.rows.map((r) => ({ row: r.row, patient: r.name, result: r.status, finding: r.finding })))) && toast.success('Check report downloaded.')}
          >
            Download check report
          </Button>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-stretch gap-5">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn('flex min-w-0 flex-[3_1_460px] flex-wrap items-center gap-5 rounded-[22px] border-2 border-dashed p-5 transition-colors', drag ? 'border-hot bg-hot-100/70 dark:bg-hot/15' : 'border-teal/50 bg-mist-bg')}
          >
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-hot text-white shadow-solid">
              <Upload size={24} />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <H2 className="text-[20px]">{drag ? 'Drop it here' : 'Drop a file to bring data in'}</H2>
              <p className="text-sm text-fg-muted">Imports are staged and checked first. Nothing reaches a patient record until you commit.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.json,.hl7,.pdf,.txt"
                className="sr-only"
                id="file-in"
                aria-label="Choose a file to import"
                tabIndex={-1}
                onChange={(e) => e.target.files?.[0] && startImport(e.target.files[0].name)}
              />
              <Button variant="primary" onClick={() => fileRef.current?.click()} icon={<FileUp size={16} aria-hidden="true" />}>
                Choose file
              </Button>
              <Button onClick={() => startImport('referrals_week44.csv')}>Use sample file</Button>
            </div>
          </div>
          <div className="flex flex-[1_1_220px] flex-col justify-center gap-2">
            <p className="text-[13px] font-semibold text-fg-muted">Reads</p>
            <ul className="flex flex-wrap gap-1.5">
              {[
                ['CSV or Excel', 'bg-hot-100 text-hot-800 dark:bg-hot/20 dark:text-hot-200'],
                ['FHIR bundle', 'bg-review-bg text-review-fg'],
                ['HL7 v2 ADT', 'bg-done-bg text-done-fg'],
                ['Referral PDF', 'bg-note-bg text-note-fg'],
              ].map(([l, c]) => (
                <li key={l} className={cn('rounded-full px-3 py-1 text-[13px] font-medium', c)}>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AnimatePresence>
          {processing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden" aria-live="polite">
              <div className="mt-5 rounded-[20px] bg-surface-strong p-4 ring-1 ring-line">
                <p className="text-sm font-semibold">
                  Processing <span className="font-mono">{processing.file}</span>
                </p>
                <ol className="mt-3 grid grid-cols-3 gap-3">
                  {stages.slice(0, 3).map((st, i) => (
                    <li key={st} className="flex flex-col gap-1.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunk">
                        <motion.div className="h-full bg-hot" initial={{ width: 0 }} animate={{ width: processing.stage > i ? '100%' : processing.stage === i ? '55%' : '0%' }} transition={{ duration: 0.5 }} />
                      </div>
                      <span className={cn('text-[12px]', processing.stage > i ? 'font-semibold text-fg' : 'text-fg-muted')}>
                        {processing.stage > i && <Check size={12} className="mr-1 inline" aria-hidden="true" />}
                        {st}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="text-[13px] font-semibold text-fg-muted">
          Recent imports
        </h2>
        <ul aria-labelledby="recent-h" tabIndex={0} className="mt-2 flex gap-3 overflow-x-auto pb-2 scrollbar-none focus-visible:outline-offset-[-3px]">
          {imp.recent.map((r, i) => (
            <li key={r.file} className={cn('flex shrink-0 items-center gap-4 rounded-full py-2.5 pl-5 pr-2.5', i === 0 ? 'bg-ink text-white shadow-solid dark:bg-white dark:text-ink' : 'glass')}>
              <span>
                <span className="block font-mono text-[13px] font-medium">{r.file}</span>
                <span className={cn('block text-[12px]', i === 0 ? 'opacity-75' : 'text-fg-muted')}>{r.meta}</span>
              </span>
              <Chip tone={i === 0 && imp.stage === 'review' ? 'review' : 'done'}>{i === 0 && imp.stage === 'review' ? 'In review' : 'Committed'}</Chip>
            </li>
          ))}
        </ul>
      </section>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-fg-muted">Import · today {imp.at} · by DS</p>
            <h2 className="mt-1 font-mono text-[24px] font-medium tracking-[-0.01em]">{imp.file}</h2>
            <p className="text-sm text-fg-muted">24 rows · 6 columns · this week’s referrals</p>
          </div>
          <Button
            onClick={() => {
              dispatch({ type: 'imp', patch: { rows: structuredClone(seedRows), stage: 'review' } })
              toast('Import reset to its first check. (demo)')
            }}
          >
            Reset demo
          </Button>
        </div>
        <div role="region" aria-label="Import stages" tabIndex={0} className="mt-6 overflow-x-auto focus-visible:outline-offset-[-3px]">
          <ol className="grid min-w-[620px] grid-cols-5">
            {stages.map((st, i) => {
              const done = i < currentStage || (i === 4 && imp.stage === 'committed')
              const cur = i === currentStage && imp.stage !== 'committed'
              return (
                <li key={st} className="relative flex flex-col items-center gap-2 text-center" aria-current={cur ? 'step' : undefined}>
                  {i < 4 && <span aria-hidden="true" className={cn('absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[17px] h-[3px] rounded-full', i < currentStage ? 'bg-hot' : 'bg-line-strong/30')} />}
                  <span
                    className={cn(
                      'relative grid size-9 place-items-center rounded-full text-sm font-semibold',
                      done ? 'bg-hot text-white' : cur ? 'bg-teal text-white ring-4 ring-mist-bg dark:bg-teal-300 dark:text-teal-950' : 'bg-surface-strong text-fg-muted ring-1 ring-line-strong',
                    )}
                  >
                    {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn('text-sm', cur ? 'font-semibold' : done ? 'font-medium' : 'text-fg-muted')}>{st}</span>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: imp.stage === 'committed' ? counts.committed : counts.ready, l: imp.stage === 'committed' ? 'Committed to records' : 'Ready to commit', c: 'bg-done-bg text-done-fg' },
            { n: counts.review, l: 'Need a person to review', c: 'bg-review-bg text-review-fg' },
            { n: counts.held, l: 'Held: can’t be saved yet', c: 'bg-hot-100 text-hot-800 dark:bg-hot/20 dark:text-hot-200' },
            { n: '~40 min', l: 'of retyping skipped (sample estimate)', c: 'bg-ink text-white dark:bg-white dark:text-ink' },
          ].map((t) => (
            <div key={t.l} className={cn('rounded-[22px] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)]', t.c)}>
              <motion.p key={String(t.n)} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-[36px] font-semibold leading-none tabular">
                {t.n}
              </motion.p>
              <p className="mt-1.5 text-sm font-medium">{t.l}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <H2>Field mapping</H2>
          <span className="text-[13px] text-fg-muted">6 of 6 columns mapped to FHIR R4</span>
        </div>
        <AnimatePresence>
          {imp.mapDirty && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-full bg-review-bg py-2 pl-5 pr-2 text-sm text-review-fg">
                Mapping changed. Run the checks again so the results match.
                <Button
                  size="sm"
                  variant="dark"
                  icon={<RefreshCw size={14} aria-hidden="true" />}
                  onClick={() => {
                    dispatch({ type: 'imp', patch: { mapDirty: false } })
                    log('import', `Re-ran checks on ${imp.file} after a mapping change`, 'Column remapped', 'Imports')
                    toast.success('Checks re-run. No new problems found.')
                  }}
                >
                  Re-run checks
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {imp.map.map((m, i) => (
            <li key={m.source} className={cn('flex w-[232px] shrink-0 flex-col gap-2 rounded-[22px] p-4 ring-1', m.sensitive ? 'bg-review-bg/70 ring-[#e8c48a] dark:ring-[#f6d39a]/30' : 'bg-mist-bg ring-teal/20')}>
              <span className="font-mono text-[13px] text-fg-muted">{m.source}</span>
              <ArrowDown size={16} aria-hidden="true" className="text-accent-fg" />
              <label className="sr-only" htmlFor={`map-${i}`}>
                Map {m.source} to
              </label>
              <div className="relative">
                <select
                  id={`map-${i}`}
                  value={m.target}
                  onChange={(e) => dispatch({ type: 'imp', patch: { map: imp.map.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)), mapDirty: true } })}
                  className="h-9 w-full appearance-none rounded-full border border-line-strong/60 bg-surface-strong pl-3 pr-8 font-mono text-[12.5px] font-medium text-accent-fg"
                >
                  {fhirTargets.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted" />
              </div>
              <span className="text-[13px] text-fg-muted">{m.rule}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <H2>Check results</H2>
          <Segmented
            label="Filter results"
            value={filter}
            onChange={(f) => {
              setFilter(f)
              setShowAll(false)
            }}
            options={[
              { id: 'all', label: 'All', count: imp.rows.length },
              { id: 'review', label: 'Review', count: counts.review },
              { id: 'held', label: 'Held', count: counts.held },
              { id: 'ready', label: 'Ready', count: counts.ready + counts.committed },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.06em] text-fg-muted">
                <th scope="col" className="w-16 py-3 pl-6 pr-3 font-semibold">
                  Row
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Patient
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Result
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  What the check found
                </th>
                <th scope="col" className="py-3 pl-3 pr-6 text-right font-semibold">
                  Next step
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visible.map((r) => (
                  <motion.tr key={r.row} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-line align-top">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-[13px] text-fg-muted">{r.row}</td>
                    <td className="px-3 py-3.5 font-semibold">{r.name}</td>
                    <td className="px-3 py-3.5">
                      <Chip tone={r.status === 'ready' || r.status === 'committed' ? 'done' : r.status === 'note' ? 'note' : r.status === 'held' ? 'held' : 'review'}>
                        {{ ready: 'Ready', committed: 'Committed', review: 'Review', held: 'Held', note: 'Note' }[r.status]}
                      </Chip>
                    </td>
                    <td className="px-3 py-3.5 text-fg-muted">
                      {r.finding}
                      {fixing === r.row && (
                        <form
                          className="mt-3 flex flex-wrap items-end gap-2"
                          onSubmit={(e) => {
                            e.preventDefault()
                            setFixing(null)
                            undoable(`Date of birth fixed for row ${r.row}.`, [
                              { type: 'row', row: r.row, patch: { status: 'ready', finding: `Date of birth corrected to ${isoToUS(fixDate)}. Ready to commit.` } },
                              { type: 'queue', id: 'q-future', patch: { status: 'resolved', decision: 'Date corrected' } },
                              { type: 'audit', entry: { type: 'import', what: `Corrected the date of birth in row ${r.row} (${r.name})`, who: 'DS', reason: 'Typo in the referral (2062 → 1962)', where: 'Imports' } },
                            ])
                          }}
                        >
                          <label className="text-[12px] font-medium text-fg">
                            Correct date of birth
                            <input type="date" value={fixDate} onChange={(e) => setFixDate(e.target.value)} className={cn(inputCls, 'mt-1 h-9 !rounded-full !py-0')} />
                          </label>
                          <Button size="sm" variant="dark" type="submit">
                            Save
                          </Button>
                          <Button size="sm" type="button" onClick={() => setFixing(null)}>
                            Cancel
                          </Button>
                        </form>
                      )}
                    </td>
                    <td className="py-2.5 pl-3 pr-6 text-right">
                      {r.status === 'review' || r.status === 'held' ? (
                        r.requested ? (
                          <Chip tone="info">Info requested</Chip>
                        ) : r.action && fixing !== r.row ? (
                          <Button size="sm" variant={r.action === 'compare' ? 'primary' : 'glass'} onClick={() => actOn(r)}>
                            {{ compare: 'Compare records', request: 'Request info', mask: 'Confirm mask', fixdate: 'Fix date' }[r.action]}
                          </Button>
                        ) : null
                      ) : (
                        <span className="text-[13px] text-fg-subtle">{r.status === 'note' ? 'No action' : '—'}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {sorted.length > 9 && (
          <div className="border-t border-line px-6 py-3">
            <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer rows' : `Show all ${sorted.length} rows`}
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-sunk px-6 py-4">
          <p className="max-w-lg text-[13px] text-fg-muted">
            {imp.stage === 'committed'
              ? `${counts.committed} rows were saved. Held and review rows stay staged until someone resolves them.`
              : 'Held and review rows stay staged until someone resolves them. Committing only saves the ready ones.'}
          </p>
          <Button variant="dark" disabled={counts.ready === 0} onClick={() => setConfirm(true)}>
            Commit {counts.ready} ready rows
          </Button>
        </div>
      </Card>

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={`Commit ${counts.ready} ready rows?`}
        description="They’ll be saved to patient records as FHIR resources. The other rows stay staged."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirm(false)
                const n = counts.ready
                undoable(`${n} rows committed to patient records.`, [
                  {
                    type: 'imp',
                    patch: { stage: 'committed', rows: imp.rows.map((r) => (r.status === 'ready' ? { ...r, status: 'committed' as const } : r)), recent: imp.recent.map((x, i) => (i === 0 ? { ...x, status: 'committed' as const } : x)) },
                  },
                  { type: 'audit', entry: { type: 'import', what: `Committed ${n} rows from ${imp.file}`, who: 'DS', reason: 'All checks passed', where: 'Imports' } },
                ])
              }}
            >
              Commit rows
            </Button>
          </>
        }
      >
        <ul className="grid grid-cols-3 gap-2 text-center text-sm">
          <li className="rounded-2xl bg-done-bg p-3 text-done-fg">
            <span className="block font-display text-2xl font-semibold">{counts.ready}</span>will be saved
          </li>
          <li className="rounded-2xl bg-review-bg p-3 text-review-fg">
            <span className="block font-display text-2xl font-semibold">{counts.review}</span>stay in review
          </li>
          <li className="rounded-2xl bg-note-bg p-3 text-note-fg">
            <span className="block font-display text-2xl font-semibold">{counts.held}</span>stay held
          </li>
        </ul>
      </Modal>
    </div>
  )
}

export function isoToUS(iso: string) {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${m}/${d}/${y}` : iso
}

function rank(r: ImportRow) {
  return { held: 0, review: 1, note: 2, ready: 3, committed: 4 }[r.status]
}
