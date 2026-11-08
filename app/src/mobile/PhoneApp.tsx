import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Camera, Check, HandHelping, Send, Square, Type, UserRound, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../shared/Logo'
import { cn, useTicker } from '../shared/util'
import { medSuggestions } from './content'
import { useCheckin } from './ctx'
import { Arrival, Brought, Contact, DeskInstead, Done, Insurance, MedList, Meds, NextLabel, Reason, Review } from './screens'
import { questionNumber, type Screen } from './state'
import { BigButton, Sheet } from './ui'

const SCREEN_COMPONENTS: Record<Screen, () => ReactNode> = {
  arrival: Arrival,
  contact: Contact,
  meds: Meds,
  brought: Brought,
  medlist: MedList,
  reason: Reason,
  insurance: Insurance,
  review: Review,
  done: Done,
  desk: DeskInstead,
}

function HeaderButton({ children, onClick, pressed, label, tour }: { children: ReactNode; onClick: () => void; pressed?: boolean; label: string; tour?: string }) {
  return (
    <button
      data-tour={tour}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        'flex h-[3.75rem] w-[5.6rem] flex-col items-center justify-center gap-0.5 rounded-[1.1rem] border-2 text-[0.92rem] font-bold leading-none transition-colors',
        pressed ? 'border-teal bg-teal text-white' : 'glass-pill border-[#8c5560]/70 text-ink hover:bg-white/85 [.hc_&]:border-ink [.hc_&]:bg-white',
      )}
    >
      {children}
    </button>
  )
}

