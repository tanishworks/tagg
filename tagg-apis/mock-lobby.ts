// I'll figure what when and how the requests are sent over a server later, I just need a program that can access and update the data the right way

type Lobby = {
    players: string[];
    running: boolean;
};

type Role = "hider" | "hunter";
type Coordinates = [latitude: number, longitude: number];
type PlayerID = string;
type LobbyID = number;
type PlayerName = string;

type Player = {
    name: PlayerName;
    role: Role | null;
    coordinates: Coordinates | null;
    currentLobbyID: number | null; // null here means no lobby
};

const players = new Map<string, Player>();
const lobbies = new Map<LobbyID, Lobby>();

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
    startLobby(9876);
    stopLobby(9876);
    leaveLobby(9876, "p005");

    console.log("New lobby:", lobbies.get(9876));
    console.log("New players:", players.get("p004"), players.get("p005"));
}

// Add a player to db
function createPlayer(playerID: PlayerID, playerName: PlayerName) {
    if (players.has(playerID)) {
        return "player already exists";
        // yeah i again dont know the right error code i should also stop talking about me not knowing that all i know is 404, i know 403 but dont know where its used :p
    }
    players.set(playerID, {
        name: playerName,
        role: null,
        coordinates: null,
        currentLobbyID: null,
    });
}

// Add role to a player
// okay this function name below and the one above... sugests something to do with writing clean code i might need to think about that
function setPlayerRole(playerID: PlayerID, playerRole: Role) {
    const player = fetchPlayer(playerID);
    if (!player) {
        console.log("player does not exist");
        return `player ${playerID} does not exist`;
    }

    if (player.role === playerRole) {
        console.log("player already has that role");
        return `player ${playerID} (${player.name}) already has that role`;
    }

    player.role = playerRole;
}

// --- LOBBY ---

// create a lobby
function createLobby(lobbyID: LobbyID) {
    if (lobbies.has(lobbyID)) {
        return "lobby ${lobbyID} already exists";
    }
    lobbies.set(lobbyID, {
        players: [],
        running: false,
    });
}
// done in worker

// Join a lobby
function joinLobby(playerID: PlayerID, lobbyID: LobbyID) {
    console.log("joinLobby triggered");

    const lobby = fetchLobby(lobbyID); // used as 'this' in worker (this.players.includes("string"))
    const player = fetchPlayer(playerID);

    if (!lobby) {
        console.log("lobby", lobbyID, "not found");
        return `lobby ${lobbyID} not found`;
    }

    if (!player) {
        console.log("player", playerID, "not found");
        return `player ${playerID} not found`;
    }

    if (player.currentLobbyID != null) {
        console.log(
            "player",
            playerID,
            "(",
            player.name,
            ")",
            "is already in lobby",
            player.currentLobbyID,
        );
        return `player (${player.name}) is already in lobby ${player.currentLobbyID}`;
    }

    if (lobby.running) {
        console.log("lobby", lobbyID, "already running");
        return `lobby ${lobbyID} already running`;
    } // done in worker

    if (lobby.players.includes(playerID)) {
        console.log(
            "player",
            playerID,
            "(",
            player.name,
            ")",
            "already exists in lobby",
        );
        return `player ${playerID} (${player.name}) already exists in lobby`;
        // yes, I again don't know the right error code, do I care... ABSOLUTELY NOT... but numbers look cooler icl
    } // done in worker

    lobby.players.push(playerID); // done in worker
    player.currentLobbyID = lobbyID;
}

