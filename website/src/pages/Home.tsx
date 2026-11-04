import { AsciiReveal } from 'ascii-reveal'

const FEATURES = [
  {
    title: 'LIVE LOBBIES',
    body: 'Join with a lobby ID. Players, hosts and roles update for everyone as they change — no refresh required.',
  },
  {
    title: 'HUNTER / HIDER',
    body: 'Every player draws a role. Hiders scatter, hunters seek. Artificial balance in the most asymmetric game there is.',
  },
  {
    title: 'REAL COORDINATES',
    body: 'Live GPS position flows through the lobby. There is no map and no arena — the real world is the play field.',
  },
  {
    title: 'FAST WHERE IT COUNTS',
    body: 'Gameplay state lives in memory on Cloudflare Durable Objects. The database only sees joins and conclusions.',
  },
] as const

export function Home() {
  return (
    <>
      <section className="hero">
        <AsciiReveal preset="terminal" duration="cinematic">
          <p className="eyebrow" data-ascii="fade">
            // real-time · location-based · multiplayer
          </p>
          <h1 className="display">TAGG</h1>
          <p className="tagline">
            Hide-and-seek in the real world. Open a lobby, hand out hunter and hider roles, and tag
            by GPS — everything between you is the game board.
          </p>
          <div className="hero-actions">
            <a className="btn btn-solid" href="#/gameplay" data-ascii="fade">
              HOW TO PLAY →
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/tanishworks/tagg"
              target="_blank"
              rel="noreferrer"
              data-ascii="fade"
            >
              GITHUB
            </a>
          </div>
        </AsciiReveal>
      </section>

      <section className="section">
        <header className="section-head">
          <span className="section-kicker">01 // WHAT IT DOES</span>
          <h2 className="section-title">Features</h2>
        </header>
        <AsciiReveal preset="decode">
          <ul className="card-grid">
            {FEATURES.map((feature, index) => (
              <li className="card" data-ascii="surface" key={feature.title}>
                <span className="card-index">[{String(index + 1).padStart(2, '0')}]</span>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-body">{feature.body}</p>
              </li>
            ))}
          </ul>
        </AsciiReveal>
      </section>
    </>
  )
}
