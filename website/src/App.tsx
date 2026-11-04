import type { ComponentType } from 'react'
import { ThemeProvider, themeToCssVars, useTheme } from './theme/ThemeProvider'
import { GITHUB_URL, useHashRoute } from './lib/useHashRoute'
import type { Route } from './lib/useHashRoute'
import { PillNav } from './components/PillNav'
import { GithubLink, ThemeToggle } from './components/Icons'
import { Home } from './pages/Home'
import { Gameplay } from './pages/Gameplay'
import { Docs } from './pages/Docs'

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

function Site() {
  const { mode } = useTheme()
  const { route } = useHashRoute()

  // `key` remounts the page on every navigation so ascii-reveal decodes in again.
  const Page = PAGES[route] ?? Home

  return (
    <div className="site" data-mode={mode} style={themeToCssVars(mode)}>
      <div className="site-bg" aria-hidden="true" />
      <SiteHeader />
      <main className="site-content">
        <Page key={route} />
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
