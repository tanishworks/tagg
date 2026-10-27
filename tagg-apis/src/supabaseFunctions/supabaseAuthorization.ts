function supabaseAuthorization(authorization: string | undefined): authorization is string {
    if (!authorization?.startsWith("Bearer ")) {
        return false;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        return false;
    }

    return true;
}

export default supabaseAuthorization;

/*
 * USAGE:
    async function getCurrentLobbyID(playerID: PlayerID, env: Env, authorization: string | undefined): Promise<LobbyID | null> {
        if (!supabaseAuthorization(authorization)) {
            return null;
        }
    }
*/
