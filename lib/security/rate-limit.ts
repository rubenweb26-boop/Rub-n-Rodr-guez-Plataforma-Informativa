import "server-only";

import { env } from "cloudflare:workers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hmacPseudonym } from "./crypto";

type RateLimitInput = {
  operation: string;
  userId?: string | null;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  configured: boolean;
};

export async function checkRateLimit(
  request: Request,
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const material = `${input.operation}:${input.userId ?? "anonymous"}:${ip}`;
  const key = await hmacPseudonym(material, env.RATE_LIMIT_HMAC_KEY);
  if (!key) return { allowed: false, configured: false };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: input.limit,
      p_window_seconds: input.windowSeconds,
    });
    if (error) return { allowed: false, configured: false };
    return { allowed: data === true, configured: true };
  } catch {
    return { allowed: false, configured: false };
  }
}
