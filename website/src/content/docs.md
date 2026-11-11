## Concepts

### Overview

Tagg is a real-time, location-based game of tag — hide-and-seek style, played in lobbies from a phone. Players take `hunter` and `hider` roles, share live GPS coordinates, and try to survive the round.

The architecture splits work by temperature:

- **Hot path (RAM at the edge)** — GPS updates, tags and broadcasts run entirely inside the `LobbyRoom` Durable Object. No database in the loop, no write load.
- **Cold path (persistent)** — accounts, lobby membership, career stats live in Supabase Auth + Postgres and are touched only at lobby transitions.
- **The Worker (Hono)** — the doorway between the two: HTTP routing, JWT validation, guard rails.

### Lifecycle

A match flows through four phases:

1. **Sign in** — Supabase Auth issues a JWT access token.
2. **Join a lobby** — the Worker verifies the token, checks your `current_lobby_id`, writes the lobby pointer to your profile and adds you to the in-memory room. The creator is the host; rejoining the same lobby is idempotent.
3. **Play** — the client streams coordinates to `LobbyRoom`; the Durable Object judges tags and broadcasts everyone's positions in memory at the edge.
4. **Conclude** — a match summary (winner, per-player results) is written back to the database, and career wins update.

Today's Worker implements the phase 1–2 REST over HTTP (join / leave / roster / role). Phase 3's WebSocket gameplay and phase 4's `/lobby/conclude` are design targets not built yet — in-flight status lives in `agent-docs/REPO-KNOWLEDGE.md`.

### Design principles

Why this architecture looks the way it does:

- **Database write minimization** — a 10-minute game with 6 players sending GPS every second would mean ~3,600 writes per match in Postgres. With `LobbyRoom` holding live state in RAM it is exactly 2: the lobby pointer on join, the summary on conclude.
- **Global edge latency** — gameplay actions and frames execute on Cloudflare's edge network, next to the players.
- **Clean teardown** — once players disconnect, Cloudflare idles and evicts the Durable Object from RAM automatically. Idle rooms cost nothing.

## Reference

### HTTP API

Every request carries `Authorization: Bearer <supabase-access-token>`. The Worker validates it against Supabase's JWKS endpoint, then forwards your identity as a user-scoped client so all database access stays behind row-level security.

The endpoint roster is in the terminal above. A join request looks like:

```bash
curl -X POST https://<worker-host>/lobby/join \
  -H "Authorization: Bearer <supabase-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"lobbyID": "my-lobby"}'
```

- `POST /lobby/role` takes `{"lobbyID": "...", "role": "hunter" | "hider"}` and is host-controlled.
- `GET /lobby/:id` returns the roster: players, host and running state.
- Responses speak one dialect: `{"success": boolean, "message": string}`.

### Player data

The database intentionally holds only slow-changing state. One table exists (`public.players`):

| Column | Holds |
| --- | --- |
| `id` | the `auth.users` id (primary key) |
| `current_lobby_id` | the lobby pointer; `null` = not in any lobby |
| `total_wins` | career wins, default `0` |
| `created_at` | signup time |

Known/planned state, kept honest:

- **`player_name`** — display-name mirror from auth metadata is designed, SQL written, **not yet applied**. The Worker would read names for lobby rosters; the client never queries Supabase directly.
- **Signup row creation** — a trigger on `auth.users` INSERT is decided (no extra Worker round-trip). Also **not yet applied**; SQL lives in `agent-docs/SUPABASE.md`.
- **`matches` history** — a permanent match-results table is design intent in `agent-docs/ARCHITECTURE.md`, not built yet.
- This section describes the live schema; `agent-docs/SUPABASE.md` owns the migration SQL, apply status and RLS design, and `agent-docs/REPO-KNOWLEDGE.md` tracks in-flight backend work.

## Repository

### Project map

| Directory | What it is |
| --- | --- |
| `tagg-apis/` | Cloudflare Worker backend — Hono routes, `LobbyRoom` Durable Object, Supabase glue. The active development frontier. |
| `client/` | Expo React Native client (SDK ~58) — where the game surfaces. |
| `website/` | The site you're reading — monochrome landing site + these docs, deployed to GitHub Pages. |
| `agent-docs/` | Internal working notes for agent sessions: repo status & in-flight work (`REPO-KNOWLEDGE.md`), design intent & planned-but-unbuilt systems (`ARCHITECTURE.md`), SQL migrations & RLS (`SUPABASE.md`). |

### Running locally

```bash
# backend — Hono routes + LobbyRoom Durable Object
cd tagg-apis && npm run dev      # wrangler dev

# client — Expo client
cd client && npm start           # expo start

# website — the site you're reading
cd website && npm run dev        # vite
```

The Worker expects `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` bindings. Locally, Wrangler reads them from `tagg-apis/.dev.vars` (create it yourself; it stays local and gitignored):

```bash
# tagg-apis/.dev.vars
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable (anon) key>
```

SQL migrations, apply status and RLS design notes live in `agent-docs/SUPABASE.md`.

### Testing the API locally

`npm run dev` serves the Worker on the URL Wrangler prints (typically `http://localhost:8080`). Play it with `curl` or an HTTP client like Bruno/Postman.

Every endpoint requires a Supabase Auth JWT from a signed-in player (email/password auth must be enabled in your project):

```bash
curl "https://<your-project-ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <publishable (anon) key>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "your-password"}'
# → grab "access_token" from the JSON response
```

Then call the endpoints, passing the token as `Authorization: Bearer <access_token>`:

