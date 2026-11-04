import { AsciiReveal } from 'ascii-reveal'

const STACK_CARDS = [
  {
    title: 'WORKER API',
    body: 'Hono routes handle lobby joins, leaves, roles. Identity comes from Supabase JWTs, verified against the project JWKS.',
  },
  {
    title: 'DURABLE OBJECTS',
    body: 'LobbyRoom keeps players, roles and coordinates in memory and pushes updates out. This is where the game actually runs.',
  },
  {
    title: 'SUPABASE',
    body: 'Auth and the persistent profile: current lobby pointer and wins, protected by row level security.',
  },
] as const

const ENDPOINT_LINES = [
  ['POST', '/lobby/join', 'join a lobby by id'],
  ['POST', '/lobby/leave', 'leave the current lobby'],
  ['GET', '/lobby/:id', 'read the lobby roster'],
  ['POST', '/lobby/role', 'draw or switch your role'],
] as const

export function Docs() {
  return (
    <>
      <section className="hero hero-compact">
        <AsciiReveal preset="terminal" duration="cinematic">
          <p className="eyebrow" data-ascii="fade">
            // docs.md
          </p>
          <h1 className="display display-small">THE API</h1>
        </AsciiReveal>
      </section>

      <section className="section">
        <header className="section-head">
          <span className="section-kicker">01 // HTTP</span>
          <h2 className="section-title">Lobby endpoints</h2>
        </header>
        <AsciiReveal>
          <div className="terminal" data-ascii="surface">
            <div className="terminal-bar" data-ascii="skip">
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-label">tagg — lobby</span>
            </div>
            <pre data-ascii="skip">
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
        <header className="section-head">
          <span className="section-kicker">02 // STACK</span>
          <h2 className="section-title">Under the hood</h2>
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
          <span className="section-kicker">03 // CLIENT</span>
          <h2 className="section-title">Coming from the repo</h2>
        </header>
        <AsciiReveal>
          <div className="terminal" data-ascii="surface">
            <div className="terminal-bar" data-ascii="skip">
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-dot" />
              <span className="terminal-label">zsh</span>
            </div>
            <pre data-ascii="skip">
              {'npm i github:tanishworks/tagg\n./mobile          # expo client (in development)\ntagg-apis/        # worker api source\nagent-docs/       # architecture & rules'}
            </pre>
          </div>
        </AsciiReveal>
      </section>
    </>
  )
}