// -- Update data ---
//
// Update location
function updateLocation(playerID: PlayerID, latitude: number, longitude: number) {
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

function startLobby(lobbyID: LobbyID) {
    const lobby = fetchLobby(lobbyID);

    if (!lobby) {
        console.log("lobby not found");
        return `lobby ${lobbyID} not found`;
    }

    if (lobby.running) {
        console.log("lobby already running");
        return `lobby ${lobbyID} already running`;
    }

    const totalPlayers = lobbyPlayers(lobbyID);

    if (totalPlayers === undefined) {
        return `lobby ${lobbyID} not found`;
    }

    if (totalPlayers <= 1) {
        return `lobby ${lobbyID} doesn't have enough players`;
    }

    if (!validLobbyRoles(lobbyID)) {
        return `players in lobby ${lobbyID} don't have unassigned roles`;
    }

    if (!hasMinPlayers(lobbyID)) {
        console.log("lobby", lobbyID, "does not have enough players");
        return `lobby ${lobbyID} does not have enough players`;
    }

    lobby.running = true;
    console.log("started lobby", lobbyID);
    return `started lobby ${lobbyID}`;
}

function stopLobby(lobbyID: LobbyID) {
    const lobby = fetchLobby(lobbyID);

    if (!lobby) {
        console.log("lobby not found");
        return "lobby not found";
    }

    if (!lobby.running) {
        console.log("lobby already stationary");
        return "lobby already stationary";
    }

    lobby.running = false;
    return `stopped lobby ${lobbyID}`;
}

// make fetch state functions and use them in update functions

function fetchLobby(lobbyID: LobbyID): Lobby | undefined {
    return lobbies.get(lobbyID);
}

function fetchPlayer(playerID: PlayerID): Player | undefined {
    return players.get(playerID);
}

function lobbyPlayers(lobbyID: LobbyID): number | undefined {
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

// NOTE: Implement error catching for this because it only returns booleans but can have errors
function validLobbyRoles(lobbyID: LobbyID): boolean | undefined {
    const lobby = fetchLobby(lobbyID);
    if (!lobby) {
        console.log("lobby", lobbyID, "not found");
        return undefined;
    }

    const allReady = lobby.players.every((playerID) => {
        return hasValidRole(playerID);
    });

    return allReady;
}

// NOTE: Implement error catching for this because it only returns booleans but can have errors
function hasValidRole(playerID: PlayerID): boolean | undefined {
    const player = fetchPlayer(playerID);

    if (!player) {
        console.log("player", playerID, "not found");
        return undefined;
    }

    return isRole(player.role);
}

function fetchRole(playerID: PlayerID): string | null | undefined {
    const player = fetchPlayer(playerID);
    if (!player) {
        console.log("player", playerID, "not found");
        return undefined;
    }

    if (player.role === null) {
        return null;
    }

    return player.role;
}

function fetchLobbyRoles(lobbyID: LobbyID): string[] | undefined {
    const lobby = fetchLobby(lobbyID);
    if (!lobby) {
        console.log("lobby", lobbyID, "not found");
        return undefined;
    }

    const roles = lobby.players.map((playerID) => {
        const role = fetchRole(playerID);
        if (role === null || role === undefined) {
            return "invalid";
        } else {
            return role;
        }
    });

    return roles;
}

// NOTE: Implement error catching for this because it only returns booleans but can have errors
function hasMinPlayers(lobbyID: LobbyID): boolean | undefined {
    const lobby = fetchLobby(lobbyID);
    if (!lobby) {
        console.log("lobby", lobbyID, "not found");
        return undefined;
    }

    if (!validLobbyRoles(lobbyID)) {
        return false;
    }

    const roles = fetchLobbyRoles(lobbyID);

    if (roles === undefined) {
        console.log("error returning roles");
        return undefined;
    }

    if (roles.includes("hunter") && roles.includes("hider")) {
        return true;
    }

    return false;
}

function isRole(value: unknown): value is Role {
    return value === "hunter" || value === "hider";
}

function leaveLobby(lobbyID: LobbyID, playerID: PlayerID) {
    const lobby = fetchLobby(lobbyID)
    const player = fetchPlayer(playerID)
    if (!lobby) {
        console.log("lobby", lobbyID, "not found");
        return `lobby ${lobbyID} not found`;
    }

    if (!player) {
        console.log("player", playerID, "not found");
        return `player ${playerID} not found`;
    }

    if (lobbyID != player.currentLobbyID) {
        console.log("Mismatch Error: Player reports lobby", player.currentLobbyID, "but request reports", lobbyID)
        return `Mismatch Error: Player reports lobby ${player.currentLobbyID}, but request reports ${lobbyID}`
    }

    lobby.players = lobby.players.filter((id) => id !== playerID);
    player.currentLobbyID = null
    player.role = null
    return `player ${playerID} (${player.name}) has left lobby ${lobbyID}`
}

runTest();

