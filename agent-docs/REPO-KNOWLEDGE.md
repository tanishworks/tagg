# Tagg — Project & Repository Knowledge

> Context for agent sessions and future contributors. Keep it updated as the project evolves. Companion to [ARCHITECTURE.md](./ARCHITECTURE.md) (the design doc) and the `AGENTS.md` files.

## Project

**Tagg** — a real-time multiplayer location-based tag game (hide-and-seek style, roles: `hunter` / `hider`).

- **Current phase (owner-stated direction):** working solo on the backend (`tagg-apis/`) step by step, integrated with Supabase, then the client app (`mobile/`), before moving to production, releases, and branches.

## Repository layout

- `tagg-apis/` — Cloudflare Worker backend (Hono + Durable Objects + Supabase). **Primary area of active development.**
- `mobile/` — Expo React Native client (SDK ~58). Currently only the untouched Expo starter template.
- `agent-docs/` — agent-facing docs: `ARCHITECTURE.md` (intended system design & game rules) and this file (`REPO-KNOWLEDGE.md`).
- Root:
  - `package.json` — root scripts: `dev`/`deploy` = wrangler, `lint` = eslint. Deps: hono, wrangler, eslint, typescript.
  - `AGENTS.md` — learning-first mentor instructions + Tagg context.
  - `README.md` — **empty (0 lines)** — needs content eventually.
  - `eslint.config.mjs`, `.prettierrc` (tabWidth 4, spaces).

## Backend: `tagg-apis/`

- `wrangler.jsonc` — Worker name `tagg`, main `src/index.ts`, compatibility_date `2026-10-19`, migration registering `LobbyRoom` DO (tag `v1`), DO binding `MY_DURABLE_OBJECT`, observability enabled, source maps, smart placement commented out, no vars/secrets set yet.
- `src/index.ts` — Hono app; `LobbyRoom` Durable Object; routes:
  - `POST /lobby/join`
  - `POST /lobby/leave`
  - `GET /lobby/:id`
  - `POST /lobby/role`
  - **No `/lobby/conclude` endpoint yet; no WebSocket/GPS/tag logic yet** (despite ARCHITECTURE.md describing it).
- `src/types.ts` — `Role`, `Coordinates`, `PlayerID`, `LobbyID`, `Player`.
- `src/mock-lobby.ts` — in-memory learning baseline (Maps, `runTest()`, string-returning helpers, personal TODOs/comments).
- `src/supabaseFunctions/`:
  - `supabaseAuthorization.ts` — Bearer token format check.
  - `getPlayerIDFromToken.ts` — JWT validation via `supabase.auth.getClaims`, returns user sub.
  - `getCurrentLobbyID.ts` — reads `current_lobby_id` from Supabase.
  - `setCurrentLobbyID.ts` — **UNTRACKED STUB**; currently an empty `Promise<>` placeholder with TODOs — **needs implementation**.

## Frontend: `mobile/`

- Expo SDK ~58 (`expo@~58.0.19`, RN `0.88`, expo-router `~58`, reanimated 4.7.1, React 19.3).
- `src/app/` — `_layout.tsx`, `index.tsx` (Welcome-to-Expo home + dev hints), `explore.tsx` (starter docs screen). Two tabs via `app-tabs.tsx` / `app-tabs.web.tsx`.
- `src/components/` — starter kit: animated-icon, app-tabs, external-link, hint-row, themed-text/view, `ui/collapsible`, web-badge.
- `src/constants/theme.ts`, hooks, `global.css`, `assets/`.
- `app.json` — name/slug `tagg`, scheme `tagg`, portrait, expo-router + splash plugins, `experiments: { typedRoutes, reactCompiler }`, web output `server`, EAS projectId set.

## Architecture notes (design intent vs. current code)

- Intended: Worker (Hono) gateway → Durable Object `LobbyRoom` (in-memory live state) → Supabase (Auth + Postgres).
- Live gameplay state (GPS coords, tags) lives in DO RAM; DB writes minimized (~2 per game: join + conclude).
- **Drift:** ARCHITECTURE.md describes a richer design (players Map w/ name/role/coordinates, `hostID`, `startedAt`, WS flow, conclude writing to `matches`) than what the code currently implements (players: string[], host, roles; REST only so far).
- **Drift:** `getCurrentLobbyID` queries table `players`; ARCHITECTURE.md says `profiles`.

## Known gotchas / in-flight work

- `tagg-apis/src/supabaseFunctions/setCurrentLobbyID.ts` is untracked and is an empty stub — the first concrete task in the backend sequence.
- Env has TODOs about `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` vars & secrets.
- No conclude endpoint, no WS handling yet.
- Root `README.md` empty.

## Git

- Branch `main`; remote `origin/main`.
- ~20 commits; latest: `feat(lobby): make join retries idempotent`.

## Agent instructions to respect (per sub-project AGENTS.md)

- `tagg-apis/AGENTS.md`: Cloudflare Workers — fetch **current** docs before Workers/DO/Supabase work; Local Explorer endpoints; `wrangler dev/deploy/types`; error 1102 CPU/mem limits.
- `mobile/AGENTS.md`: Expo SDK ~58 — fetch versioned docs before writing Expo code; use `npx expo install`; Expo Router; `ios/`+`android/` absent → generated (never hand-edit); Expo Go limited to bundled modules.

## Conventions

- Prettier: `tabWidth: 4`, spaces (no tabs).
- ESLint: TS files only, `js.recommended` + `ts.recommended`, `@typescript-eslint/no-unused-vars: warn`.

## Suggested next steps (from here)

1. Implement `setCurrentLobbyID` + finish backend Supabase integration step by step.
2. Build client app in `mobile/`.
3. Production, releases, branches.
