import { createClient } from "@supabase/supabase-js";
import supabaseAuthorization from "./supabaseAuthorization";
import type { Env } from "../index";

async function getPlayerIDFromToken(
    authorization: string | undefined,
    env: Env,
): Promise<string | null> {
    if (!supabaseAuthorization(authorization)) {
        return null;
    }

    const token = authorization.slice("Bearer ".length).trim();

    const supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase.auth.getClaims(token);

    if (!data) {
        return null;
    }

    if (error || typeof data.claims.sub !== "string") {
        return null;
    }

    return data.claims.sub;
}

export default getPlayerIDFromToken;
