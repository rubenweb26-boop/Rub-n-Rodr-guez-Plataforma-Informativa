import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServerSecret,
  requireSupabasePublicConfig,
} from "./config";

/**
 * Privileged server-only client. Its key bypasses RLS and must never be
 * imported by a Client Component or serialized into a response.
 */
export function createSupabaseAdminClient() {
  const config = requireSupabasePublicConfig();
  const secret = getSupabaseServerSecret();
  if (!secret) throw new Error("Supabase server secret is unavailable.");

  return createClient(config.url, secret, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
