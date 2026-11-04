import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { palette, themeToCssVars } from './theme'
import type { ThemeMode } from './theme'

interface ThemeContextValue {
  mode: ThemeMode
  colors: ReturnType<typeof palette>
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'tagg-site-theme'

function readStoredMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch {
    return null
  }
}

function writeStoredMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage unavailable (private mode etc.) — the toggle still works live.
  }
}

function initialMode(): ThemeMode {
  const stored = readStoredMode()
  if (stored) return stored
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = mode

    // Publish the palette on :root — not on a component below it — so html,
    // body and every fixed-position layer can read the same variables.
    for (const [name, value] of Object.entries(themeToCssVars(mode))) {
      if (typeof value === 'string') root.style.setProperty(name, value)
    }

    writeStoredMode(mode)
  }, [mode])

  // Follow the OS color-mode preference live, unless the visitor explicitly
  // toggled on this device — the stored override wins.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (event: MediaQueryListEvent) => {
      if (readStoredMode()) return
      setMode(event.matches ? 'light' : 'dark')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palette(mode),
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Access theme colors + mode. Every component colors itself through this. */
// Provider + hook intentionally share one file (canonical React context
// pattern); Fast Refresh degrades slightly on context edits — accepted.
// oxlint-disable-next-line react/only-export-components
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}

// Access theme helpers directly from './theme' — this file only exports the
// provider + hook (an oxlint fast-refresh rule requires component-only files).
