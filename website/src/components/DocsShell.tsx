import { useEffect, useState } from 'react'

export interface DocsSection {
    id: string
    label: string
}

interface DocsShellProps {
    /** Every navigable section of the docs page, in order. */
    sections: readonly DocsSection[]
    /** Rendered HTML for the article (already site-styled by lib/markdown). */
    html: string
}

/**
 * The docs area chrome: a toggle button that opens a drawer sidebar listing
 * every section, plus the markdown-rendered article. All interactive parts
 * carry `data-ascii="skip"` so they are usable immediately while the article
 * still decodes in through the wrapping AsciiReveal.
 *
 * Section links scroll (scrollIntoView) instead of navigating — the hash
 * router owns location.hash, so anchors stay purely decorative ids.
 */
export function DocsShell({ sections, html }: DocsShellProps) {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState<string>(sections[0]?.id ?? '')

    // Esc closes the drawer while it is open.
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
    }, [open])

    // Scroll-spy: whichever section heading sits in the top band of the
    // viewport is highlighted in the sidebar.
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
        setOpen(false)
    }

    const toggle = () => setOpen((value) => !value)

    return (
        <>
            <div className="docs-toolbar" data-ascii="skip">
                <button
                    type="button"
                    className="docs-toggle"
                    onClick={toggle}
                    aria-expanded={open}
                    aria-controls="docs-drawer"
                >
                    [CONTENTS]
                </button>
                <span className="docs-hint">// {sections.length} sections</span>
            </div>

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
