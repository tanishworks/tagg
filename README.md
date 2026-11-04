# Tagg

A real-time multiplayer **location-based tag game** (hide-and-seek style). Players join a lobby, draw a `hunter` or `hider` role, and game state — GPS positions, tags, roles — runs in real time. In development by [@tanishworks](https://github.com/tanishworks).

🌐 **Project website: https://tanishworks.github.io/tagg/**

## Repository map

| Path | What it is |
|------|------------|
| [`tagg-apis/`](tagg-apis/) | Cloudflare Worker backend (Hono + Durable Objects + Supabase) — lobby join/leave/roster/role endpoints |
| [`mobile/`](mobile/) | Expo React Native client (SDK ~58, Expo Router) — in development |
| [`website/`](website/) | Vite + React (TS) landing site, deployed via GitHub Pages from the `gh-pages` branch |
| [`agent-docs/`](agent-docs/) | Design & repo docs: [`ARCHITECTURE.md`](agent-docs/ARCHITECTURE.md) (intended system design + game rules), [`REPO-KNOWLEDGE.md`](agent-docs/REPO-KNOWLEDGE.md) (repo structure, status, gotchas), [`SUPABASE.md`](agent-docs/SUPABASE.md) (schema & RLS) |

## Status

- Backend: lobby lifecycle via REST (join/leave/roster/role); Supabase Auth JWT validation in place; WebSocket gameplay, GPS tag logic and the conclude endpoint not yet implemented (see `agent-docs/ARCHITECTURE.md` for the target design).
- Client: Expo starter template, not started.
- Website: live at the URL above; deployed automatically on pushes to `main` touching `website/`.

## Docs for agents

Each sub-project carries its own `AGENTS.md` with toolchain-specific instructions (`tagg-apis/`, `mobile/`, `website/`), and [`agent-docs/`](agent-docs/) tracks intended design vs. current state. Root [`AGENTS.md`](AGENTS.md) sets the learning-first workflow.

## License

MIT.
