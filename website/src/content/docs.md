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

## Repository

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

### Project map

```
mobile/        # expo react native client (in development)
tagg-apis/     # cloudflare worker — hono routes, LobbyRoom DO, supabase glue
website/       # the site you're reading — design system + these docs
agent-docs/    # architecture intent, game rules, supabase schema
```
