// I'll figure what when and how the requests are sent over a server later, I just need a program that can access and update the data the right way

type Lobby = {
    players: string[];
    running: boolean;
};

type Role = "hider" | "hunter";
type Coordinates = [latitude: number, longitude: number];

type Player = {
    name: string;
    role: Role | null;
    coordinates: Coordinates | null;
};

const players = new Map<string, Player>();
const lobbies = new Map<number, Lobby>();

function runTest() {
    createLobby(1233);
    joinLobby("p003", 1233);
    updateLocation("p003", 12.333, -98);

    console.log(lobbies);
    console.log(lobbies.get(1233));
    console.log(players.get("p003"));

    // Try making new players and assigning their roles before they join a lobby.
    createPlayer("p004", "Mira");
    setPlayerRole("p004", "hider");
    createPlayer("p005", "Sam");
    setPlayerRole("p005", "hunter");

    createLobby(9876);
    joinLobby("p004", 9876);
    joinLobby("p005", 9876);
    updateLocation("p004", 40.7128, -74.006);
    updateState(true, 9876);

    console.log("New lobby:", lobbies.get(9876));
    console.log("New players:", players.get("p004"), players.get("p005"));
}

// Add a player to db
function createPlayer(playerID: string, playerName: string) {
    if (players.has(playerID)) {
        return "player already exists";
        // yeah i again dont know the right error code i should also stop talking about me not knowing that all i know is 404, i know 403 but dont know where its used :p
    }
    players.set(playerID, {
        name: playerName,
        role: null,
        coordinates: null,
    });
}

// Add role to a player
// okay this function name below and the one above... sugests something to do with writing clean code i might need to think about that
function setPlayerRole(playerID: string, playerRole: Role) {
    const player = fetchPlayer(playerID);
    if (!player) {
        console.log("player does not exist");
        return "player does not exist";
    }

    if (player.role === playerRole) {
        console.log("player already has that role");
        return "player already has that role";
    }

    player.role = playerRole;
}

// --- LOBBY ---

// create a lobby
function createLobby(lobbyID: number) {
    if (lobbies.has(lobbyID)) {
        return "lobby already exists";
    }
    lobbies.set(lobbyID, {
        players: [],
        running: false,
    });
}

// Join a lobby
function joinLobby(playerID: string, lobbyID: number) {
    console.log("joinLobby triggered");

    const lobby = fetchLobby(lobbyID);
    // const player = fetchPlayer(playerID);
    // dont need this because we're not doing anything to the player's data

    if (!lobby) {
        console.log("lobby not found");
        return "lobby not found";
    }

    if (lobby.running) {
        console.log("lobby already running");
        return "lobby already running";
    }

    if (!players.has(playerID)) {
        console.log("player not found");
        return "player not found";
    }

    if (lobby.players.includes(playerID)) {
        console.log("player already exists in lobby");
        return "player already exists in lobby";
        // yes, i again dont know the right error code, do I care... ABSOLUTELY NO... but numbers look cooler can't lie
    }

    lobby.players.push(playerID);
}

// -- Update data ---
//
// Update location
function updateLocation(playerID: string, latitude: number, longitude: number) {
    // there should be a better way to type check this i mean this is called typescript but anyways here is the type checking for coords

    const player = fetchPlayer(playerID);

    if (!player) {
        console.log("player not found");
        return "player not found";
    }

    // lowk i gotta be invested in encryption and shit because like if someone gets their hands on this... wait where even would they like they gotta be near them and theyre playing hide and seek how r u even going to target them so we good just handle it with security on servers... eh cloudflare can do that
    const coordinates: Coordinates = [latitude, longitude];
    if (!isValidCoordinate(coordinates)) {
        console.log("invalid coordinates");
        return "invalid coordinates";
    }

    player.coordinates = [latitude, longitude];
    //yippeee we got the new coordinates their friends will now rush on for the love of the game
}

// --- Lobby management ---

// Lobby state

function updateState(setRunning: boolean, lobbyID: number) {
    console.log("updateState triggered");
    const lobby = fetchLobby(lobbyID);

    if (!lobby) {
        console.log("lobby not found");
        return "lobby not found";
    }

    if (lobby.running === setRunning) {
        return setRunning
            ? "lobby already running"
            : "lobby already stationary";
    }

    const totalPlayers = lobbyPlayers(lobbyID);

    if (totalPlayers === undefined) {
        return "lobby not found";
    }

    if (totalPlayers <= 1) {
        return "lobby doesn't have enough players";
    }

    lobby.running = setRunning;
    return "lobby state updated";
}

// make fetch state functions and use them in update functions

function fetchLobby(lobbyID: number): Lobby | undefined {
    return lobbies.get(lobbyID);
}

function fetchPlayer(playerID: string): Player | undefined {
    return players.get(playerID);
}

function lobbyPlayers(lobbyID: number): number | undefined {
    const lobby = fetchLobby(lobbyID);

    if (!lobby) {
        console.log("lobby doesn't exist");
        return undefined;
    }

    return lobby.players.length;
}

function isValidCoordinate(coordinates: Coordinates): boolean {
    const latitude = coordinates[0];
    const longitude = coordinates[1];

    if (
        latitude <= 90 &&
        latitude >= -90 &&
        longitude <= 180 &&
        longitude >= -180 &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    ) {
        return true;
        // (yeah idk the right error number okay this is where you zip it the adult is coding (tony stark reference :D))
    }
    return false;
}

runTest();
