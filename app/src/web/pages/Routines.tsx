import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, GripVertical, Lightbulb, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../shared/util'
import type { Routine, RoutineStep, Where } from '../data'
import { useStore } from '../store'
import { Button, Card, Chip, Field, H2, Modal, PageHeader, Segmented, Switch, inputCls } from '../ui'

const whereLabel: Record<Where, string> = { desk: 'At the desk', either: 'Phone or desk', before: 'Before arrival' }

export function Routines() {
  const { s, dispatch, log, undoable } = useStore()
  const [rid, setRid] = useState('return')
  const [adding, setAdding] = useState(false)
  const routine = s.routines.find((r) => r.id === rid)!
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = routine.steps.findIndex((x) => x.id === active.id)
    const to = routine.steps.findIndex((x) => x.id === over.id)
    const moved = routine.steps[from]
    dispatch({ type: 'routine', id: routine.id, patch: { steps: arrayMove(routine.steps, from, to) } })
    log('routine', `Moved “${moved.label}” to position ${to + 1} in “${routine.name}”`, 'Reordered steps', 'Web')
  }

  const totalSec = routine.steps.reduce((t, x) => t + x.avgSec * (1 - x.skipRate), 0)
  const early = routine.steps.filter((x) => x.where === 'before').length
  const suggestion = [...routine.steps].filter((x) => x.required && x.skipRate > 0.5).sort((a, b) => b.skipRate - a.skipRate)[0]
  const maxSec = Math.max(...routine.steps.map((x) => x.avgSec))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Set up"
        title="Routines"
        description="The step lists your desk repeats every day. Every check-in runs one, and the phone app settles some steps before the patient arrives."
        actions={
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => toast('New routine started. (demo)')}>
            New routine
          </Button>
        }
      />
      <Segmented label="Choose a routine" value={rid} onChange={setRid} options={s.routines.map((r) => ({ id: r.id, label: r.name, count: r.steps.length }))} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <H2 className="text-2xl">{routine.name}</H2>
              <p className="text-sm text-fg-muted">Used {routine.runs} times this week · drag a card, or focus its handle and use the arrow keys, to reorder</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast(`Copied “${routine.name}”. (demo)`)}>
                Duplicate
              </Button>
              <Button size="sm" onClick={() => toast.success(`Test run passed: ${routine.steps.length} steps, about ${Math.round(totalSec)} seconds at the desk.`)}>
                Test run
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{ screenReaderInstructions: { draggable: 'To pick up a step, press space or enter. Use the arrow keys to move it. Press space or enter again to drop it, or escape to cancel.' } }}
          >
            <SortableContext items={routine.steps.map((x) => x.id)} strategy={horizontalListSortingStrategy}>
              <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-4 pt-1">
                <ol className="flex w-max gap-3">
                  {routine.steps.map((st, i) => (
                    <StepCard key={st.id} routine={routine} step={st} index={i} />
                  ))}
                  <li>
                    <button
                      onClick={() => setAdding(true)}
                      className="flex h-full min-h-[214px] w-[170px] flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-line-strong/70 text-sm font-semibold text-fg-muted transition-colors hover:border-hot hover:text-accent-fg"
                    >
                      <Plus size={22} aria-hidden="true" /> Add a step
                    </button>
                  </li>
                </ol>
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Chip tone="info">{routine.steps.length} steps</Chip>
            <Chip tone="done">{early} before arrival</Chip>
            <Chip tone="info">
              ≈ {Math.floor(totalSec / 60)}m {String(Math.round(totalSec % 60)).padStart(2, '0')}s at the desk
            </Chip>
          </div>

          <div role="group" aria-labelledby="rules-h" className="mt-6 border-t border-line pt-5">
            <h3 id="rules-h" className="font-display text-[17px] font-semibold">
              Rules for this routine
            </h3>
            <div className="mt-3 flex flex-col gap-2.5">
              <Switch label="Settle steps before arrival when the patient checks in by phone" checked={routine.rules.early} onChange={(v) => dispatch({ type: 'routine', id: routine.id, patch: { rules: { ...routine.rules, early: v } } })} />
              <Switch
                label="Send open steps to the follow-up list instead of holding the visit"
                description="Keeps patients moving. The desk board’s Complete button follows this rule."
                checked={routine.rules.followUp}
                onChange={(v) => dispatch({ type: 'routine', id: routine.id, patch: { rules: { ...routine.rules, followUp: v } } })}
              />
              <Switch label="Ask for a reason whenever a step is skipped" checked={routine.rules.reasonOnSkip} onChange={(v) => dispatch({ type: 'routine', id: routine.id, patch: { rules: { ...routine.rules, reasonOnSkip: v } } })} />
            </div>
          </div>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <H2 className="text-[17px]">This week · sample figures</H2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [String(routine.runs), 'runs'],
                [`${Math.floor(totalSec / 60)}:${String(Math.round(totalSec % 60)).padStart(2, '0')}`, 'avg time'],
                [`${early}/${routine.steps.length}`, 'done early'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-[20px] bg-surface-strong p-3 ring-1 ring-line">
                  <p className="font-display text-2xl font-semibold tabular">{n}</p>
                  <p className="text-[12px] text-fg-muted">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] font-semibold text-fg-muted">Average time per step</p>
            <ul className="mt-2 flex flex-col gap-2.5 text-[13px]">
              {[...routine.steps]
                .sort((a, b) => b.avgSec - a.avgSec)
                .map((x) => (
                  <li key={x.id}>
                    <div className="flex justify-between">
                      <span>{x.label}</span>
                      <span className="font-mono tabular">{x.avgSec}s</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunk ring-1 ring-inset ring-line">
                      <motion.div
                        layout
                        className={cn('h-full rounded-full', x.where === 'before' ? 'bg-teal dark:bg-teal-300' : 'bg-hot')}
                        initial={{ width: 0 }}
                        animate={{ width: `${(x.avgSec / maxSec) * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
            <p className="mt-3 flex gap-3 text-[12px] text-fg-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-hot" /> at the desk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal" /> before arrival
              </span>
            </p>
          </Card>
          <AnimatePresence mode="wait">
            {suggestion ? (
              <motion.div key={suggestion.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="!bg-mist-bg p-5">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-fg">
                    <Lightbulb size={14} aria-hidden="true" /> Suggestion
                  </p>
                  <H2 className="mt-1.5 text-[18px] !text-teal-fg">Make “{suggestion.label}” optional?</H2>
                  <p className="mt-1 text-sm text-teal-fg">
                    It was skipped in {Math.round(suggestion.skipRate * 100)}% of {routine.name.toLowerCase()} check-ins this week, usually because it was already taken care of.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="teal"
                      onClick={() =>
                        undoable(`“${suggestion.label}” is now optional.`, [
                          { type: 'rstep', id: routine.id, step: suggestion.id, patch: { required: false } },
                          { type: 'audit', entry: { type: 'routine', what: `Made “${suggestion.label}” optional in “${routine.name}”`, who: 'DS', reason: `Skipped ${Math.round(suggestion.skipRate * 100)}% of the time`, where: 'Web' } },
                        ])
                      }
                    >
                      Make optional
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toast('Okay. We’ll suggest it again next week.')}>
                      Not now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-5 text-sm text-fg-muted">No suggestions for this routine right now.</Card>
            )}
          </AnimatePresence>
        </aside>
      </div>
      <AddStepModal open={adding} setOpen={setAdding} routine={routine} />
    </div>
  )
}

function StepCard({ routine, step, index }: { routine: Routine; step: RoutineStep; index: number }) {
  const { dispatch, undoable } = useStore()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const tint = step.where === 'before' ? 'bg-mist-bg' : step.skipRate > 0.5 ? 'bg-review-bg/70' : 'bg-surface-strong'
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative flex w-[212px] flex-col gap-2.5 rounded-[24px] p-4 ring-1 ring-line', tint, isDragging ? 'z-10 shadow-[0_24px_40px_-16px_rgb(60_10_30/0.5)] ring-2 ring-hot' : 'shadow-[var(--shadow-pill)]')}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white dark:bg-white dark:text-ink">{index + 1}</span>
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${step.label}`}
          className="grid size-9 cursor-grab touch-none place-items-center rounded-full text-fg-subtle hover:bg-surface hover:text-fg active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      </div>
      <p className="font-display text-[16px] font-semibold leading-tight">{step.label}</p>
      <label className="sr-only" htmlFor={`where-${step.id}`}>
        Where {step.label} happens
      </label>
      <div className="relative">
        <select
          id={`where-${step.id}`}
          value={step.where}
          onChange={(e) => dispatch({ type: 'rstep', id: routine.id, step: step.id, patch: { where: e.target.value as Where } })}
          className="h-9 w-full appearance-none rounded-full border border-line-strong/60 bg-surface-solid pl-3 pr-8 text-[13px] font-medium"
        >
          {(Object.keys(whereLabel) as Where[]).map((w) => (
            <option key={w} value={w}>
              {whereLabel[w]}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted" />
      </div>
      <p className="text-[12px] text-fg-muted">Checks: {step.check}</p>
      <div className="mt-auto flex items-center justify-between gap-2">
        <button
          role="switch"
          aria-checked={step.required}
          onClick={() => dispatch({ type: 'rstep', id: routine.id, step: step.id, patch: { required: !step.required } })}
          className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors', step.required ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'bg-surface text-fg-muted ring-1 ring-line-strong/60')}
        >
          {step.required ? 'Required' : 'Optional'}
        </button>
        <button
          aria-label={`Remove ${step.label}`}
          onClick={() =>
            undoable(`Removed “${step.label}”.`, [
              { type: 'routine', id: routine.id, patch: { steps: routine.steps.filter((x) => x.id !== step.id) } },
              { type: 'audit', entry: { type: 'routine', what: `Removed “${step.label}” from “${routine.name}”`, who: 'DS', reason: '—', where: 'Web' } },
            ])
          }
          className="grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-surface hover:text-accent-fg"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {step.skipRate > 0.5 && <span className="absolute -top-2 right-12 rounded-full bg-review-bg px-2 py-0.5 text-[10.5px] font-semibold text-review-fg ring-1 ring-[#e8c48a]">skipped {Math.round(step.skipRate * 100)}%</span>}
    </li>
  )
}

function AddStepModal({ open, setOpen, routine }: { open: boolean; setOpen: (o: boolean) => void; routine: Routine }) {
  const { dispatch, log } = useStore()
  const [label, setLabel] = useState('')
  const [where, setWhere] = useState<Where>('either')
  const [err, setErr] = useState('')
  const submit = () => {
    if (label.trim().length < 3) return setErr('Give the step a short name.')
    const step: RoutineStep = { id: `custom-${Date.now()}`, label: label.trim(), where, required: true, avgSec: 20, skipRate: 0, check: 'Done by staff' }
    dispatch({ type: 'routine', id: routine.id, patch: { steps: [...routine.steps, step] } })
    log('routine', `Added “${step.label}” to “${routine.name}”`, '—', 'Web')
    toast.success(`Added “${step.label}”.`)
    setLabel('')
    setErr('')
    setOpen(false)
  }
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={`Add a step to ${routine.name}`}
      footer={
        <>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Add step
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field id="step-name" label="Step name" error={err}>
          <input id="step-name" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Advance directive on file" aria-invalid={!!err} aria-describedby={err ? 'step-name-err' : undefined} className={inputCls} />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium">Where it happens</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(whereLabel) as Where[]).map((w) => (
              <label
                key={w}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-2 text-sm ring-1 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]',
                  where === w ? 'bg-ink text-white ring-ink dark:bg-white dark:text-ink' : 'ring-line-strong/60',
                )}
              >
                <input type="radio" name="where" className="sr-only" checked={where === w} onChange={() => setWhere(w)} />
                {whereLabel[w]}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
