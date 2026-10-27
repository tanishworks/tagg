import { createClient } from "@supabase/supabase-js";
import supabaseAuthorization from "./supabaseAuthorization";
import type { Env } from "../index"

async function getCurrentLobbyID(playerID: PlayerID, env: Env, authorization: string | undefined): Promise<LobbyID | null> {

    if (!supabaseAuthorization(authorization)) {
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

