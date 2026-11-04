import { AsciiReveal } from 'ascii-reveal'
import { DocsShell } from '../components/DocsShell'
import type { DocsSection } from '../components/DocsShell'
import { useDocsSidebar } from '../lib/useDocsSidebar'
import { docHeadings, renderMarkdown } from '../lib/markdown'
import docsSource from '../content/docs.md?raw'

const STACK_CARDS = [
    {
        title: 'CLOUDFLARE WORKER',
        body: 'Hono routes handle lobby joins, leaves, roles. Identity and statistics come from Supabase.',
    },
    {
        title: 'DURABLE OBJECTS',
        body: 'LobbyRoom keeps players, roles and coordinates in memory and pushes updates out. This is where the game actually runs.',
    },
    {
        title: 'SUPABASE',
        body: 'Player information and statistics so you can pull up the history whenever your friends beef with you.',
    },
    {
        title: 'SUPABASE AUTH',
        body: 'Auth with RLS policies to keep your data secure and accessible by lobby members when needed.'
    }
] as const

const ENDPOINT_LINES = [
    ['POST', '/lobby/join', 'join a lobby by id'],
    ['POST', '/lobby/leave', 'leave the current lobby'],
    ['POST', '/lobby/role', 'draw or switch your role'],
    ['GET', '/lobby/:id', 'read the lobby roster'],
] as const

// Markdown (src/content/docs.md) → site-styled HTML, parsed once at load.
// Sidebar = the three JSX sections above + every H2 in the markdown.
const DOCS_HTML = renderMarkdown(docsSource)

const DOC_SECTIONS: DocsSection[] = [
    { id: 'stack', label: 'Under the hood', level: 0 },
    { id: 'api', label: 'Lobby endpoints', level: 0 },
    ...docHeadings(docsSource).map((heading): DocsSection => ({
        id: heading.id,
        label: heading.text,
        level: heading.depth === 2 ? 0 : 1,
    })),
]

export function Docs() {
    const { open } = useDocsSidebar()
    return (
        <div className={'docs-page' + (open ? ' docs-open' : '')}>
            <section className="hero hero-compact">
                <AsciiReveal preset="terminal" duration="cinematic">
                    <p className="eyebrow" data-ascii="fade">
            // DOCS.md
                    </p>
                    <h1 className="display display-small">DOCUMENTATION</h1>
                </AsciiReveal>
            </section>

            <section className="section">
                <header className="section-head">
                    <span className="section-kicker">01: // STACK</span>
                    <h2 className="section-title" id="stack">Under the hood</h2>
                </header>
                <AsciiReveal preset="decode">
                    <ul className="card-grid">
                        {STACK_CARDS.map((item, index) => (
                            <li className="card" data-ascii="surface" key={item.title}>
                                <span className="card-index">[{String(index + 1).padStart(2, '0')}]</span>
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-body">{item.body}</p>
                            </li>
                        ))}
                    </ul>
                </AsciiReveal>
            </section>

            <section className="section">
                <header className="section-head">
                    <span className="section-kicker">02: // API</span>
                    <h2 className="section-title" id="api">Lobby endpoints</h2>
                </header>
                <AsciiReveal>
                    <div className="terminal" data-ascii="surface">
                        <div className="terminal-bar" data-ascii="skip">
                            <span className="terminal-dot" />
                            <span className="terminal-dot" />
                            <span className="terminal-dot" />
                            <span className="terminal-label">tagg — cloudflare worker</span>
                        </div>
                        <pre>
                            {ENDPOINT_LINES.map(([method, path, description]) => (
                                <span key={path}>
                                    <b>{method.padEnd(6, ' ')}</b> {path.padEnd(14, ' ')}{' '}
                                    <span className="terminal-comment"># {description}</span>
                                    {'\n'}
                                </span>
                            ))}
                        </pre>
                    </div>
                </AsciiReveal>
            </section>


            <section className="section">
                <AsciiReveal preset="decode">
                    <DocsShell sections={DOC_SECTIONS} html={DOCS_HTML} />
                </AsciiReveal>
            </section>
        </div>
    )
}
