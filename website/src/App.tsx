import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { AsciiSkeleton } from 'ascii-reveal'
import { ThemeProvider } from './theme/ThemeProvider'
import { DocsSidebarProvider, useDocsSidebar } from './lib/useDocsSidebar'
import { GITHUB_URL, useHashRoute } from './lib/useHashRoute'
import type { Route } from './lib/useHashRoute'
import { PillNav } from './components/PillNav'
import { GithubLink, ThemeToggle } from './components/Icons'
import { Home } from './pages/Home'
import { Gameplay } from './pages/Gameplay'
import { Docs } from './pages/Docs'
import { useFontsReady } from './lib/useFontsReady'

const NAV_ITEMS: readonly { label: string; route: Route }[] = [
  { label: 'HOME', route: '/' },
  { label: 'GAMEPLAY', route: '/gameplay' },
  { label: 'DOCS', route: '/docs' },
]

const PAGES: Record<Route, ComponentType> = {
  '/': Home,
  '/gameplay': Gameplay,
  '/docs': Docs,
}

function SiteHeader() {
  const { route, navigate } = useHashRoute()
  const { open, setOpen } = useDocsSidebar()

  // Auto-hide on scroll-down; reveal on scroll-up, near the page top, or
  // when the pointer comes near the top edge of the screen. The scroll
  // check is coalesced through requestAnimationFrame so it runs at most
  // once per frame.
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        setScrolled(y > 8)
        if (y < 120) {
          setHidden(false)
        } else if (y > lastY + 4) {
          setHidden(true)
        } else if (y < lastY - 4) {
          setHidden(false)
        }
        lastY = y
      })
    }
    const onPointer = (event: PointerEvent) => {
      if (event.clientY <= 40) setHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointermove', onPointer)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointermove', onPointer)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <header
      className="site-header"
      data-hidden={hidden ? 'true' : 'false'}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <div className="header-left">
        <a className="brand" href="#/">
          TAGG
        </a>
        {route === '/docs' && (
          <button
            type="button"
            className="icon-button header-docs-toggle"
            aria-label="Toggle docs contents"
            aria-expanded={open}
            aria-controls="docs-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="icon-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        )}
      </div>
      <PillNav items={NAV_ITEMS} active={route} onChange={navigate} />
      <div className="header-actions">
        <GithubLink />
        <ThemeToggle />
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© 2026 TAGG</span>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer">
        github.com/tanishworks/tagg
      </a>
    </footer>
  )
}

export function PageSkeleton() {
  return (
    <div className="fonts-loading" aria-hidden="true">
      <AsciiSkeleton variant="scan" lines={4} />
    </div>
  )
}

function Site() {
  const { route } = useHashRoute()
  // Holds page content until the webfonts are really loaded, so ascii-reveal
  // measures/scrambles in the final font instead of fallback → swap.
  const fontsReady = useFontsReady()

  // `key` remounts the page on every navigation so ascii-reveal decodes in again.
  const Page = PAGES[route] ?? Home

  return (
    <div className="site">
      <div className="site-bg" aria-hidden="true" />
      <SiteHeader />
      <main className="site-content" aria-busy={!fontsReady}>
        {fontsReady ? <Page key={route} /> : <PageSkeleton />}
      </main>
      <SiteFooter />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DocsSidebarProvider>
        <Site />
      </DocsSidebarProvider>
    </ThemeProvider>
  )
}
