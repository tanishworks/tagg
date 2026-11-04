import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

/**
 * Shared open/closed state for the docs sidebar.
 *
 * Consumed by two unrelated pieces of chrome: the header toggle button
 * (left of the pill nav) and the sidebar itself (DocsShell's drawer/rail),
 * so a plain context is the simplest honest wiring.
 *
 * Initial value is decided by viewport: wide screens start with the docs
 * structure visible as a persistent left rail, narrow screens start closed
 * (drawer). It is set once at mount — resize does not forcibly change it.
 */

interface DocsSidebarValue {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

const DocsSidebarContext = createContext<DocsSidebarValue | null>(null)

const WIDE_QUERY = '(min-width: 960px)'

export function DocsSidebarProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(() => window.matchMedia(WIDE_QUERY).matches)
    return (
        <DocsSidebarContext.Provider value={{ open, setOpen }}>
            {children}
        </DocsSidebarContext.Provider>
    )
}

/** Access the docs sidebar open state. */
// Provider + hook intentionally share one file (canonical React context
// pattern); Fast Refresh degrades slightly on context edits — accepted.
// oxlint-disable-next-line react/only-export-components
export function useDocsSidebar(): DocsSidebarValue {
    const value = useContext(DocsSidebarContext)
    if (!value) throw new Error('useDocsSidebar must be used inside <DocsSidebarProvider>')
    return value
}
