import type { ComponentType } from 'react'
import { AsciiSkeleton } from 'ascii-reveal'
import { ThemeProvider } from './theme/ThemeProvider'
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
  return (
    <header className="site-header">
      <a className="brand" href="#/">
        TAGG
      </a>
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
      <Site />
    </ThemeProvider>
  )
}
