import { AsciiReveal } from 'ascii-reveal'
import { useTheme } from '../theme/ThemeProvider'

export function Home() {
    // The hero icon follows the mode: Dark variant (teal dot on dark) in dark
    // mode, Default variant (teal dot on light) in light mode.
    const { mode } = useTheme()
    return (
        <section className="hero hero-fill">
            {/* The tagg itself, drawn in glyphs in the top-right corner. The library
                forces `position: relative` on its own wrapper inline, so the geometry
                lives on this parent and the reveal fills it. `loading` stays true
                because a static page has no request to finish — the ghost simply
                keeps drifting. `data-ascii="skip"` keeps the hero's reveal off it. */}
            <div className="hero-mascot" aria-hidden="true" data-ascii="skip">
                <AsciiReveal mascot="ghost" loading />
            </div>
            <AsciiReveal preset="terminal" duration="cinematic">
                <p className="eyebrow" data-ascii="fade">
                    // README.md
                </p>
                <img
                    className="hero-icon"
                    src={mode === 'light' ? '/tagg/tagg-icon-default-256.png' : '/tagg/tagg-icon-256.png'}
                    alt="Tagg app icon — a player triangle over a tag dot"
                    width={256}
                    height={256}
                    data-ascii="fade"
                />
                <h1 className="display">TAGG</h1>
                <p className="tagline">
                    Hide-and-seek in the real world. Open a lobby, hand out hunter and hider roles, and tag
                    by GPS. Open world game btw.
                </p>
                <div className="hero-actions">
                    <a
                        className="btn btn-solid"
                        href="https://github.com/tanishworks/tagg"
                        target="_blank"
                        rel="noreferrer"
                        data-ascii="fade"
                    >
                        GITHUB
                    </a>
                    <a className="btn btn-solid" href="#/gameplay" data-ascii="fade">
                        HOW TO PLAY →
                    </a>
                </div>
                <p className="install-pill" data-ascii="fade">
                    # package manager builds soon
                </p>
            </AsciiReveal>
        </section>
    )
}
