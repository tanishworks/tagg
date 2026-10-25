import { DurableObject } from "cloudflare:workers";
import type { LobbyID, PlayerID } from "./types.ts";
import { Hono, type Context } from "hono";

export interface Env {
    MY_DURABLE_OBJECT: DurableObjectNamespace<LobbyRoom>;
    // TODO: Configure these values for local development and deployed Workers.
    SUPABASE_URL: string;
    SUPABASE_PUBLISHABLE_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

function handleResult(
    c: Context,
    result: { success: boolean; error?: string; message?: string },
) {
    if (!result.success) {
        return c.json({ success: false, message: result.error }, 400);
    }
    return c.json(result, 200);
}

export class LobbyRoom extends DurableObject<Env> {
    players: string[] = [];
    running: boolean = false;
    host: string = "";
    roles: Record<PlayerID, Role> = {};

    async join(playerID: PlayerID) {
        if (this.players.includes(playerID)) {
            return {
                success: false,
                error: `Player ${playerID} is already in this room`,
            };
        }

        // TODO: Read current_lobby_id from Supabase and reject players already in a lobby.

        if (this.running) {
            return {
                success: false,
                error: `Room is already running`,
            };
        }

        this.players.push(playerID);
        console.log("Current players in the room", this.players);
        // TODO: Write lobbyID to this player's current_lobby_id in Supabase.

        this.host = this.players[0];

        return {
            success: true,
            message: `Player ${playerID} joined the room. Total: ${this.players.length}`,
        };
    }

    async leave(playerID: PlayerID) {
        if (!this.players.includes(playerID)) {
            return {
                success: false,
                error: `Player ${playerID} is not in this room`,
            };
        }

        this.players = this.players.filter((id) => id !== playerID);
        console.log(
            "Player",
            playerID,
            "has left the room. Total:",
            this.players.length,
        );
        // TODO: Clear this player's current_lobby_id in Supabase after leaving.

        this.host = this.players[0];

        return {
            success: true,
            message: `Player ${playerID} left the room. Total: ${this.players.length}`,
        };
    }

    async getStatus() {
        return {
            players: this.players,
            host: this.host,
            running: this.running,
            totalPlayers: this.players.length,
            success: true,
            message: `Recieved status for room.`,
        };
    }

    // Roles
    async setRole(playerID: PlayerID, role: Role) {
        if (!this.players.includes(playerID)) {
            return {
                success: false,
                error: `Player ${playerID} is not in the room.`,
            };
        }

        if (this.host !== this.players[0]) {
            return {
                success: false,
                error: `Player ${playerID} does not have host access`,
            };
        }

        if (this.running) {
            return {
                success: false,
                error: `Lobby is already running`,
            };
        }

        this.roles[playerID] = role;
        return {
            success: true,
            message: `Player ${playerID} is now a ${role}`,
        };
    }
}

app.post("/lobby/join", async (c) => {
    // TODO: Get playerID from the verified bearer token instead of the request body.
    const body = await c.req.json<{ lobbyID: LobbyID; playerID: PlayerID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.join(body.playerID);

    return handleResult(c, result)
});

app.post("/lobby/leave", async (c) => {
    const body = await c.req.json<{ lobbyID: LobbyID; playerID: PlayerID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.leave(body.playerID);

    return handleResult(c, result)
});

app.get("/lobby/:id", async (c) => {
    const lobbyID = c.req.param("id");
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(lobbyID);
    const status = await lobby.getStatus();

    // if (!result.success) {
    //     return c.json({
    //         success:false,
    //         message: result.error,
    //     })
    // }

    return c.json(status, 200);
});

app.post("/lobby/role", async (c) => {
    const body = await c.req.json<{
        lobbyID: LobbyID;
        playerID: PlayerID;
        role: Role;
    }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.setRole(body.playerID, body.role);

    return handleResult(c, result)
});

export default app;
