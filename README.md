# Tagg

A real-time multiplayer **location-based tag game** (hide-and-seek style). Players join a lobby, draw a `hunter` or `hider` role, and game state — GPS positions, tags, roles — runs in real time. In development by [@tanishworks](https://github.com/tanishworks).

**Project website: https://tanishworks.github.io/tagg/**

> **Note:** This project is still in development. Anything here can change without warning, and some features described in the docs are not implemented yet (see [Status](#status)).

## Repository map

| Path | What it is |
|------|------------|
| [`tagg-apis/`](tagg-apis/) | Cloudflare Worker backend (Hono + Durable Objects + Supabase) — lobby join/leave/roster/role endpoints |
| [`mobile/`](mobile/) | Expo React Native client (SDK ~58, Expo Router) — in development |
| [`website/`](website/) | Vite + React (TS) landing site, deployed via GitHub Pages from the `gh-pages` branch |
| [`agent-docs/`](agent-docs/) | Internal working notes for agent sessions: current status, in-flight work, gotchas, SQL to apply, planned design (`ARCHITECTURE.md`, `REPO-KNOWLEDGE.md`, `SUPABASE.md`). Pointers to the public docs, never copies. See [Documentation](#documentation). |

## Status

- Backend: lobby lifecycle via REST (join/leave/roster/role); Supabase Auth JWT validation in place; WebSocket gameplay, GPS tag logic and the conclude endpoint not yet implemented (see `agent-docs/ARCHITECTURE.md` for the target design).
- Client: Expo starter template, not started.
- Website: live at the URL above; deployed automatically on pushes to `main` touching `website/`.

## Documentation

The documentation hierarchy is deliberate — one canonical source, everything else points at it:

| Layer | Role |
|---|---|
| [`website/src/content/docs.md`](website/src/content/docs.md) | **The documentation.** Concepts, game lifecycle, HTTP API, database, running locally, this site's design, and how to author new docs. It is rendered to the [Docs page](https://tanishworks.github.io/tagg/#/docs) on the project website. Document new knowledge here first. |
| [`README.md`](README.md) *(this file)* | Main repo doc: what Tagg is, repo map, current status, and install/run/deploy commands per sub-project. References the website docs and `agent-docs/`; doesn't duplicate them. |
| [`AGENTS.md`](AGENTS.md) | Agent working rules. References this README. |
| [`agent-docs/`](agent-docs/) | Internal working notes for agent sessions, pointing into the layers above (public docs in `website/src/content/docs.md`, status/SQL/design notes in this repo-only folder). |

When documenting something new: write it in `website/src/content/docs.md`, then add a pointer from the layer agents/starters would hit first.

### Agent notes

Each sub-project carries its own `AGENTS.md` with toolchain-specific instructions (`tagg-apis/`, `mobile/`, `website/`). Root [`AGENTS.md`](AGENTS.md) sets the learning-first workflow and points to this README and [`agent-docs/`](agent-docs/) for the internal notes.

## Commands

Everything is run from inside the sub-project directory (`tagg-apis/`, `mobile/`, or `website/`). There are no automated tests yet — lint and typecheck are the available checks.

### Backend (`tagg-apis/`) — Cloudflare Worker

```bash
npm install         # install dependencies
npm run dev         # run the Worker locally (wrangler dev)
npm run deploy      # deploy to Cloudflare
npm run lint        # eslint
npm run cf-typegen  # regenerate Cloudflare Worker types (after wrangler.jsonc changes)
```

##### Calling the API locally

How to fetch a Supabase token and call the four lobby endpoints against the dev server is documented in the website docs' [Testing the API locally](https://tanishworks.github.io/tagg/#/docs) section (source: [`website/src/content/docs.md`](website/src/content/docs.md)). The local-only env it needs lives in `tagg-apis/.dev.vars`.

### Mobile client (`mobile/`) — Expo React Native

```bash
npm install        # install dependencies
npm run start      # start the Expo dev server
npm run ios        # start on the iOS simulator
npm run android    # start on the Android emulator
npm run lint       # expo lint
npx tsc --noEmit   # typecheck
```

### Website (`website/`) — Vite + React

```bash
npm install       # install dependencies
npm run dev       # local dev server (vite)
npm run build     # typecheck + production build
npm run preview   # preview the production build
npm run deploy    # deploy to GitHub Pages (gh-pages branch)
npm run lint      # oxlint
```

## License

MIT.
