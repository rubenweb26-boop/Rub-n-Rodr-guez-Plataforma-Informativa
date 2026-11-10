import "server-only";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hmacPseudonym } from "./crypto";

type AuditOutcome = "success" | "denied" | "failure";

export type AuditEvent = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: AuditOutcome;
  requestId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  requestHeaders?: Headers;
};

const SAFE_METADATA_KEY = /^[a-z][a-z0-9_]{0,63}$/;

function safeMetadata(
  metadata: AuditEvent["metadata"],
): Record<string, string | number | boolean | null> {
  if (!metadata) return {};
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => SAFE_METADATA_KEY.test(key) && value !== undefined)
      .slice(0, 20),
  );
}

export async function recordAuditEvent(event: AuditEvent): Promise<boolean> {
  try {
    const requestHeaders = event.requestHeaders ?? (await headers());
    const ip =
      requestHeaders.get("cf-connecting-ip") ??
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";
    const userAgent = requestHeaders.get("user-agent") ?? "";
    const [ipHash, userAgentHash] = await Promise.all([
      hmacPseudonym(ip),
      hmacPseudonym(userAgent),
    ]);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: event.actorId ?? null,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      outcome: event.outcome,
      request_id: event.requestId ?? requestHeaders.get("cf-ray"),
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      metadata: safeMetadata(event.metadata),
    });
    return !error;
  } catch {
    return false;
  }
}
