import { AsciiReveal } from 'ascii-reveal'

const ROLE_CARDS = [
  {
    title: 'HUNTER',
    body: 'Starts at the base with a head start delay. Wins by getting within tag range of every hider before time runs out.',
  },
  {
    title: 'HIDER',
    body: 'Scatters in any direction the moment the round starts. Staying alive outside tag range is the entire job.',
  },
] as const

const STEPS = [
  'Create a lobby on the API and share its ID with friends.',
  'Join the lobby — players, host and roles sync live.',
  'Everyone gets a role: hunter or hider.',
  'The round runs on live GPS positions inside the lobby.',
  'A tag is a position inside range. Wins are recorded to the database when the lobby concludes.',
] as const

export function Gameplay() {
  return (
    <>
      <section className="hero hero-compact">
        <AsciiReveal preset="terminal" duration="cinematic">
          <p className="eyebrow" data-ascii="fade">
            // gameplay.md
          </p>
          <h1 className="display display-small">HOW IT PLAYS</h1>
        </AsciiReveal>
      </section>

      <section className="section">
        <header className="section-head">
          <span className="section-kicker">01 // RULES</span>
          <h2 className="section-title">Roles</h2>
        </header>
        <AsciiReveal preset="decode">
          <ul className="card-grid">
            {ROLE_CARDS.map((role, index) => (
              <li className="card" data-ascii="surface" key={role.title}>
                <span className="card-index">[{String(index + 1).padStart(2, '0')}]</span>
                <h3 className="card-title">{role.title}</h3>
                <p className="card-body">{role.body}</p>
              </li>
            ))}
          </ul>
        </AsciiReveal>
      </section>

      <section className="section">
        <header className="section-head">
          <span className="section-kicker">02 // FLOW</span>
          <h2 className="section-title">A round, in order</h2>
        </header>
        <AsciiReveal preset="decode">
          <ol className="steps" data-ascii="fade">
            {STEPS.map((step, index) => (
              <li className="step" key={step}>
                <span className="step-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </AsciiReveal>
      </section>
    </>
  )
}
