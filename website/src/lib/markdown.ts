import { Marked } from 'marked'
import type { Token, Tokens } from 'marked'

/**
 * Markdown → HTML pipeline for the docs area.
 *
 * Content is authored as plain markdown files (`src/content/*.md`), imported
 * with Vite's `?raw`, and rendered once at module load. The custom renderer
 * maps everything onto existing site elements so markdown output looks like
 * the rest of the site without hand-written markup:
 * - H2 headings get URL-safe slugged ids for the docs sidebar to target.
 * - Fenced code blocks render as the site's terminal window.
 * - External http(s) links open in a new tab, interior links don't.
 *
 * marked v18 renderer API: hooks receive the token object and `this.parser`
 * is available to render inline tokens (links, bold, inline code) back to HTML.
 */

export interface DocHeading {
    id: string
    text: string
    /** 2 = category (kicker + section-title separator), 3 = section (docs heading). */
    depth: 2 | 3
}

/** Minimal shape of `this` inside renderer hooks (subset of marked's Parser). */
interface RendererThis {
    parser: {
        parseInline(tokens: Token[]): string
    }
}

/**
 * Kickers continue the docs page's numbered sections (01 STACK, 02 API are
 * JSX in Docs.tsx), so the first markdown category renders as 03. Keep in
 * sync if the JSX sections change.
 */
const KICKER_BASE = 2

/** Running category counter — reset at the start of every render. */
let categoryCount = 0

/** URL-safe slugs for heading anchors. The hash router owns location hash for
 * page navigation, so these ids are for in-page scrolling only — the sidebar
 * targets them with scrollIntoView, never with hrefs. */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** marked leaves raw text unescaped for us to handle. */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

const renderer = {
    heading(this: RendererThis, token: Tokens.Heading): string {
        const inner = this.parser.parseInline(token.tokens)
        // H2 = broad category, rendered exactly like the page's other section
        // heads: kicker (auto-numbered, continuing the JSX sections) + title.
        if (token.depth === 2) {
            categoryCount += 1
            const kickerNumber = String(KICKER_BASE + categoryCount).padStart(2, '0')
            const kicker = `${kickerNumber}: // ${token.text.toUpperCase()}`
            return (
                '<header class="section-head docs-cat-head">' +
                `<span class="section-kicker">${kicker}</span>` +
                `<h2 id="${slugify(token.text)}" class="section-title">${inner}</h2>` +
                '</header>\n'
            )
        }
        return `<h${token.depth} id="${slugify(token.text)}" class="docs-h${token.depth}">${inner}</h${token.depth}>\n`
    },

    /** Fenced code → the site's terminal window (chrome bar stays `skip` so it
     * is treated as chrome by ascii-reveal, like every other terminal). */
    code(token: Tokens.Code): string {
        const label = token.lang ? `tagg — ${token.lang}` : 'tagg'
        const bar =
            '<div class="terminal-bar" data-ascii="skip">' +
            '<span class="terminal-dot"></span>' +
            '<span class="terminal-dot"></span>' +
            '<span class="terminal-dot"></span>' +
            `<span class="terminal-label">${escapeHtml(label)}</span>` +
            '</div>'
        return (
            '<div class="terminal docs-terminal" data-ascii="surface">' +
            bar +
            `<pre><code>${escapeHtml(token.text)}</code></pre>` +
            '</div>\n'
        )
    },

    link(this: RendererThis, token: Tokens.Link): string {
        const inner = this.parser.parseInline(token.tokens)
        const external = /^https?:\/\//.test(token.href)
        const attrs = external ? ' target="_blank" rel="noreferrer"' : ''
        return `<a href="${escapeHtml(token.href)}"${attrs} class="docs-link">${inner}</a>`
    },
}

const markdown = new Marked()
markdown.use({ renderer })

/** Shared instance: parse a markdown source string to site-styled HTML. */
export function renderMarkdown(source: string): string {
    categoryCount = 0
    return markdown.parse(source, { async: false })
}

/** Extract category (H2) + section (H3) headings (id, text, depth), in
 * order — this is what the docs sidebar shows. */
export function docHeadings(source: string): DocHeading[] {
    return markdown
        .lexer(source)
        .filter(
            (token): token is Tokens.Heading =>
                token.type === 'heading' && ((token as Tokens.Heading).depth === 2 || (token as Tokens.Heading).depth === 3),
        )
        .map((heading) => ({
            id: slugify(heading.text),
            text: heading.text,
            depth: heading.depth as 2 | 3,
        }))
}
