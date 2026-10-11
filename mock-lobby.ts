// Just 3 functions, createLobby, joinLobby, and updateLocation
// I'll figure what when and how the requests are sent over a server later, I just need a program that can access and update the data the right way

// So first I need to map the player info to a key (playerID) for which I'll create a map

type Role = "hider" | "hunter";
type Player = {
  name: string;
  role: Role | null;
  coordinates: [number, number] | null;
}

type Lobby = {
  players: string[];
}

const players = new Map<string, Player>();

players.set("p001", {
  name: "Alex",
  role: "hider",
  coordinates: [11.121, 133.12]
})

players.set("p002", {
  name: "Steve",
  role: "hider",
  coordinates: [11.231, 123.12]
})

players.set("p003", {
  name: "Napoleon",
  role: "hunter",
  coordinates: [88.239, 123.32]
})

// same as map[players] = value in C++
// get them using players.get(key)

// console.log(players.get("p003"))

// these work like C++ hasmaps, so you have the key as the first argument (p001 - p003)
// like the map key with the hashaps and then you have the rest of the data mapped.
// You can get the info about a certain player with that key using
// now you need a new map for lobbies to get all the players inside that lobby

const lobbies = new Map<number, Lobby>();

lobbies.set(1234, {
  players: ["p002", "p003"]
})

lobbies.set(5678, {
  players: ["p001"]
})

// now you can get all the players in a lobby, and iterate for each player to get their info


// now that we have the info that we need, lets isolate the lobby creation into a function

function createPlayer(playerID: string, playerName: string) {
  if (players.has(playerID)) {
    return ("player already exists")
    // yeah i again dont know the right error code i should also stop talking about me not knowing that all i know is 404, i know 403 but dont know where its used :p
  }
  players.set(playerID, {
    name: playerName,
    role: null,
    coordinates: null
  })
}

// okay this function name below and the one above... sugests something to do with writing clean code i might need to think about that
function setPlayerRole(playerID: string, playerRole: Role) {
  // NOTE: need to type verify playerRole, coordinates etc btw
  const player = players.get(playerID);
  if (!player) {
    console.log("Player does not exist");
    return ("Player does not exist");
  }
  player.role = playerRole;
}

function createLobby(lobbyID: number) {
  if (lobbies.has(lobbyID)) {
    return ("lobby already exists");
  }
  lobbies.set(lobbyID, {
    players: []
  })
}

function joinLobby (playerID: string, lobbyID: number) {
  console.log("joinLobby triggered");

  const lobby = lobbies.get(lobbyID);

  if (!lobby) {
    console.log("lobby not found");
    return (404);
  }

  if (lobby.players.includes(playerID)) {
    console.log("Player already exists");
    return ("Player already exists");
    // yes, i again dont know the right error code, do I care... ABSOLUTELY NO... but numbers look cooler can't lie
  }

  if (!players.has(playerID)) {
    console.log("playerID not found");
    return ("playerID not found");
  }

  lobby.players.push(playerID);
}

function updateLocation(playerID: string, latitude: number, longitude: number) {
  // there should be a better way to type check this i mean this is called typescript but anyways here is the type checking for coords

  const player = players.get(playerID);

  if (!player) {
    console.log("Player not found *I hate this not found checking thingy omg*");
    return (404);
  }
  
  if (latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180 || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.log("recieved invalid coordinates");
    return ("invalid coordinates");
    // (yeah idk the right error number okay this is where you zip it the adult is coding (tony stark reference :D))
  }
  // lowk i gotta be invested in encryption and shit because like if someone gets their hands on this... wait where even would they like they gotta be near them and theyre playing hide and seek how r u even going to target them so we good just handle it with security on servers... eh cloudflare can do that
  
  player.coordinates = [latitude, longitude]
  //yippeee we got the new coordinates their friends will now rush on for the love of the game
}

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

console.log("New lobby:", lobbies.get(9876));
console.log("New players:", players.get("p004"), players.get("p005"));

