# Tagg — Project & Repository Knowledge

> Internal working notes for agent sessions: repository structure, current status, in-flight work, known gotchas. Companion files: [ARCHITECTURE.md](./ARCHITECTURE.md) (design intent, incl. planned-but-unbuilt systems) and [SUPABASE.md](./SUPABASE.md) (SQL migrations, apply status, RLS).

**Docs hierarchy:** stable documentation lives in `website/src/content/docs.md` and is hosted at the [website docs page](https://tanishworks.github.io/tagg/#/docs) — concepts, HTTP API, database overview, running/testing locally. This folder holds the code-knowledge internals that stay out of the public docs: WIP, stubs, applied/unapplied SQL, gotchas. Record status here; update public docs there; **point, don't copy**.

## Project

**Tagg** — a real-time multiplayer location-based tag game (hide-and-seek style, roles: `hunter` / `hider`).

- **Current phase (owner-stated direction):** working solo on the backend (`tagg-apis/`) step by step, integrated with Supabase, then the client app (`mobile/`), before moving to production, releases, and branches.

## Repository layout

- `tagg-apis/` — Cloudflare Worker backend (Hono + Durable Objects + Supabase). **Primary area of active development.**
- `mobile/` — Expo React Native client (SDK ~58). Currently only the untouched Expo starter template.
- `website/` — Vite + React (TS) project landing site, deployed to GitHub Pages (`gh-pages` branch) at https://tanishworks.github.io/tagg/. Monochrome terminal/pixel aesthetic. See its `README.md` + `AGENTS.md`.
- `agent-docs/` — internal working notes: `ARCHITECTURE.md` (design intent & planned systems), this file (`REPO-KNOWLEDGE.md`, repo status & gotchas), and `SUPABASE.md` (SQL migrations, apply status, RLS).
- Root:
  - `package.json` — root scripts: `dev`/`deploy` = wrangler, `lint` = eslint. Deps: hono, wrangler, eslint, typescript.
  - `AGENTS.md` — learning-first mentor instructions + Tagg context.
  - `README.md` — main repo doc: repo map, status, the documentation hierarchy, and per-sub-project install/run/deploy commands.
  - `eslint.config.mjs`, `.prettierrc` (tabWidth 4, spaces).

## Backend: `tagg-apis/`

- `wrangler.jsonc` — Worker name `tagg`, main `src/index.ts`, compatibility_date `2026-10-19`, migration registering `LobbyRoom` DO (tag `v1`), DO binding `MY_DURABLE_OBJECT`, observability enabled, source maps, smart placement commented out, no vars/secrets set yet.
- `src/index.ts` — Hono app; `LobbyRoom` Durable Object; routes:
  - `POST /lobby/join`
  - `POST /lobby/leave`
  - `GET /lobby/:id`
  - `POST /lobby/role`
  - **No `/lobby/conclude` endpoint yet; no WebSocket/GPS/tag logic yet** (despite ARCHITECTURE.md describing it).
- Testing locally: run `npm run dev`, then call the endpoints per the website docs' [Testing the API locally](../website/src/content/docs.md#testing-the-api-locally). Local lobby state persists in `.wrangler/state/` across restarts.
- `src/types.ts` — `Role`, `Coordinates`, `PlayerID`, `LobbyID`, `Player`.
- `src/mock-lobby.ts` — in-memory learning baseline (Maps, `runTest()`, string-returning helpers, personal TODOs/comments).
- `src/supabaseFunctions/`:
  - `supabaseAuthorization.ts` — Bearer token format check.
  - `getPlayerIDFromToken.ts` — JWT validation via `supabase.auth.getClaims`, returns user sub.
  - `getCurrentLobbyID.ts` — reads `current_lobby_id` from Supabase.
  - `setCurrentLobbyID.ts` — **UNTRACKED STUB**; currently an empty `Promise<>` placeholder with TODOs — **needs implementation**.

## Supabase (current actual structure)

- **Auth**: Supabase Auth issues JWT access tokens to the client. The Worker validates them via `supabase.auth.getClaims()` (verified against the project JWKS endpoint `/.well-known/jwks.json`, cached) and then opens **user-scoped** Supabase clients by forwarding the caller's `Authorization` header — so database requests run as the `authenticated` Postgres role and are subject to RLS.
- **Table `players`** (public schema):
  - `id` — linked to Supabase Auth's `auth.users.id`, not nullable (primary key)
  - `current_lobby_id` — the lobby the player is currently in; default `null` (`null` = not in any lobby)
  - `total_wins` — career wins; default `0`
  - `created_at` — timestamp
  - `player_name` — planned: display name mirrored from auth metadata (see [`SUPABASE.md`](./SUPABASE.md))
- **Row creation (decided)**: a DB trigger on `auth.users` INSERT creates the `players` row automatically at signup — Supabase-side, no extra Worker round-trip. SQL lives in [`SUPABASE.md`](./SUPABASE.md), status **NOT YET APPLIED** to the live DB.
- **`player_name` (decided)**: planned `players.player_name` column snapshotted from auth `raw_user_meta_data` (`display_name` key — it is *metadata*, not a column) at signup, kept in sync by an update trigger on `auth.users`. The **Worker** reads names with a user-scoped client for lobby rosters; the client never queries Supabase. SQL + RLS in [`SUPABASE.md`](./SUPABASE.md).
- **Drift vs `ARCHITECTURE.md`**: the design doc's aspirational schema names the table `profiles` (with `name`, `total_games_played`, plus a `matches` table); the real table is `players` with the columns above. `ARCHITECTURE.md` stays design-**intent**; this file documents actual state until we decide to sync them.

## Frontend: `mobile/`

- Expo SDK ~58 (`expo@~58.0.19`, RN `0.88`, expo-router `~58`, reanimated 4.7.1, React 19.3).
- `src/app/` — `_layout.tsx`, `index.tsx` (Welcome-to-Expo home + dev hints), `explore.tsx` (starter docs screen). Two tabs via `app-tabs.tsx` / `app-tabs.web.tsx`.
- `src/components/` — starter kit: animated-icon, app-tabs, external-link, hint-row, themed-text/view, `ui/collapsible`, web-badge.
- `src/constants/theme.ts`, hooks, `global.css`, `assets/`.
- `app.json` — name/slug `tagg`, scheme `tagg`, portrait, expo-router + splash plugins, `experiments: { typedRoutes, reactCompiler }`, web output `server`, EAS projectId set.

## Frontend: `website/`

- **Purpose:** project landing site (features, gameplay, docs). Static, no connection to the live API yet.
- **Stack:** Vite 8 + React 19 + TypeScript, `ascii-reveal` ^0.3 (hero/cards decode animation), self-hosted fonts (`public/fonts` — Inter, JetBrains Mono, Press Start 2P; OFL via @fontsource), oxlint. Deploys via `gh-pages` npm script and `.github/workflows/deploy-website.yml` (push to `main` with website build-input changes → builds to `gh-pages` branch).
- **Pages:** Home (`#/`), Gameplay (`#/gameplay`), Docs (`#/docs`) — hash routing (`src/lib/useHashRoute.ts`), chosen because Pages can't rewrite paths. Base path `/tagg/` in `vite.config.ts` must match the Pages URL.
- **Theme system:** every color/font token in `src/theme/theme.ts` (`ThemePalette` dark/light + `FONT_TOKENS`), published to `:root` CSS variables by `ThemeProvider`; components consume variables or `useTheme()`. Rules: never hardcode colors/fonts; monochrome only. Follows OS `prefers-color-scheme` unless the visitor toggled (localStorage `tagg-site-theme`).
- **Key components:** `PillNav` (sliding active indicator, DOM-measured), `Icons` (GitHub + theme toggle).
- **Drift/consistency:** docs content in `website/src/pages` mirrors `agent-docs` at time of writing (lobby endpoints, roles) — update site copy when the API/game rules change.

## Architecture notes (design intent vs. current code)

- Intended: Worker (Hono) gateway → Durable Object `LobbyRoom` (in-memory live state) → Supabase (Auth + Postgres).
- Live gameplay state (GPS coords, tags) lives in DO RAM; DB writes minimized (~2 per game: join + conclude).
- **Drift:** ARCHITECTURE.md describes a richer design (players Map w/ name/role/coordinates, `hostID`, `startedAt`, WS flow, conclude writing to `matches`) than what the code currently implements (players: string[], host, roles; REST only so far).
- **Drift:** `getCurrentLobbyID` queries table `players`; ARCHITECTURE.md says `profiles`.

## Known gotchas / in-flight work

- `tagg-apis/src/supabaseFunctions/setCurrentLobbyID.ts` is untracked and is an empty stub — the first concrete task in the backend sequence.
- Env has TODOs about `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` vars & secrets.
- No conclude endpoint, no WS handling yet.

## Git

- Branch `main`; remote `origin/main`.
- ~20 commits; latest: `feat(lobby): make join retries idempotent`.

## Agent instructions to respect (per sub-project AGENTS.md)

- `tagg-apis/AGENTS.md`: Cloudflare Workers — fetch **current** docs before Workers/DO/Supabase work; Local Explorer endpoints; `wrangler dev/deploy/types`; error 1102 CPU/mem limits.
- `mobile/AGENTS.md`: Expo SDK ~58 — fetch versioned docs before writing Expo code; use `npx expo install`; Expo Router; `ios/`+`android/` absent → generated (never hand-edit); Expo Go limited to bundled modules.
- `website/AGENTS.md`: Vite/React site — all colors & fonts are tokens in `src/theme/theme.ts` (never hardcode); 2-space style + oxlint (root Prettier 4-space doesn't apply); hash routes; deploys to `gh-pages` via CI on `main`; the two hex fallbacks in `website/index.html` must stay in sync with `theme.ts`.

## Conventions

- Prettier: `tabWidth: 4`, spaces (no tabs). **Applies to root/`tagg-apis`/`agent-docs`; `website/` uses Vite's own 2-space style + oxlint.**
- ESLint: TS files only, `js.recommended` + `ts.recommended`, `@typescript-eslint/no-unused-vars: warn`. `website/` uses oxlint instead (`.oxlintrc.json`).

## Suggested next steps (from here)

1. Implement `setCurrentLobbyID` + finish backend Supabase integration step by step.
2. Build client app in `mobile/`.
3. Keep `website/` copy in sync with API/game-rule changes (it documents the lobby endpoints and roles).
4. Production, releases, branches.
