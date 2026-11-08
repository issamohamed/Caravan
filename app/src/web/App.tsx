import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TourFloating, TourHighlight, useTour } from '../shared/Tour'
import { clinicTour } from '../shared/tours'
import { startRoute } from '../shared/util'
import { AuditLog } from './pages/AuditLog'
import { DeskBoard } from './pages/DeskBoard'
import { Home } from './pages/Home'
import { Imports } from './pages/Imports'
import { Insights } from './pages/Insights'
import { PhoneCheckins } from './pages/PhoneCheckins'
import { QuestionSets } from './pages/QuestionSets'
import { ReviewQueue } from './pages/ReviewQueue'
import { Routines } from './pages/Routines'
import { CommandPalette, ROUTES, Shell, ShortcutsDialog, useGlobalKeys, useTheme, type RouteId } from './Shell'
import { StoreProvider } from './store'

const TITLES: Record<RouteId, string> = {
  home: 'Home',
  desk: 'Desk board',
  phone: 'Phone check-ins',
  review: 'Review queue',
  imports: 'Imports',
  questions: 'Question sets',
  routines: 'Routines',
  audit: 'Audit log',
  insights: 'Insights',
}

export function App() {
  const [route, setRoute] = useState<RouteId>(() => startRoute(ROUTES, 'home'))
  const [focus, setFocus] = useState<string | undefined>(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('f') ?? undefined)
  const [theme, setTheme] = useTheme()
  const first = useRef(true)

  const go = useCallback((r: string, f?: string) => {
    const next = (ROUTES as readonly string[]).includes(r) ? (r as RouteId) : 'home'
    setRoute(next)
    setFocus(f)
    try {
      history.pushState(null, '', `#/${next}${f ? `?f=${f}` : ''}`)
    } catch {
      /* sandboxed preview: in-memory routing still works */
    }
  }, [])

  useEffect(() => {
    const onPop = () => setRoute(startRoute(ROUTES, 'home'))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.title = `${TITLES[route]} · Caravan for clinics`
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    const id = window.setTimeout(() => document.querySelector<HTMLElement>('[data-page-title]')?.focus({ preventScroll: true }), 260)
    return () => window.clearTimeout(id)
  }, [route])

  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider go={go}>
        <Frame route={route} focus={focus} theme={theme} setTheme={setTheme} />
      </StoreProvider>
    </MotionConfig>
  )
}

function Frame({ route, focus, theme, setTheme }: { route: RouteId; focus?: string; theme: ReturnType<typeof useTheme>[0]; setTheme: ReturnType<typeof useTheme>[1] }) {
  const [palette, setPalette] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const openPalette = useCallback(() => setPalette(true), [])
  const openShortcuts = useCallback(() => setShortcuts(true), [])
  useGlobalKeys(openPalette, openShortcuts)
  const tour = useTour('Clinic tour', clinicTour)

  const pages: Record<RouteId, ReactNode> = {
    home: <Home openPalette={openPalette} />,
    desk: <DeskBoard />,
    phone: <PhoneCheckins focus={focus} />,
    review: <ReviewQueue focus={focus} />,
    imports: <Imports />,
    questions: <QuestionSets />,
    routines: <Routines />,
    audit: <AuditLog />,
    insights: <Insights />,
  }

  return (
    <>
      <Shell route={route} theme={theme} setTheme={setTheme} openPalette={openPalette} openShortcuts={openShortcuts}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={route} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
            {pages[route]}
          </motion.div>
        </AnimatePresence>
      </Shell>
      <TourHighlight tour={tour} />
      <TourFloating tour={tour} />
      <CommandPalette open={palette} setOpen={setPalette} theme={theme} setTheme={setTheme} openShortcuts={openShortcuts} />
      <ShortcutsDialog open={shortcuts} setOpen={setShortcuts} />
      <Toaster
        position="bottom-right"
        offset={20}
        gap={10}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex w-[min(380px,calc(100vw-32px))] items-center gap-3 rounded-[22px] bg-ink px-4 py-3.5 font-sans text-[13.5px] text-white shadow-[0_24px_50px_-20px_rgb(35_31_32/0.8)] ring-1 ring-white/10 dark:bg-white dark:text-ink',
            title: 'font-medium leading-snug',
            description: 'mt-0.5 text-[12.5px] text-white/70 dark:text-ink/70',
            actionButton: '!ml-auto shrink-0 rounded-full !bg-hot px-3.5 py-1.5 text-[12.5px] font-semibold !text-white hover:!bg-hot-600',
            icon: 'text-teal-300 dark:text-teal',
          },
        }}
      />
    </>
  )
}