export function PhoneApp() {
  const { s, dispatch, now, sheet, setSheet, scale, setScale, contrast, setContrast, calm, setCalm, phoneEl, say, jump } = useCheckin()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const h = mainRef.current?.querySelector<HTMLElement>('h1')
    window.setTimeout(() => h?.focus({ preventScroll: true }), 320)
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* not supported */
    }
    setSpeaking(false)
  }, [s.screen])

  const toggleRead = () => {
    try {
      const synth = window.speechSynthesis
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') throw new Error('no speech')
      if (speaking) {
        synth.cancel()
        setSpeaking(false)
        return
      }
      const root = mainRef.current
      const parts = [root?.querySelector('h1')?.textContent, root?.querySelector('h1 + p')?.textContent, ...Array.from(root?.querySelectorAll('[role="radiogroup"][aria-labelledby] label') ?? []).map((l) => l.textContent)].filter(Boolean)
      const u = new SpeechSynthesisUtterance(parts.join('. '))
      u.rate = 0.9
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      synth.cancel()
      synth.speak(u)
      setSpeaking(true)
    } catch {
      say('Read aloud isn’t available in this browser.')
    }
  }

  const Current = SCREEN_COMPONENTS[s.screen]
  const isQuestion = questionNumber(s.screen) !== null
  const canGoBack = s.history.length > 0 && s.screen !== 'done'

  return (
    <div className={cn('phone-ground relative flex h-full flex-col overflow-hidden font-read text-ink', contrast && 'hc')}>
      <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        {canGoBack ? (
          <button
            onClick={() => dispatch({ type: 'back' })}
            className="glass-pill flex h-[3.75rem] items-center gap-1 rounded-[1.1rem] border-2 border-[#8c5560]/70 pl-3 pr-5 text-[1.15rem] font-bold hover:bg-white/85 [.hc_&]:border-ink [.hc_&]:bg-white"
          >
            <ArrowLeft size={22} strokeWidth={2.6} aria-hidden="true" /> Back
          </button>
        ) : (
          <Logo size="text-[1.95rem]" className="pl-1 text-ink" />
        )}
        <div className="flex gap-2">
          <HeaderButton label="Text size and display" onClick={() => setSheet('display')} tour="display">
            <Type size={22} strokeWidth={2.4} aria-hidden="true" />
            <span aria-hidden="true">Text size</span>
          </HeaderButton>
          <HeaderButton label={speaking ? 'Stop reading aloud' : 'Read aloud'} onClick={toggleRead} pressed={speaking}>
            {speaking ? <Square size={20} strokeWidth={2.6} aria-hidden="true" /> : <Volume2 size={22} strokeWidth={2.4} aria-hidden="true" />}
            <span aria-hidden="true">{speaking ? 'Stop' : 'Read aloud'}</span>
          </HeaderButton>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {s.help === 'min' && (
          <motion.button
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onClick={() => dispatch({ type: 'help', mode: 'open', at: now() })}
            className="mx-4 mb-1 flex items-center gap-3 overflow-hidden rounded-full bg-teal-700 px-4 py-2.5 text-left text-[1.05rem] font-bold text-white"
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 animate-live-dot rounded-full bg-hot-200" />
            <span className="flex-1">Help is coming · Maria is walking over</span>
            <span className="text-[0.95rem] underline underline-offset-4">View</span>
          </motion.button>
        )}
      </AnimatePresence>

      <main ref={mainRef} id="phone-main" data-screen={s.screen} data-wording-by={s.wordingBy} data-help={s.help} className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={s.screen} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}>
            <Current />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex flex-col gap-2.5 border-t-2 border-white/70 bg-white/55 px-4 pb-5 pt-3 backdrop-blur-xl [.hc_&]:border-ink [.hc_&]:bg-white">
        {s.screen === 'arrival' && (
          <BigButton onClick={() => dispatch({ type: 'next', at: now() })} icon={<NextArrow />} tour="start">
            I’m at the clinic, start
          </BigButton>
        )}
        {isQuestion && (
          <BigButton onClick={() => dispatch({ type: 'next', at: now() })}>
            <NextLabel editing={s.editingFromReview} />
          </BigButton>
        )}
        {s.screen === 'review' && (
          <BigButton onClick={() => dispatch({ type: 'send', at: now() })} icon={<Send size={21} strokeWidth={2.4} aria-hidden="true" />}>
            Send to the front desk
          </BigButton>
        )}
        {s.screen === 'done' && (
          <BigButton
            tone="dark"
            onClick={() => {
              jump('arrival')
              say('Demo restarted from the beginning.')
            }}
          >
            Done
          </BigButton>
        )}
        {s.help === 'off' ? (
          <button
            data-tour="help"
            onClick={() => dispatch({ type: 'help', mode: 'open', at: now() })}
            className="flex min-h-[3.5rem] items-center justify-center gap-2.5 rounded-full border-2 border-ink bg-white/80 text-[1.2rem] font-bold hover:bg-white"
          >
            <UserRound size={22} strokeWidth={2.3} aria-hidden="true" /> Get help from the desk
          </button>
        ) : (
          <button
            data-tour="help"
            onClick={() => dispatch({ type: 'help', mode: 'open', at: now() })}
            className="flex min-h-[3.5rem] items-center justify-center gap-2.5 rounded-full border-2 border-teal-700 bg-mist text-[1.2rem] font-bold text-teal-700"
          >
            <HandHelping size={22} strokeWidth={2.3} aria-hidden="true" /> Help is coming
          </button>
        )}
      </footer>

      <HelpSheet />

      <Sheet open={sheet === 'display'} onOpenChange={(o) => !o && setSheet('none')} title="Text size and display" description="Changes stay on for this visit." container={phoneEl}>
        <fieldset>
          <legend className="text-[1.15rem] font-bold">Text size</legend>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {(['Standard', 'Large', 'Largest'] as const).map((label, i) => {
              const on = scale === i
              return (
                <label
                  key={label}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1 rounded-[1.2rem] border-2 py-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]',
                    on ? 'border-hot-700 bg-hot-100' : 'border-[#8c5560]/60 bg-white',
                  )}
                >
                  <input type="radio" name="scale" className="sr-only" checked={on} onChange={() => setScale(i as 0 | 1 | 2)} />
                  <span aria-hidden="true" className="font-bold leading-none" style={{ fontSize: `${22 + i * 6}px` }}>
                    Aa
                  </span>
                  <span className="text-[1rem] font-bold">{label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-col gap-3">
          <SwitchRow label="High contrast" hint="White background, black outlines, no see-through panels." on={contrast} onChange={setContrast} />
          <SwitchRow label="Calm motion" hint="Turns off sliding and bouncing." on={calm} onChange={setCalm} />
        </div>
        <BigButton tone="dark" className="mt-6" onClick={() => setSheet('none')}>
          Done
        </BigButton>
      </Sheet>

      <AddMedSheet />
      <CameraSheet />
      <Announcer />
    </div>
  )
}

function NextArrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function SwitchRow({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (b: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center gap-4 rounded-[1.2rem] border-2 border-[#8c5560]/50 bg-white px-4 py-3 text-left">
      <span className="flex-1">
        <span className="block text-[1.12rem] font-bold">{label}</span>
        <span className="block text-[0.98rem] leading-snug text-fg-muted">{hint}</span>
      </span>
      <span aria-hidden="true" className={cn('relative h-8 w-14 shrink-0 rounded-full transition-colors', on ? 'bg-teal' : 'bg-[#cbb7bb]')}>
        <motion.span className="absolute top-1 size-6 rounded-full bg-white shadow" animate={{ left: on ? 28 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
      </span>
    </button>
  )
}

function HelpSheet() {
  const { s, dispatch, now, phoneEl } = useCheckin()
  useTicker(500)
  const elapsed = s.helpStartedAt ? (Date.now() - s.helpStartedAt) / 1000 : 0
  const stages = [
    { at: 0, text: 'Your request reached the front desk' },
    { at: 2.5, text: 'Maria saw it' },
    { at: 5, text: 'Maria is walking over · about 2 minutes' },
  ]
  return (
    <Sheet open={s.help === 'open'} onOpenChange={(o) => !o && dispatch({ type: 'help', mode: 'min', at: now() })} title="Help is on the way." description="Stay where you are. Your answers are saved." container={phoneEl}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-[1.4rem] bg-mist p-4">
          <span aria-hidden="true" className="grid size-16 shrink-0 animate-pulse-ring place-items-center rounded-full bg-teal text-white">
            <HandHelping size={32} strokeWidth={2} />
          </span>
          <p className="text-[1.15rem] font-bold leading-snug text-teal-700">Maria from the front desk is coming to you now.</p>
        </div>
        <ol className="flex flex-col gap-2.5" aria-live="polite">
          {stages.map((st) => {
            const done = elapsed >= st.at
            return (
              <li key={st.text} className={cn('flex items-center gap-3 text-[1.1rem]', done ? 'text-ink' : 'text-fg-muted')}>
                <span aria-hidden="true" className={cn('grid size-7 shrink-0 place-items-center rounded-full border-2', done ? 'border-teal bg-teal text-white' : 'border-[#8c5560] bg-white')}>
                  {done && <Check size={15} strokeWidth={3.4} />}
                </span>
                <span className={done ? 'font-bold' : ''}>
                  {st.text}
                  {!done && <span className="sr-only"> (waiting)</span>}
                </span>
              </li>
            )
          })}
        </ol>
        <BigButton tone="outline" onClick={() => dispatch({ type: 'help', mode: 'min', at: now() })}>
          Keep going while I wait
        </BigButton>
        <button onClick={() => dispatch({ type: 'helpCancel', at: now() })} className="min-h-12 text-[1.12rem] font-bold text-accent-fg underline decoration-2 underline-offset-4">
          I don’t need help anymore
        </button>
      </div>
    </Sheet>
  )
}

function AddMedSheet() {
  const { s, dispatch, sheet, setSheet, phoneEl, say } = useCheckin()
  const [name, setName] = useState('')
  const add = (n: string) => {
    const clean = n.trim()
    if (!clean) return
    const id = `m-${Date.now()}`
    const [first, ...rest] = clean.split(' ')
    dispatch({
      type: 'answer',
      patch: {
        medList: [...s.answers.medList, { id, name: first, dose: rest.join(' ') || 'dose not listed', sig: { simple: 'Added by you today', medical: 'Patient-reported, unverified' }, added: true }],
        medStatus: { ...s.answers.medStatus, [id]: 'taking' },
      },
    })
    setName('')
    setSheet('none')
    say(`${clean} added to your list.`)
  }
  return (
    <Sheet open={sheet === 'addMed'} onOpenChange={(o) => !o && setSheet('none')} title="Add a medicine" description="Type the name, or pick one below. It’s fine to guess the spelling." container={phoneEl}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          add(name)
        }}
        className="flex flex-col gap-4"
      >
        <label htmlFor="new-med" className="sr-only">
          Medicine name
        </label>
        <input
          id="new-med"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Medicine name"
          autoComplete="off"
          className="w-full rounded-full border-2 border-[#8c5560] bg-white px-5 py-3.5 text-[1.2rem] placeholder:text-[#7a5e64] focus:border-hot-700"
        />
        <div className="flex flex-wrap gap-2">
          {medSuggestions.map((m) => (
            <button type="button" key={m} onClick={() => add(m)} className="min-h-11 rounded-full border-2 border-[#8c5560]/60 bg-white px-4 text-[1.02rem] font-bold hover:border-hot-700">
              {m}
            </button>
          ))}
        </div>
        <BigButton type="submit">Add to my list</BigButton>
      </form>
    </Sheet>
  )
}

function CameraSheet() {
  const { dispatch, sheet, setSheet, phoneEl, say } = useCheckin()
  const [state, setState] = useState<'aim' | 'got'>('aim')
  useEffect(() => {
    if (sheet === 'camera') setState('aim')
  }, [sheet])
  const capture = () => {
    setState('got')
    window.setTimeout(() => {
      dispatch({ type: 'answer', patch: { cardPhoto: true } })
      setSheet('none')
      say('Photo of your card added.')
    }, 900)
  }
  return (
    <Sheet tone="dark" open={sheet === 'camera'} onOpenChange={(o) => !o && setSheet('none')} title="Photo of your card" description="Hold the front of your card inside the frame." container={phoneEl}>
      <div className="relative mx-auto aspect-[1.58] w-full overflow-hidden rounded-[1.2rem] bg-[#2a2426]">
        <div aria-hidden="true" className="absolute inset-5 rounded-[0.9rem]">
          {['left-0 top-0 border-l-4 border-t-4 rounded-tl-xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-xl'].map((c) => (
            <span key={c} className={cn('absolute size-8 border-white', c)} />
          ))}
          {state === 'aim' ? <span className="absolute inset-x-2 top-2 h-0.5 animate-scan bg-hot-200 shadow-[0_0_12px_2px_rgb(249_198_212/0.8)]" /> : null}
        </div>
        <AnimatePresence>
          {state === 'got' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center bg-teal/85">
              <span className="flex items-center gap-2 text-[1.3rem] font-bold">
                <Check size={26} strokeWidth={3} aria-hidden="true" /> Got it
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-[1rem] text-white/70">Demo: no real camera is used.</p>
      <div className="mt-5 flex flex-col gap-2.5">
        <BigButton onClick={capture} icon={<Camera size={21} aria-hidden="true" />}>
          Use sample photo
        </BigButton>
        <button onClick={() => setSheet('none')} className="min-h-12 text-[1.12rem] font-bold text-white/85 underline underline-offset-4">
          Cancel
        </button>
      </div>
    </Sheet>
  )
}

function Announcer() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null)
  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      setMsg({ id: Date.now(), text })
    }
    window.addEventListener('caravan:say', onSay)
    return () => window.removeEventListener('caravan:say', onSay)
  }, [])
  useEffect(() => {
    if (!msg) return
    const id = window.setTimeout(() => setMsg(null), 2800)
    return () => window.clearTimeout(id)
  }, [msg])
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-4 top-[5.6rem] z-30 flex justify-center">
      <AnimatePresence>
        {msg && (
          <motion.p key={msg.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-full bg-ink px-5 py-2.5 text-center text-[1.02rem] font-bold text-white shadow-solid">
            {msg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
