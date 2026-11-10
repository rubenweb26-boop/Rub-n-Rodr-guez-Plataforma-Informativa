import { env } from "cloudflare:workers";

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

function text(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof env !== "undefined" && (env as unknown as Record<string, string | undefined>)[key]) {
      return (env as unknown as Record<string, string | undefined>)[key];
    }
  } catch {
    // ignore
  }
  return process.env[key];
}

/**
 * The publishable key is intentionally safe to expose. It grants no useful
 * access by itself: every exposed table and Storage object is protected by
 * Supabase RLS. Secret/service-role keys are never returned from this module.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = text(getEnvVar("NEXT_PUBLIC_SUPABASE_URL"));
  const publishableKey = text(getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
  if (!url || !publishableKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    return null;
  }

  return { url: parsed.origin, publishableKey };
}

export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase public configuration is unavailable.");
  }
  return config;
}

export function getSupabaseServerSecret(): string | null {
  return text(getEnvVar("SUPABASE_SECRET_KEY")) ?? text(getEnvVar("SUPABASE_SERVICE_ROLE_KEY"));
}
