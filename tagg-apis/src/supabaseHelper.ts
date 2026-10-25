import { createClient } from "@supabase/supabase-js";
import type { Env } from "./index.ts";
// import { create } from "node:domain";

// TODO: Export this helper and use it in the join route.
async function getPlayerIDFromToken(
    authorization: string,
    env: Env,
): Promise<string | null> {
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        return null;
    }

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
