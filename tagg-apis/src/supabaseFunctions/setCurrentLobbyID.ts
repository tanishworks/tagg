import { createClient } from "@supabase/supabase-js";
import supabaseAuthorization from "./supabaseAuthorization";
import type { Env } from "../index"
import type { LobbyID, PlayerID, WriteResult } from "../types"

async function setCurrentLobbyID(
    playerID: PlayerID,
    lobbyID: LobbyID | null,
    env: Env,
    authorization: string | undefined
): Promise<WriteResult> {
    if (!supabaseAuthorization(authorization)) {
        return { success: false, error: "Unauthorized" }
    }

    const supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: { headers: { authorization: authorization } },
            auth: { persistSession: false, autoRefreshToken: false }
        }
    );

    const { data, error } = await supabase
        .from("players")
        .update({ current_lobby_id: lobbyID })
        .eq("id", playerID)
        .select()

    if (error) {
        return {
            success: false,
            error: error.message
        }
    }

    if (data.length === 0) {
        return {
            success: false,
            error: "Player profile not found"
        }
    }

    return {
        success: true,
        message: `current_lobby_id set to ${lobbyID ?? "null"}`
    }
}

export default setCurrentLobbyID;

