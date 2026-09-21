import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment variables
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const STORAGE_URL_KEY = "battleship_supabase_url";
const STORAGE_KEY_KEY = "battleship_supabase_anon_key";

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  let url =
    (typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_URL_KEY)
      : "") || "";
  let anonKey =
    (typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY_KEY)
      : "") || "";

  if (!url && ENV_SUPABASE_URL && ENV_SUPABASE_URL.trim() !== "") {
    url = ENV_SUPABASE_URL.trim();
  }
  if (
    !anonKey &&
    ENV_SUPABASE_ANON_KEY &&
    ENV_SUPABASE_ANON_KEY.trim() !== ""
  ) {
    anonKey = ENV_SUPABASE_ANON_KEY.trim();
  }

  return { url, anonKey };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== "undefined") {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  const configKey = `${url}:${anonKey}`;
  if (supabaseInstance && currentConfigKey === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigKey = configKey;
    return supabaseInstance;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith("http"));
}

export async function createRoom(
  roomCode: string,
  playerId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload the app.",
    );
  }

  const { error } = await supabase.from("rooms").insert({
    room_code: roomCode,
    status: "waiting",
    player1_id: playerId,
  });

  if (error && error.code !== "42501") throw error;
}

export async function joinRoom(
  roomCode: string,
  playerId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload the app.",
    );
  }

  const { data: room, error: lookupError } = await supabase
    .from("rooms")
    .select("id, player1_id, player2_id, status")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (lookupError && lookupError.code !== "42501") throw lookupError;
  // Realtime still verifies the live host when database persistence is unavailable.
  if (!room) return;
  if (room.player1_id === playerId) {
    throw new Error("This room is already open in your browser.");
  }
  if (room.player2_id && room.player2_id !== playerId) {
    throw new Error("This room already has two players.");
  }
  if (room.status === "finished" || room.status === "abandoned") {
    throw new Error("This room is no longer available.");
  }

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      player2_id: playerId,
      status: "placement",
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id)
    .is("player2_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updatedRoom)
    throw new Error("This room was just joined by another player.");
}
