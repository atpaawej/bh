import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Public (anon) client — OAuth URL generation, OTP, code exchange. */
export function getSupabaseAnon(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return anonClient;
}

/** Service-role client — verify access tokens, admin operations. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return adminClient;
}
