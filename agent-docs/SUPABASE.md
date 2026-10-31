# Supabase — Schema, SQL, and RLS Notes (Tagg)

> Reference for everything database-side: the real schema, SQL to apply via the Supabase SQL Editor, and RLS design notes. Items marked **NOT YET APPLIED** must be run in the dashboard before the related Worker behaviour will work. Companion files: [ARCHITECTURE.md](./ARCHITECTURE.md) (design intent), [REPO-KNOWLEDGE.md](./REPO-KNOWLEDGE.md) (repo status).

## How the Worker talks to Supabase

- **Auth**: Supabase Auth issues JWT access tokens. The Worker verifies them with `supabase.auth.getClaims()` (verified against the project JWKS endpoint, cached).
- **All DB access is user-scoped**: the Worker forwards the caller's `Authorization` header into the supabase-js client, so every query runs as the `authenticated` Postgres role with that user's claims — RLS applies to every request.
- **The `auth` schema is NOT exposed through the auto-generated API** (per Supabase docs). Player-facing data therefore lives in `public` tables referencing `auth.users` by **primary key** only (`references auth.users on delete cascade`) — other columns/objects managed by Supabase may change at any time.

## Current table: `public.players`

| Column | Notes |
| --- | --- |
| `id` | linked to `auth.users.id` (primary key), not nullable |
| `current_lobby_id` | the lobby the player is in; default `null` (`null` = not in any lobby) |
| `total_wins` | career wins; default `0` |
| `created_at` | timestamp |
| `player_name` | **planned (NOT YET APPLIED)** — display name, mirrored from auth |

**Important detail**: `display_name` is *not* a column of `auth.users`. It is a key inside the `raw_user_meta_data` JSONB column, set at signup (`options.data.display_name`) and editable by the user via `supabase.auth.updateUser({ data: ... })`. The plan mirrors it into `players.player_name`.

## Decided design

- **Row creation**: DB trigger on `auth.users` INSERT creates the `players` row automatically at signup — done by Supabase, no extra Worker round-trip. (Fires at signup / first identity creation, *not* on every sign-in.)
- **`player_name`**: snapshot at signup + a sync trigger on `auth.users` updates of `raw_user_meta_data`. The **Worker** reads names (user-scoped client) for lobby rosters; the client never queries Supabase directly.
- **Writes to `current_lobby_id`**: user-scoped (RLS-enforced own-row update). `service_role`/secret key is reserved for conclude-time writes (e.g. `matches` insert) later; note a secret-key client still runs under the user's RLS if the request carries a user token — bypass requests must not forward `Authorization`.

## SQL to apply (Supabase SQL Editor)

### 1. `player_name` column — NOT YET APPLIED

```sql
alter table public.players add column player_name text;
```

### 2. Row creation on signup — NOT YET APPLIED

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.players (id, current_lobby_id, total_wins, player_name)
  values (new.id, null, 0, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Docs caveats: a failing trigger **blocks signups** — test it; `security definer` runs as the function owner (bypasses RLS); `set search_path = ''` is required hygiene on these functions.

### 3. Name sync on auth profile updates — NOT YET APPLIED

```sql
create function public.handle_user_updated()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.players
  set player_name = new.raw_user_meta_data ->> 'display_name'
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();
```

`update of raw_user_meta_data` intentionally avoids firing on sign-in bookkeeping (e.g. `last_sign_in_at`).

### 4. Backfill existing users — NOT YET APPLIED

```sql
insert into public.players (id, current_lobby_id, total_wins, player_name)
select u.id, null, 0, u.raw_user_meta_data ->> 'display_name'
from auth.users u
on conflict (id) do nothing;
```

### 5. RLS — verify what's live first, then apply — NOT YET APPLIED

```sql
-- Inspect existing state first (avoid duplicate policies):
select * from pg_policies where tablename = 'players';

alter table public.players enable row level security;

revoke all on table public.players from anon, authenticated;
-- The trigger owns inserts; the Worker mediates all reads; users update only their own row.
grant select, update on table public.players to authenticated;

-- Any authenticated user may read the table (Worker uses the caller's JWT,
-- so this covers roster reads of other players' names).
create policy "authenticated can read players"
on public.players for select
to authenticated
using ( true );

-- A user updates only their own row; the resulting row must still be theirs.
create policy "users update their own players row"
on public.players for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );
```

Notes: `id` is the primary key (indexed), which the update policy filters on. Update policies need a working SELECT path — the broad read policy covers it.

## Drift vs `ARCHITECTURE.md`

The design doc references `public.profiles` (with `name`, `total_games_played`) and a `public.matches` table; reality is `public.players` (columns above). `ARCHITECTURE.md` stays design-**intent**; this file is actual/decided state until we sync them.
