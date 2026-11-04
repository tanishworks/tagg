import { useEffect, useState } from 'react'

/**
 * Minimal hash router. Hash routes work on GitHub Pages without any
 * server-side rewrite rules, which is why we don't use react-router here.
 */

const ROUTES = ['/', '/gameplay', '/docs'] as const

export type Route = (typeof ROUTES)[number]

export const GITHUB_URL = 'https://github.com/tanishworks/tagg'

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '')
  const candidate = hash === '' ? '/' : hash
  return (ROUTES as readonly string[]).includes(candidate) ? (candidate as Route) : '/'
}

export function isRoute(value: string): value is Route {
  return (ROUTES as readonly string[]).includes(value)
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash())

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: Route) => {
    window.location.hash = next
  }

  return { route, navigate }
}
