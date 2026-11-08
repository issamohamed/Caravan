import type { ReactNode } from 'react'
import { Logo } from '../shared/Logo'
import { cn } from '../shared/util'

type Page = 'gallery' | 'case-study'

/** `root` is the path from the current page back to the site root, such as '' or '../'. */
export function SiteHeader({ root, current }: { root: string; current: Page }) {
  const home = root || './'
  const links: { href: string; label: string; page?: Page }[] = [
    { href: home, label: 'Gallery', page: 'gallery' },
    { href: `${root}case-study/`, label: 'Case study', page: 'case-study' },
    { href: `${root}patient/`, label: 'Patient app' },
    { href: `${root}clinic/`, label: 'Clinic app' },
  ]
  return (
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pt-6 sm:px-8">
      <a href={home} className="rounded-full" aria-label="Caravan gallery">
        <Logo size="text-[2.1rem]" className="text-ink" />
      </a>
      <nav aria-label="Site">
        <ul className="flex flex-wrap gap-1">
          {links.map((l) => {
            const on = l.page === current
            return (
              <li key={l.label}>
                <a
                  href={l.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn('inline-flex min-h-11 items-center rounded-full px-4 text-[14px] font-medium transition-colors', on ? 'bg-ink text-white shadow-solid' : 'text-fg hover:bg-white/60')}
                >
                  {l.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export function SampleTag({ className }: { className?: string }) {
  return <span className={cn('inline-flex rounded-full bg-teal-deep px-3.5 py-1.5 text-[13px] font-medium text-white', className)}>Sample data · no real patients</span>
}

export function SiteFooter({ root }: { root: string }) {
  return (
    <footer className="mx-auto mt-16 flex max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-8 text-[14px] text-fg-muted sm:px-8">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <Logo size="text-[1.2rem]" className="text-ink" /> Concept project · all names and numbers are made up · no real patients, health systems or EHR screens
      </span>
      <span className="flex flex-wrap gap-x-4">
        <a href={root || './'} className="font-medium text-accent-fg underline underline-offset-2">
          Gallery
        </a>
        <a href={`${root}case-study/`} className="font-medium text-accent-fg underline underline-offset-2">
          Case study
        </a>
      </span>
    </footer>
  )
}

export function Section({ id, title, intro, children, className }: { id: string; title: string; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('mt-16', className)}>
      <h2 id={id} className="font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {intro && <div className="mt-2 max-w-[68ch] text-[16.5px] leading-relaxed text-fg-muted">{intro}</div>}
      {children}
    </section>
  )
}
