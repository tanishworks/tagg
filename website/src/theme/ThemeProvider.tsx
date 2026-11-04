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
    document.documentElement.dataset.theme = mode
    writeStoredMode(mode)
  }, [mode])

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
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}

// Re-export so callers can import theme helpers from one place.
export { themeToCssVars }
export type { ThemeMode }
