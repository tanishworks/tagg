import { createClient } from "@supabase/supabase-js";
import supabaseAuthorization from "./supabaseAuthorization";
import type { Env } from "../index"
import type { LobbyID, PlayerID } from "../types"

async function setCurrentLobbyID(playerID: PlayerID, env: Env, authorization: string | undefined): Promise<> { }

//  TODO: uhhh pretty obvious write this function, there is an empty "Promise<>" too
//  migth jsut make the lsp explode

