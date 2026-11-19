import { createClient } from "@supabase/supabase-js";

let client;

export function getSupabaseClient() {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key?.startsWith("sb_publishable_")) {
      throw new Error("Supabase sign-in requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    }
    client = createClient(url, key, {
      auth: {
        flowType: "pkce", persistSession: true, autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
