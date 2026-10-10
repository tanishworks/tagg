export interface Env {
  LOBBIES: DurableObjectNamespace<Lobby>;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function makeLobbyCode(): string {
  // Avoid easily confused characters such as 0/O and 1/I.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "POST") {
      return json({ error: "Use POST for this demo." }, 405);
    }

    if (url.pathname === "/lobbies") {
      let body: { name?: string; deviceId?: string };
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be JSON." }, 400);
      }

      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return json({ error: "A player name is required." }, 400);

      // In this demo, the creator is also the first player in the lobby.
      const code = makeLobbyCode();
      const id = env.LOBBIES.idFromName(code);
      const lobby = env.LOBBIES.get(id);
      const response = await lobby.fetch("https://lobby/create", {
        method: "POST",
        body: JSON.stringify({ code, name, deviceId: body.deviceId }),
      });
      return response;
    }

    const joinMatch = url.pathname.match(/^\/lobbies\/([A-Z2-9]+)\/join$/i);
    if (joinMatch) {
      let body: { name?: string; deviceId?: string };
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be JSON." }, 400);
      }

      const code = joinMatch[1].toUpperCase();
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return json({ error: "A player name is required." }, 400);

      const id = env.LOBBIES.idFromName(code);
      const lobby = env.LOBBIES.get(id);
      const response = await lobby.fetch("https://lobby/join", {
        method: "POST",
        body: JSON.stringify({ code, name, deviceId: body.deviceId }),
      });
      return response;
    }

    return json({ error: "Not found. Try POST /lobbies or POST /lobbies/:code/join." }, 404);
  },
};

interface Player {
  id: string;
  deviceId: string;
  name: string;
  joinedAt: string;
}

export class Lobby extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      name TEXT NOT NULL,
      joined_at TEXT NOT NULL
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS lobby (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      code TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    const body = await request.json<{ code: string; name: string; deviceId?: string }>();

    if (path === "/create") {
      const existing = this.sql.exec<{ code: string }>("SELECT code FROM lobby LIMIT 1").toArray()[0];
      if (existing) return json({ error: "Lobby code already exists; try again." }, 409);

      const player = this.addPlayer(body.name, body.deviceId);
      this.sql.exec("INSERT INTO lobby (singleton, code, created_at) VALUES (1, ?, ?)", body.code, new Date().toISOString());
      return json({ lobbyCode: body.code, player, players: this.getPlayers() }, 201);
    }

    if (path === "/join") {
      const lobby = this.sql.exec<{ code: string }>("SELECT code FROM lobby LIMIT 1").toArray()[0];
      if (!lobby || lobby.code !== body.code) return json({ error: "Lobby not found." }, 404);

      const player = this.addPlayer(body.name, body.deviceId);
      return json({ lobbyCode: body.code, player, players: this.getPlayers() }, 200);
    }

    return json({ error: "Not found." }, 404);
  }

  private addPlayer(name: string, deviceId?: string): Player {
    const player: Player = {
      id: crypto.randomUUID(),
      deviceId: deviceId || crypto.randomUUID(),
      name,
      joinedAt: new Date().toISOString(),
    };
    this.sql.exec(
      "INSERT INTO players (id, device_id, name, joined_at) VALUES (?, ?, ?, ?)",
      player.id,
      player.deviceId,
      player.name,
      player.joinedAt,
    );
    return player;
  }

  private getPlayers(): Player[] {
    return this.sql.exec<Player>(
      "SELECT id, device_id AS deviceId, name, joined_at AS joinedAt FROM players ORDER BY joined_at",
    ).toArray();
  }
}
