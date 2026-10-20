import { DurableObject } from "cloudflare:workers";
import type { LobbyID, PlayerID } from "./types.ts";
import { Hono } from "hono";

export interface Env {
    MY_DURABLE_OBJECT: DurableObjectNamespace<LobbyRoom>;
}

const app = new Hono<{ Bindings: Env }>();

export class LobbyRoom extends DurableObject<Env> {
    players: string[] = [];
    running: boolean = false;

    async join(playerID: PlayerID) {
        if (this.players.includes(playerID)) {
            return {
                success: false,
                error: `Player ${playerID} is already in this room`,
            };
        }

        // implement checking for player's current lobby

        if (this.running) {
            return {
                success: false,
                error: `Room is already running`,
            };
        }

        this.players.push(playerID);
        console.log("Current players in the room", this.players);
        // set player's currentLobbyID

        return {
            success: true,
            message: `Player ${playerID} joined the room. Total: ${this.players.length}`,
        };
    }
}

app.post("/lobby/join", async (c) => {
    const body = await c.req.json<{ lobbyID: LobbyID; playerID: PlayerID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.join(body.playerID);

    if (!result.success) {
        return c.json(
            {
                success: false,
                message: result.error,
            },
            400,
        );
    }

    return c.json(
        {
            success: result.success,
            message: result.message,
        },
        200,
    );
});

app.get("/lobby/:id", async (c) => {
    const body = await c.req.json<{ lobbyID: LobbyID; playerID: PlayerID }>();
    const lobby = c.env.MY_DURABLE_OBJECT.getByName(body.lobbyID);
    const result = await lobby.join(body.playerID);
});

export default app;

// /**
//  * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
//  * `Env` object can be regenerated with `npm run cf-typegen`.
//  *
//  * Learn more at https://developers.cloudflare.com/durable-objects
//  */
//
// /** A Durable Object's behavior is defined in an exported Javascript class */
// export class LobbyRoom extends DurableObject<Env> {
//     players: string[] = [];
//     running: boolean = false;
//
//     /**
//      * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
//      * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
//      *
//      * @param ctx - The interface for interacting with Durable Object state
//      * @param env - The interface to reference bindings declared in wrangler.jsonc
//      */
//     constructor(ctx: DurableObjectState, env: Env) {
//         super(ctx, env);
//     }
//
//     /**
//      * The Durable Object exposes an RPC method sayHello which will be invoked when a Durable
//      *  Object instance receives a request from a Worker via the same method invocation on the stub
//      *
//      * @param name - The name provided to a Durable Object instance from a Worker
//      * @returns The greeting to be sent back to the Worker
//      */
//     async sayHello(name: string): Promise<string> {
//         return `Hello, ${name}!`;
//     }
//
//     async join(playerID: PlayerID) {
//         console.log("join triggered");
//         return `join triggered for ${playerID}`;
//     }
// }
//
// export default {
//     /**
//      * This is the standard fetch handler for a Cloudflare Worker
//      *
//      * @param request - The request submitted to the Worker from the client
//      * @param env - The interface to reference bindings declared in wrangler.jsonc
//      * @param ctx - The execution context of the Worker
//      * @returns The response to be sent back to the client
//      */
//     async fetch(request, env, ctx): Promise<Response> {
//         // Create a stub to open a communication channel with the Durable Object
//         // instance named "foo".
//         //
//         // Requests from all Workers to the Durable Object instance named "foo"
//         // will go to a single remote Durable Object instance.
//         const stub = env.MY_DURABLE_OBJECT.getByName("foo");
//
//         // Call the `sayHello()` RPC method on the stub to invoke the method on
//         // the remote Durable Object instance.
//         const greeting = await stub.sayHello("world");
//         const joinLobby = await stub.join("p001");
//
//         return new Response(greeting);
//     },
// } satisfies ExportedHandler<Env>;
