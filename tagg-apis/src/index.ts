import { DurableObject } from "cloudflare:workers";
import type { LobbyID, PlayerID } from "./types.ts";
import { Hono, type Context } from "hono";
import getPlayerIDFromToken from "./supabaseFunctions/getPlayerIDFromToken.js";
import getCurrentLobbyID from "./supabaseFunctions/getCurrentLobbyID.js";

export interface Env {
    MY_DURABLE_OBJECT: DurableObjectNamespace<LobbyRoom>;
    //  TODO: Configure these values for local development and deployed Workers. EDIT: What does this mean??
    SUPABASE_URL: string;
    SUPABASE_PUBLISHABLE_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

/*
    Code questions for myself:
    - What should I store in DO, what needs to persists if the worker restarts
    - How would the other clients know the game has started once the lobby.running updates to true so it can start sharing location and the rest of the proccess?
*/

function handleResult(
    c: Context,
    result: { success: boolean; error?: string; message?: string },
) {
    /*
     *  NOTE: This function only returns status 200 (success) and 400 (failure).
     *  If there is any other kind of error, handle it using the return c.json in itself.
    */
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
                success: true,
                message: `Player ${playerID} was already in this room`,
            };
        }

        if (this.running) {
            return {
                success: false,
                error: `Room is already running`,
            };
        }

        this.players.push(playerID);
        console.log("Current players in the room", this.players);

        //  TODO: Write lobbyID to this player's current_lobby_id in Supabase.

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

        //  TODO: Clear this player's current_lobby_id in Supabase after leaving.

        this.host = this.players[0];

        return {
            success: true,
            message: `Player ${playerID} left the room. Total: ${this.players.length}`,
        };
    }

    async getStatus(playerID: PlayerID) {
        if (!this.players.includes(playerID)) {
            return {
                success: false,
                error: `Unauthorized: Player ${playerID} is not in the room.`
            }
        }

        return {
            players: this.players,
            //  TODO: Make it return a string of player names from supabase instead (or both?)
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
        // handleResult(c, {success: false, message: "Unauthorized"})
        // Read the comment on handleResult at line:27
        return c.json({ message: "Unauthorised" }, 401);
    }

    const currentLobbyID = await getCurrentLobbyID(playerID, c.env, c.req.header("Authorization"))
    const body = await c.req.json<{ lobbyID: LobbyID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);

    // if (!result.success) {
    //     return handleResult(c, result);
    // }

    if (currentLobbyID !== null && currentLobbyID !== body.lobbyID) {
        const currentLobby = c.env.MY_DURABLE_OBJECT.getByName(currentLobbyID);
        const leaveResult = await currentLobby.leave(playerID)
        if (!leaveResult.success) {
            return handleResult(c, leaveResult)
        }
        //  TODO: add boddy.lobbyID to current_lobby_id
    }

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
            success: false,
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
