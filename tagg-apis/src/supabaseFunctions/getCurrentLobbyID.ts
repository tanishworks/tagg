import { createClient } from "@supabase/supabase-js";
import type { Env } from "../index"

function authStatus(authorization: string | undefined): authorization is string {
    if (!authorization?.startsWith("Bearer ")) {
        return false;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        return false;
    }

    return true;
}

async function getCurrentLobbyID(playerID: PlayerID, env: Env, authorization: string | undefined): Promise<LobbyID | null> {

    if (!authStatus(authorization)) {
        return null;
    }

    const supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: { headers: { Authorization: authorization } },
            auth: { persistSession: false, autoRefreshToken: false },
        }
    );

    const { data, error } = await supabase
        .from("players")
        .select("current_lobby_id")
        .eq("id", playerID)
        .maybeSingle();

    if (error) throw error
    if (error) {
        return null;
    }

    if (!data) throw new Error("Player profile not found")
    if (!data) {
        return null;
    }

    return data.current_lobby_id;
}

export default getCurrentLobbyID;

