type Role = "hider" | "hunter";
type Coordinates = [latitude: number, longitude: number];
type PlayerName = string;
export type PlayerID = string;
export type LobbyID = string;

export type Player = {
    name: PlayerName;
    role: Role | null;
    coordinates: Coordinates | null;
    currentLobbyID: LobbyID | null;
};

