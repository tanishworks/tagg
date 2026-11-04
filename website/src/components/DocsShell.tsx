import { useEffect, useState } from 'react'
import { useDocsSidebar } from '../lib/useDocsSidebar'

export interface DocsSection {
    id: string
    label: string
    /** 0 = broad category (bold in the sidebar), 1 = section under it (indented). */
    level: 0 | 1
}

interface DocsShellProps {
    /** Every navigable section of the docs page, in order. */
    sections: readonly DocsSection[]
    /** Rendered HTML for the article (already site-styled by lib/markdown). */
    html: string
}

/**
 * The docs area chrome: a toggleable sidebar listing every section, plus the
 * markdown-rendered article.
 *
 * Open state comes from `useDocsSidebar` so the header toggle (left of the
 * pill nav) and this sidebar share one source of truth. Below the wide
 * breakpoint (960px) the sidebar is a fixed drawer with a scrim; on wide
 * screens it is a persistent left rail and the page content shifts right.
 *
 * The sidebar is interactive immediately (`data-ascii="skip"`) while the
 * article decodes in through the wrapping AsciiReveal.
 *
 * Section links scroll (scrollIntoView) instead of navigating — the hash
 * router owns location.hash, so anchors stay purely decorative ids.
 */
export function DocsShell({ sections, html }: DocsShellProps) {
    const { open, setOpen } = useDocsSidebar()
    const [active, setActive] = useState<string>(sections[0]?.id ?? '')

    // Esc closes the sidebar while it is open.
    useEffect(() => {
        if (!open) {
            return
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, setOpen])

    // Scroll-spy: whichever section heading sits in the top band of the
    // viewport is highlighted (bold) in the sidebar.
    useEffect(() => {
        const headings = sections
            .map((section) => document.getElementById(section.id))
            .filter((element): element is HTMLElement => element !== null)
        if (headings.length === 0) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting)
                if (visible.length === 0) {
                    return
                }
                const topmost = visible.reduce((a, b) =>
                    a.target.getBoundingClientRect().top <=
                    b.target.getBoundingClientRect().top
                        ? a
                        : b,
                )
                setActive(topmost.target.id)
            },
            { rootMargin: '-15% 0px -60% 0px' },
        )
        headings.forEach((heading) => observer.observe(heading))
        return () => observer.disconnect()
    }, [sections])

    const jumpTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // On narrow screens the sidebar is an overlay drawer — close it after
        // jumping. On wide screens it is a persistent rail; keep it open.
        if (!window.matchMedia('(min-width: 960px)').matches) {
            setOpen(false)
        }
    }

    return (
        <>
            <div
                className="docs-scrim"
                data-open={open ? 'true' : 'false'}
                aria-hidden="true"
                onClick={() => setOpen(false)}
            />

            <aside
                id="docs-drawer"
                className="docs-drawer"
                data-open={open ? 'true' : 'false'}
                aria-label="Documentation contents"
                data-ascii="skip"
            >
                <div className="docs-drawer-head">
                    <span className="docs-drawer-kicker">CONTENT</span>
                    <button
                        type="button"
                        className="icon-button docs-close"
                        aria-label="Close contents"
                        onClick={() => setOpen(false)}
                    >
                        ×
                    </button>
                </div>
                <nav className="docs-nav">
                    {sections.map((section, index) => (
                        <button
                            key={section.id}
                            type="button"
                            className="docs-section-link"
                            data-level={section.level}
                            data-active={active === section.id ? 'true' : undefined}
                            onClick={() => jumpTo(section.id)}
                        >
                            <span className="docs-section-index">
                                [{String(index + 1).padStart(2, '0')}]
                            </span>
                            {section.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <article className="docs-article" dangerouslySetInnerHTML={{ __html: html }} />
        </>
    )
}
