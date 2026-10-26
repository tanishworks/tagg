import { DurableObject } from "cloudflare:workers";
import type { LobbyID, PlayerID } from "./types.ts";
import { Hono, type Context } from "hono";
import getPlayerIDFromToken from "./supabaseHelper.js";

export interface Env {
    MY_DURABLE_OBJECT: DurableObjectNamespace<LobbyRoom>;
    // TODO: Configure these values for local development and deployed Workers.
    SUPABASE_URL: string;
    SUPABASE_PUBLISHABLE_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Code questions for myself:
//   What should I store in DO, what needs to persists if the worker restarts
//   How would the other clients know the game has started once the lobby.running updates to true so it can start sharing location and the rest of the proccess?

function handleResult(
    c: Context,
    result: { success: boolean; error?: string; message?: string },
) {
    if (!result.success) {
        return c.json({ success: false, message: result.error }, 400);
    }
    return c.json(result, 200);
}

function isRole(value: unknown): value is Role {
    return value === "hunter" || value === "hider";
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

    async getStatus(playerID: PlayerID) {
        // TODO: Make a check for if the playerID requesting belongs to the lobby
        if (!this.players.includes(playerID)) {
            return {
                success: false,
                error: `Unauthorized: Player ${playerID} is not in the room.`
            }
        }

        return {
            players: this.players,
            // TODO: make it return a string of player names instead (or both?)
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
    const playerID = await getPlayerIDFromToken(
        c.req.header("Authorization"),
        c.env,
    );
    if (!playerID) {
        return c.json({ message: "Unauthorised" }, 401);
    }
    const body = await c.req.json<{ lobbyID: LobbyID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.join(playerID);

    return handleResult(c, result);
});

app.post("/lobby/leave", async (c) => {
    const playerID = await getPlayerIDFromToken(
        c.req.header("Authorization"),
        c.env,
    );
    if (!playerID) {
        return c.json({ message: "Unauthorised" }, 401);
    }

    const body = await c.req.json<{ lobbyID: LobbyID; playerID: PlayerID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.leave(playerID);

    return handleResult(c, result);
});

app.get("/lobby/:id", async (c) => {
    const playerID = await getPlayerIDFromToken(
        c.req.header("Authorization"),
        c.env,
    );
    if (!playerID) {
        return c.json({ message: "Unauthorised" }, 401);
    }
    const lobbyID = c.req.param("id");
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(lobbyID);
    const status = await lobby.getStatus(playerID);

    if (!status.success) {
        return c.json({
            success:false,
            message: status.error,
        }, 401)
    }

    return c.json(status, 200);
});

app.post("/lobby/role", async (c) => {
    const body = await c.req.json<{
        lobbyID: LobbyID;
        role: unknown;
    }>();
    // TODO: Validate json : DONE (checks with isRole function and returns error code)
    if (!isRole(body.role)) {
        return c.json({ message: "Invalid role" }, 400)
    }
    const playerID = await getPlayerIDFromToken(
        c.req.header("Authorization"),
        c.env,
    );
    if (!playerID) {
        return c.json({ message: "Unauthorised" }, 401);
    }
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.setRole(playerID, body.role);

    return handleResult(c, result);
});

export default app;
