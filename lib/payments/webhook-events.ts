import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findTilopayTransaction } from "./tilopay-orders";

type ProcessingStatus = "received" | "processed" | "ignored" | "failed";

export type RegisteredTilopayEvent = {
  id: string;
  duplicate: boolean;
  transactionId: string | null;
};

export async function registerTilopayEvent(input: {
  source: "callback" | "webhook";
  orderNumber: string | null;
  eventType: string;
  payloadHash: string;
}): Promise<RegisteredTilopayEvent> {
  const transaction = input.orderNumber
    ? await findTilopayTransaction(input.orderNumber)
    : null;
  const providerEventId = [
    input.source,
    input.orderNumber ?? "unknown",
    input.payloadHash,
  ].join(":");
  const supabase = createSupabaseAdminClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("payment_provider_events").insert({
    id,
    provider: "tilopay",
    provider_event_id: providerEventId,
    event_type: input.eventType,
    payload_hash: input.payloadHash,
    // Tilopay's orderHash algorithm and purchase-webhook contract are supplied
    // privately per merchant. We never claim signature verification here; the
    // subsequent server-to-server `/consult` call is the trust boundary.
    signature_verified: false,
    provider_state_confirmed: false,
    processing_status: "received",
    transaction_id: transaction?.id ?? null,
    attempt_count: 1,
    last_error: null,
  });

  if (!error) {
    return { id, duplicate: false, transactionId: transaction?.id ?? null };
  }
  if (error.code !== "23505") {
    throw new Error("Unable to persist the Tilopay notification.");
  }

  const { data: existing, error: readError } = await supabase
    .from("payment_provider_events")
    .select("id, attempt_count, transaction_id")
    .eq("provider", "tilopay")
    .eq("provider_event_id", providerEventId)
    .limit(1)
    .maybeSingle();
  if (readError || !existing || typeof existing.id !== "string") {
    throw new Error("Unable to recover the duplicate Tilopay notification.");
  }
  await supabase
    .from("payment_provider_events")
    .update({
      attempt_count:
        typeof existing.attempt_count === "number"
          ? existing.attempt_count + 1
          : 2,
    })
    .eq("id", existing.id);
  return {
    id: existing.id,
    duplicate: true,
    transactionId:
      typeof existing.transaction_id === "string" ? existing.transaction_id : null,
  };
}

export async function finishTilopayEvent(
  eventId: string,
  status: ProcessingStatus,
  errorCode: string | null = null,
  providerStateConfirmed = false,
  subscriptionId: string | null = null,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("payment_provider_events")
    .update({
      processing_status: status,
      last_error: errorCode,
      provider_state_confirmed: providerStateConfirmed,
      processed_at:
        status === "processed" || status === "ignored" || status === "failed"
          ? new Date().toISOString()
          : null,
      ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
    })
    .eq("id", eventId)
    .eq("provider", "tilopay");
  if (error) throw new Error("Unable to finalize the Tilopay notification.");
}
