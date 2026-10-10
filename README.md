# Lobby create/join demo

This small example demonstrates the request flow without an account system:

1. The Python script sends `POST /lobbies` to create a lobby. The creator is added as its first player.
2. The Worker chooses a lobby code and routes the request to that lobby's Durable Object.
3. The script sends `POST /lobbies/<code>/join` to join as a second device.
4. The Durable Object stores the players for that lobby in its SQLite storage and returns the player list.

Names are labels, so duplicate names are allowed. Device IDs identify a device in this demo; the server makes one if omitted. This is an HTTP-only learning example: it does not yet include WebSockets, game start/end state, timeout checks, GPS, authentication, or protection against guessed lobby codes.

## Run locally

You need Node.js/npm and Python 3 installed.

```sh
npm install
npm run dev
```

In another terminal:

```sh
python3 create_and_join.py
```

The script prints the generated lobby code, the creator, and the joined player list. To use a deployed Worker instead of the local server:

```sh
LOBBY_API=https://your-worker-name.your-subdomain.workers.dev python3 create_and_join.py
```

## Deploy

Log in once, then deploy:

```sh
npx wrangler login
npx wrangler deploy
```

The `wrangler.jsonc` file binds the `Lobby` Durable Object class and declares its SQLite migration. On the first deployment Wrangler will apply that migration.

## What happens in the network

`urllib.request` in the Python script makes ordinary HTTPS `POST` requests. The Worker receives each request, reads its JSON body, and selects the lobby Durable Object using the lobby code as its name. Each lobby's object has its own SQLite database, so different lobby codes get separate player lists. The Durable Object returns JSON, and the Worker passes that response back to the Python script.
