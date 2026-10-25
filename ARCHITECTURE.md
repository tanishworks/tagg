# Tagg Architecture & Data Flow

This document outlines the architecture for **Tagg**, a real-time multiplayer location-based tag game. 

The architecture is designed to be **compute- and cost-efficient**:
- **High-frequency real-time gameplay** (GPS coordinates, live tagging) runs entirely in RAM at the edge.
- **Low-frequency persistent operations** (authentication, lobby transitions, match conclusions) interact with the database.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    Client["Mobile / Web Client"]
    
    subgraph Edge["Cloudflare Edge Network"]
        Worker["Cloudflare Worker (Hono Router)"]
        DO["Cloudflare Durable Object (LobbyRoom)"]
    end
    
    subgraph Database["Supabase (PostgreSQL & Auth)"]
        Auth["Supabase Auth (auth.users)"]
        DB["PostgreSQL (profiles, matches)"]
    end
    
    %% Flows
    Client -->|"1. Sign In / Sign Up"| Auth
    Client -->|"2. HTTP Request + JWT (Join / Leave / Start)"| Worker
    Worker -->|"3. Verify Token & Check current_lobby_id"| DB
    Worker -->|"4. Dispatch RPC call"| DO
    Client <-->|"5. WebSocket (Live GPS & Tags)"| DO
    DO -->|"6. On Game Conclude: Write Final Summary"| DB
```

---

## 2. Division of Responsibilities

| Responsibility | Handled By | Storage Medium | Why? |
| :--- | :--- | :--- | :--- |
| **Authentication & Credentials** | Supabase Auth | Encrypted Postgres (`auth.users`) | Secure password hashing, OAuth, JWT issuance. |
| **Player Profiles & Stats** | Supabase DB | Postgres Table (`public.profiles`) | Long-term persistence for username, career wins, and overall stats. |
| **Active Lobby Tracking** | Supabase DB | Column (`profiles.current_lobby_id`) | Global single source of truth preventing players from joining multiple lobbies simultaneously. |
| **Match History & Records** | Supabase DB | Postgres Table (`public.matches`) | Permanent record of past games, winners, scores, and timestamps. |
| **HTTP Routing & Auth Guard** | Cloudflare Worker | Stateless V8 isolate | Fast request routing via Hono and JWT validation before touching rooms. |
| **Active Live Game State** | Cloudflare Durable Objects | In-Memory RAM (`LobbyRoom`) | Zero database queries during gameplay. Strong consistency per room. |
| **Live GPS Coordinates** | Cloudflare Durable Objects | In-Memory RAM | Updates every 1–2s. Storing this in a database would cause massive unnecessary write load and latency. |
| **Real-time Broadcasting** | Cloudflare Durable Objects | Native WebSockets | Low-latency broadcast of player movements and tag events to everyone in the room. |

---

## 3. End-to-End Game Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player Client
    participant Supabase as Supabase (Auth & DB)
    participant Worker as Cloudflare Worker (Gateway)
    participant DO as Durable Object (LobbyRoom)

    %% Authentication
    Note over Player, Supabase: Phase 1: Authentication
    Player->>Supabase: Sign in with Email / Password
    Supabase-->>Player: Return JWT Access Token

    %% Joining a Room
    Note over Player, DO: Phase 2: Joining a Lobby
    Player->>Worker: POST /lobby/join (Bearer JWT, lobbyID)
    Worker->>Supabase: Verify JWT & check if player.current_lobby_id is null
    alt Player already in a lobby
        Worker-->>Player: 400 Bad Request ("Already in lobby")
    else Player is free
        Worker->>Supabase: UPDATE profiles SET current_lobby_id = lobbyID
        Worker->>DO: stub.join(playerID)
        DO-->>Worker: Success (player added to room RAM)
        Worker-->>Player: 200 OK ("Joined lobby")
    end

    %% Active Game
    Note over Player, DO: Phase 3: Active Gameplay (In-Memory RAM)
    Player->>DO: Connect Native WebSocket
    loop Continuous Gameplay (No DB queries!)
        Player->>DO: WS Frame: Send GPS Coordinates [lat, lng]
        DO->>DO: Check distance & tag conditions
        DO-->>Player: WS Broadcast: Updated player positions / tag event
    end

    %% Match Conclusion
    Note over Player, Supabase: Phase 4: Match Conclusion
    Player->>Worker: POST /lobby/conclude (Bearer JWT, lobbyID)
    Worker->>DO: stub.concludeGame()
    DO-->>Worker: Return Match Summary (winner, player stats)
    Worker->>Supabase: INSERT INTO matches (lobby_id, winner, results)
    Worker->>Supabase: UPDATE profiles SET current_lobby_id = null (for all players)
    Worker-->>Player: 200 OK (Match Summary)
```

---

## 4. Data Schemas

### A. Supabase Database Schema (PostgreSQL)

```sql
-- 1. Profiles Table (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  current_lobby_id text default null,
  total_games_played int default 0,
  total_wins int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Matches Table (Game History & Conclusions)
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  lobby_id text not null,
  winner_role text check (winner_role in ('hider', 'hunter')),
  player_results jsonb not null, -- Array of { player_id, name, role, was_tagged }
  concluded_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### B. Durable Object In-Memory State (`LobbyRoom`)

When a lobby is created, its creator automatically joins it. The first player to join is the host, so the creator becomes the host. The host is responsible for assigning player roles before the game starts.

```typescript
export class LobbyRoom extends DurableObject<Env> {
    // Ephemeral state alive only during the match
    players: Map<PlayerID, {
        name: string;
        role: "hider" | "hunter" | null;
        coordinates: [latitude: number, longitude: number] | null;
        isTagged: boolean;
    }> = new Map();

    running: boolean = false;
    hostID: PlayerID | null = null;
    startedAt: number | null = null;
}
```

---

## 5. Why this Architecture is Cost & Compute Efficient

1. **Database Write Minimization:**
   A typical 10-minute game with 6 players sending GPS updates every second would generate **3,600 database writes** if stored in Postgres. With Durable Objects, database writes are **exactly 2**:
   - 1 write on join (`current_lobby_id`).
   - 1 write on conclude (`INSERT INTO matches`).
2. **Global Edge Latency:**
   Game actions and WebSocket frames run directly on Cloudflare's edge network, guaranteeing minimal lag for players in the field.
3. **Clean Teardown:**
   Once a match concludes and players disconnect, Cloudflare idles or evicts the Durable Object from RAM automatically, consuming zero ongoing compute resources.
