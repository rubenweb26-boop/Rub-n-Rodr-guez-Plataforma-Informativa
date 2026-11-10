import "server-only";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { AuthProviderId } from "./providers";

export async function getAvailableAuthProviders(): Promise<AuthProviderId[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.publishableKey },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const settings = await response.json() as { external?: Record<string, boolean> };
    return (["google", "apple", "facebook"] as const).filter(id => settings.external?.[id] === true);
  } catch { return []; }
}
