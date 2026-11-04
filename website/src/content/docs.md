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
- The docs above describe current state as we sync it — `agent-docs/REPO-KNOWLEDGE.md` and `agent-docs/SUPABASE.md` are the sources of truth.

## Repository

### Project map

| Directory | What it is |
| --- | --- |
| `tagg-apis/` | Cloudflare Worker backend — Hono routes, `LobbyRoom` Durable Object, Supabase glue. The active development frontier. |
| `mobile/` | Expo React Native client (SDK ~58) — where the game surfaces. |
| `website/` | The site you're reading — monochrome landing site + these docs, deployed to GitHub Pages. |
| `agent-docs/` | Sources of truth for the project: `ARCHITECTURE.md` (design intent, game rules), `REPO-KNOWLEDGE.md` (repo status), `SUPABASE.md` (schema, SQL, RLS). |

### Running locally

```bash
# backend — Hono routes + LobbyRoom Durable Object
cd tagg-apis && npm run dev      # wrangler dev

# mobile — Expo client
cd mobile && npm start           # expo start

# website — the site you're reading
cd website && npm run dev        # vite
```

The Worker expects `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` bindings. Schema, SQL migrations and RLS notes live in `agent-docs/SUPABASE.md`.

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