```bash
TOKEN=<access_token>
BASE=http://localhost:8080

# Join a lobby (also sets current_lobby_id in Supabase; rejoining is idempotent)
curl -X POST $BASE/lobby/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lobbyID": "test-lobby"}'

# Roster, host and running flag
curl $BASE/lobby/test-lobby -H "Authorization: Bearer $TOKEN"

# Set your role ("hunter" | "hider")
curl -X POST $BASE/lobby/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lobbyID": "test-lobby", "role": "hunter"}'

# Leave the lobby (the body carries the playerID)
curl -X POST $BASE/lobby/leave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lobbyID": "test-lobby", "playerID": "<your player id>"}'
```

Responses follow `{ "success": boolean, "message": string }` with `400` for rejected actions and `401` for missing/invalid tokens. Without the `.dev.vars` bindings above, every endpoint fails locally (tokens are validated first). Local Durable Object lobby state persists in `tagg-apis/.wrangler/state/` across dev restarts.

## Website

### Stack

- **Vite 8 + React 19 + TypeScript**, with exactly two runtime libraries beyond the framework: `ascii-reveal` (the character-grid decode animations) and `marked` (this page).
- **Monochrome by construction** — every color/font is a token in `src/theme/theme.ts`, published as CSS variables on `:root`; no component knows a hex value. Dark/light modes follow the OS unless you toggle (stored per device).
- **Self-hosted fonts** (`public/fonts`) — Inter, JetBrains Mono and Press Start 2P subsets with OFL licenses. No third-party font requests exist.
- All animation respects `prefers-reduced-motion`; screen readers always get the real text.

### Docs engine

The page you're reading is markdown compiled to HTML at load by our renderer (`src/lib/markdown.ts` over `marked`):

- **H2 = category** — rendered as the numbered section separators you see above (`03:// CONCEPTS` …), auto-numbered to continue the page's JSX sections.
- **H3 = section** — slugged ids feed the sidebar; fenced code blocks become terminal windows; external links open in a new tab.
- The two-level sidebar derives itself from the markdown (`docHeadings()`), and an `IntersectionObserver` scroll-spy bolds the section at the top of the viewport.

Adding a docs section means editing `src/content/docs.md` — no component or CSS changes.

### Deploy

- Pushes to `main` touching website build inputs (code, fonts, the docs markdown) trigger `.github/workflows/deploy-website.yml`: build → publish the `gh-pages` branch → GitHub Pages serves it at [tanishworks.github.io/tagg](https://tanishworks.github.io/tagg/).
- Hash routing (`#/docs`) keeps URLs working without Pages rewrite rules; the Vite `base` path `/tagg/` matches.
- Manual escape hatch when CI is unavailable: `npm run deploy` (from `website/`).

### Design system

The look is monochrome by construction — pure black/white plus neutral grays, never hue:

- **Tokens, not hexes** — every color and font lives in `src/theme/theme.ts` and is published as CSS variables on `:root`; two modes (dark default, light) following the OS unless toggled.
- **Three-tier type** — Press Start 2P for display (heroes, kickers, card titles), Inter for body/UI, JetBrains Mono for terminal accents — all self-hosted in `public/fonts`.
- **ascii-reveal** — text and cards decode in through a character grid; `prefers-reduced-motion` swaps it for a short fade.
- **Press feedback** — buttons and capsules compress to `scale(0.97)` while pressed, a transform-only effect that never shifts layout.

## Documenting

You are reading self-documenting docs: this page is markdown, compiled to site-styled HTML at load. Here's how to extend it.

### Authoring a doc

1. Edit `src/content/docs.md` — plain markdown only; no components or CSS changes needed.
2. **`## Heading` starts a broad category.** It renders the numbered separator (`06: // CONCEPTS`, `07: // DOCUMENTING`) — the numbering auto-continues the page's JSX sections, via `KICKER_BASE` in `src/lib/markdown.ts`.
3. **`### Heading` adds a section** under the current category. Ids are derived slugs (`### HTTP API` → `#http-api`); the sidebar and scroll-spy pick them up automatically.
4. Fenced code blocks render as the site's terminal windows (the language tag becomes the window label). Tables, lists, inline code and external links are styled by the docs CSS; external links open in a new tab.
5. Check locally with `npm run dev`, then ship through the usual branch → commit flow. Docs markdown is a website build input, so it deploys like any code change.

### Rules of the road

- **This page is the source of documentation.** Stable knowledge — concepts, game rules, HTTP API, database overview, running/testing locally — lives here in `website/src/content/docs.md`, written to stand alone for any reader.
- **`agent-docs/` is the internal layer.** Working notes only: current status, in-flight work, known gotchas, SQL to apply, planned-but-unbuilt design. It links to this page, not the other way around; code-knowledge internals (stubs, todos, apply status) stay out of the public docs.
- **Current vs. planned, kept honest.** State what exists; anything designed-but-not-built is labelled `planned`/`not yet applied`. When the backend, game rules or schema change, update this page (and the endpoint terminal above) in the same change.
- The root `README.md` is the map: repo layout, per-sub-project commands, and pointers to this page and to `agent-docs/`.
- **Structure stays navigable.** Prefer more `###` sections over one long `##` blob — the sidebar is the page's table of contents.
- **Two constants to keep in sync** when touching structure: `KICKER_BASE` (number of JSX sections above the docs; currently 2) and the `DOC_SECTIONS` list in `src/pages/Docs.tsx` (holds the JSX sections' ids and levels).
