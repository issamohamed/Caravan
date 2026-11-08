import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, GitBranch, Info, Pencil, Plus, Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '../../shared/Logo'
import { cn, gradeLabel, readability } from '../../shared/util'
import type { QItem } from '../data'
import { useStore } from '../store'
import { Button, Card, Chip, H2, Modal, PageHeader, inputCls } from '../ui'

export function QuestionSets() {
  const { s, dispatch, log } = useStore()
  const [setId, setSetId] = useState('return')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ simple: '', medical: '' })
  const [previewId, setPreviewId] = useState('q2')
  const [previewWording, setPreviewWording] = useState<'simple' | 'medical'>('simple')
  const [publishOpen, setPublishOpen] = useState(false)
  const set = s.qsets.find((q) => q.id === setId)!
  const edited = set.items.filter((i) => i.edited)
  const preview = set.items.find((i) => i.id === previewId) ?? set.items[0]

  const stats = useMemo(() => {
    const grades = set.items.map((i) => readability(i.simple))
    return { maxGrade: Math.max(...grades.map((g) => g.grade)), longest: Math.max(...grades.map((g) => g.words)) }
  }, [set])

  const startEdit = (it: QItem) => {
    setEditing(it.id)
    setDraft({ simple: it.simple, medical: it.medical })
    setPreviewId(it.id)
  }
  const saveEdit = (it: QItem) => {
    if (draft.simple === it.simple && draft.medical === it.medical) return setEditing(null)
    dispatch({ type: 'qitem', set: set.id, item: it.id, patch: { simple: draft.simple.trim(), medical: draft.medical.trim(), edited: true } })
    log('qset', `Edited “${it.title}” in “${set.name}” (not published yet)`, 'Clearer wording', 'Web')
    setEditing(null)
    toast.success('Saved as a draft change.', { description: 'Patients see it after you publish.' })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="What the phone app asks" title="Question sets" description="Every question has two wordings. The patient’s answers pick which one they see, never their age, and they can switch on any screen." />
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4 self-start">
          <Card as="nav" aria-label="Question sets" className="p-3">
            <ul className="flex flex-col gap-1">
              {s.qsets.map((q) => {
                const on = q.id === setId
                const dirty = q.items.some((i) => i.edited)
                return (
                  <li key={q.id}>
                    <button
                      onClick={() => {
                        setSetId(q.id)
                        setEditing(null)
                        setPreviewId(q.items[0].id)
                      }}
                      aria-current={on ? 'true' : undefined}
                      className={cn(
                        'flex min-h-12 w-full items-center justify-between gap-2 rounded-full pl-4 pr-2 text-left text-sm font-medium transition-colors',
                        on ? 'bg-ink text-white shadow-solid dark:bg-white dark:text-ink' : 'hover:bg-surface-strong',
                      )}
                    >
                      {q.name}
                      <Chip tone={dirty ? 'review' : q.status === 'live' ? 'done' : 'review'}>{dirty ? 'Edited' : q.status === 'live' ? `v${q.version} live` : 'Draft'}</Chip>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Button size="sm" className="mt-3 w-full" icon={<Plus size={14} aria-hidden="true" />} onClick={() => toast('New question set started. (demo)')}>
              New question set
            </Button>
          </Card>
          <Card className="hidden p-5 xl:block">
            <H2 className="text-[17px]">Change history</H2>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {set.history.map((h) => (
                <li key={h.v}>
                  <span className="font-mono text-[12px] text-fg-subtle">
                    v{h.v} · {h.when} · {h.by}
                  </span>
                  <br />
                  {h.what}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <section aria-labelledby="set-h" className="flex min-w-0 flex-col gap-4">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-fg-muted">Family Medicine · phone check-in</p>
                <h2 id="set-h" className="mt-1 font-display text-[28px] font-semibold tracking-[-0.02em]">
                  {set.name} check-in
                </h2>
                <p className="text-sm text-fg-muted">
                  {set.status === 'live' ? `Live on patients’ phones · version ${set.version} · published ${set.published} by ${set.by}` : 'Draft · not on phones yet'} · {set.items.length} questions
                </p>
              </div>
              <Button variant="primary" disabled={!edited.length && set.status === 'live'} onClick={() => setPublishOpen(true)}>
                {edited.length ? `Publish ${edited.length} change${edited.length > 1 ? 's' : ''}` : set.status === 'live' ? 'No changes to publish' : 'Publish'}
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2.5 rounded-full bg-mist-bg px-4 py-2.5 text-sm font-medium text-teal-fg">
              <Info size={16} aria-hidden="true" className="shrink-0" /> Wording follows the patient’s answers, never their age.
            </p>
          </Card>

          <ol className="flex flex-col gap-3">
            {set.items.map((it, idx) => {
              const isEd = editing === it.id
              const g = gradeLabel(readability(isEd ? draft.simple : it.simple).grade)
              const branching = !!it.branches
              return (
                <motion.li key={it.id} layout className={cn('glass rounded-[26px] p-5 transition-shadow', previewId === it.id && 'ring-2 ring-hot', branching && '!border-hot/60')}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={cn('grid size-8 place-items-center rounded-full text-sm font-semibold text-white', branching ? 'bg-hot' : 'bg-ink dark:bg-white dark:text-ink')}>{idx + 1}</span>
                    <h3 className="flex-1 font-display text-[17px] font-semibold">{it.title}</h3>
                    {it.edited && <Chip tone="review">Edited · not published</Chip>}
                    <Chip tone={branching ? 'accent' : 'neutral'}>
                      {branching && <GitBranch size={12} aria-hidden="true" />}
                      {it.type}
                    </Chip>
                    {!isEd && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewId(it.id)} icon={<Smartphone size={14} aria-hidden="true" />}>
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => startEdit(it)} icon={<Pencil size={13} aria-hidden="true" />}>
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                  {isEd ? (
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveEdit(it)
                      }}
                    >
                      {(['simple', 'medical'] as const).map((w) => {
                        const r = readability(draft[w])
                        const gl = gradeLabel(r.grade)
                        return (
                          <div key={w} className={cn('rounded-[20px] p-4', w === 'simple' ? 'bg-hot-100/80 dark:bg-hot/10' : 'bg-mist-bg')}>
                            <label htmlFor={`${it.id}-${w}`} className={cn('text-[12px] font-semibold', w === 'simple' ? 'text-accent-fg' : 'text-teal-fg')}>
                              {w === 'simple' ? 'Simple words' : 'Medical terms'}
                            </label>
                            <textarea
                              id={`${it.id}-${w}`}
                              rows={3}
                              // The person just pressed Edit, so focus moves into the editor they opened.
                              // oxlint-disable-next-line jsx-a11y/no-autofocus
                              autoFocus={w === 'simple'}
                              value={draft[w]}
                              onChange={(e) => {
                                setDraft({ ...draft, [w]: e.target.value })
                                setPreviewWording(w)
                              }}
                              className={cn(inputCls, 'mt-1.5 !bg-surface-solid text-[15px]')}
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]" aria-live="polite">
                              {w === 'simple' && <Chip tone={gl.tone}>Reading level {gl.label.toLowerCase()}</Chip>}
                              <Chip tone="info">{r.words} words</Chip>
                              {w === 'simple' && <span className="text-fg-muted">{gl.hint}</span>}
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex gap-2 md:col-span-2">
                        <Button type="submit" variant="dark" size="sm">
                          Save draft
                        </Button>
                        <Button type="button" size="sm" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                      <button onClick={() => (setPreviewId(it.id), setPreviewWording('simple'))} className="rounded-[20px] bg-hot-100/80 p-4 text-left transition-transform hover:-translate-y-0.5 dark:bg-hot/10">
                        <span className="flex items-center justify-between text-[12px] font-semibold text-accent-fg">
                          Simple words <Chip tone={g.tone}>{g.label}</Chip>
                        </span>
                        <span className="mt-1.5 block text-[15px]">{it.simple}</span>
                      </button>
                      <button onClick={() => (setPreviewId(it.id), setPreviewWording('medical'))} className="rounded-[20px] bg-mist-bg p-4 text-left transition-transform hover:-translate-y-0.5">
                        <span className="text-[12px] font-semibold text-teal-fg">Medical terms</span>
                        <span className="mt-1.5 block text-[15px]">{it.medical}</span>
                      </button>
                    </div>
                  )}
                  {it.branches && (
                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-fg-muted">What each answer does</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {it.branches.map((b) => (
                          <li key={b.answer} className="flex items-center gap-2 rounded-full bg-surface-strong px-3.5 py-2 text-[13px] ring-1 ring-line">
                            <strong>{b.answer}</strong>
                            <ArrowRight size={13} aria-hidden="true" className="text-accent-fg" />
                            {b.to}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.li>
              )
            })}
          </ol>
        </section>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-[136px] xl:max-h-[calc(100dvh-150px)] xl:self-start xl:overflow-y-auto xl:pb-2 scrollbar-none" aria-label="Phone preview">
          <PhonePreview item={preview} index={set.items.indexOf(preview) + 1} total={set.items.length} wording={previewWording} setWording={setPreviewWording} draft={editing === preview.id ? draft : null} />
          <Card className="p-5">
            <H2 className="text-[17px]">Readability check</H2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              <li className="flex items-center justify-between gap-3">
                Hardest simple question <Chip tone={gradeLabel(stats.maxGrade).tone}>{gradeLabel(stats.maxGrade).label}</Chip>
              </li>
              <li className="flex items-center justify-between gap-3">
                Longest simple question <Chip tone={stats.longest <= 12 ? 'done' : 'review'}>{stats.longest} words</Chip>
              </li>
              <li className="flex items-center justify-between gap-3">
                Works with Read aloud <Chip tone="done">All {set.items.length}</Chip>
              </li>
            </ul>
            <p className="mt-3 text-[12px] text-fg-subtle">Reading level is a Flesch–Kincaid estimate, recalculated as you type.</p>
          </Card>
        </aside>
      </div>

      <Modal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish version ${set.version + 1}?`}
        description="Phones load the new version at the next check-in. No app update needed."
        footer={
          <>
            <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const what = edited.length ? `Reworded ${edited.map((e) => `“${e.title}”`).join(', ')}` : 'First version'
                dispatch({ type: 'publish', set: set.id, what, by: 'DS' })
                log('qset', `Published “${set.name}” v${set.version + 1}: ${what}`, 'Reviewed wording', 'Web')
                setPublishOpen(false)
                toast.success(`“${set.name}” v${set.version + 1} is live.`, { description: 'Saved as a new FHIR Questionnaire version.' })
              }}
            >
              Publish
            </Button>
          </>
        }
      >
        {edited.length ? (
          <ul className="flex flex-col gap-2">
            {edited.map((e) => (
              <li key={e.id} className="rounded-2xl bg-surface-strong p-3 text-sm ring-1 ring-line">
                <strong>{e.title}</strong>
                <p className="mt-1 text-fg-muted">{e.simple}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">This publishes the draft as version 1.</p>
        )}
      </Modal>
    </div>
  )
}

function PhonePreview({
  item,
  index,
  total,
  wording,
  setWording,
  draft,
}: {
  item: QItem
  index: number
  total: number
  wording: 'simple' | 'medical'
  setWording: (w: 'simple' | 'medical') => void
  draft: { simple: string; medical: string } | null
}) {
  const text = draft ? draft[wording] : item[wording]
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[40px] p-[9px] shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_30px_60px_-28px_rgb(35_31_32/0.7)]" style={{ background: '#141112' }}>
        <div
          className="phone-ground relative flex h-[452px] flex-col overflow-hidden rounded-[32px] font-read text-ink"
          style={{ background: 'radial-gradient(200px 180px at 100% 0%, rgb(18 143 152 / .45), transparent 70%), radial-gradient(240px 200px at 0% 75%, rgb(211 21 107 / .22), transparent 70%), #f1bfc1' }}
        >
          <div className="flex items-center justify-between px-4 pt-4">
            <Logo size="text-[1.4rem]" />
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold">Preview</span>
          </div>
          <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
            <p className="text-[13px] font-bold text-ink-soft">
              Question {index} of {total}
            </p>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full', i < index - 1 ? 'bg-hot' : i === index - 1 ? 'bg-teal' : 'bg-white/70')} />
              ))}
            </div>
            <div role="radiogroup" aria-label="Preview wording" className="flex rounded-full bg-white/70 p-1">
              {(['simple', 'medical'] as const).map((w) => (
                <button key={w} role="radio" aria-checked={wording === w} onClick={() => setWording(w)} className={cn('flex-1 rounded-full py-2 text-[13px] font-bold transition-colors', wording === w ? 'bg-ink text-white' : 'text-ink')}>
                  {w === 'simple' ? 'Simple words' : 'Medical terms'}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={wording + text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[21px] font-bold leading-[1.2]">
                {text || 'Type a question…'}
              </motion.p>
            </AnimatePresence>
            <div className="flex flex-col gap-2">
              {(item.branches ? item.branches.map((b) => b.answer) : ['Yes', 'No']).slice(0, 3).map((a, i) => (
                <span key={a} className={cn('flex items-center gap-2.5 rounded-[16px] border-2 px-3 py-2.5 text-[14px] font-bold', i === 0 ? 'border-hot-700 bg-hot-100' : 'border-[#8c5560]/50 bg-white/75')}>
                  <span className={cn('size-5 rounded-full border-2', i === 0 ? 'border-hot-700 bg-hot-700' : 'border-[#8c5560]')} />
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-auto border-t-2 border-white/70 bg-white/55 px-4 pb-4 pt-3">
            <span className="flex h-12 items-center justify-center rounded-full bg-hot text-[16px] font-bold text-white">Next</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] text-fg-subtle">{draft ? 'Showing your unsaved edit' : 'Live preview · tap a wording to switch'}</p>
    </div>
  )
}
