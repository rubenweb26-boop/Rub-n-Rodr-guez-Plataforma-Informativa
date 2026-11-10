import {
  extractTilopayOrderNumber,
  fingerprintPaymentMessage,
  getTilopayProvider,
  tilopayEventType,
} from "@/lib/payments/tilopay-server";
import { reconcileTilopayOrder } from "@/lib/payments/tilopay-orders";
import {
  finishTilopayEvent,
  registerTilopayEvent,
} from "@/lib/payments/webhook-events";
import { recordAuditEvent } from "@/lib/security/audit";
import {
  hasContentType,
  readRequestWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/origin";

export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 1_000_000;

function reply(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!getTilopayProvider().enabled) {
    return reply({ ok: false, error: "Webhook receiver is not configured." }, 503);
  }
  if (!hasContentType(request, "application/json")) {
    return reply({ ok: false, error: "JSON body required." }, 415);
  }

  let rawBody: string;
  let payload: unknown;
  try {
    const bytes = await readRequestWithLimit(request, MAX_WEBHOOK_BYTES);
    rawBody = new TextDecoder().decode(bytes);
    payload = JSON.parse(rawBody) as unknown;
  } catch (error) {
    return reply(
      { ok: false, error: "Invalid webhook body." },
      error instanceof RequestBodyTooLargeError ? 413 : 400,
    );
  }

  // The purchase-webhook contract and OrderHash algorithm are merchant-private
  // Tilopay material. We persist no raw body or card token and make no business
  // decision from this payload. It only supplies an order candidate that must
  // be verified against the authenticated `/consult` endpoint.
  const orderNumber = extractTilopayOrderNumber(payload);
  const payloadHash = await fingerprintPaymentMessage(rawBody);
  let event;
  try {
    event = await registerTilopayEvent({
      source: "webhook",
      orderNumber,
      eventType: tilopayEventType(payload, "hpp.webhook"),
      payloadHash,
    });
  } catch {
    // Do not acknowledge a purchase notification that was not durably stored.
    return reply({ ok: false, error: "Webhook could not be recorded." }, 503);
  }

  if (!orderNumber || !event.transactionId) {
    await finishTilopayEvent(event.id, "ignored", "unknown_order").catch(
      () => undefined,
    );
    return reply({ ok: true, received: true }, 200);
  }

  try {
    const result = await reconcileTilopayOrder(orderNumber);
    const processingStatus =
      result.status === "approved" || result.status === "rejected"
        ? "processed"
        : result.status === "pending"
          ? "received"
          : "failed";
    await finishTilopayEvent(
      event.id,
      processingStatus,
      result.status === "invalid" ? "verification_mismatch" : null,
      result.consulted !== null,
      result.subscriptionId,
    );
    await recordAuditEvent({
      action: "payment.provider_verified",
      resourceType: "payment_transaction",
      resourceId: event.transactionId,
      outcome:
        result.status === "approved"
          ? "success"
          : result.status === "invalid"
            ? "failure"
            : "denied",
      requestHeaders: request.headers,
      metadata: { provider: "tilopay", source: "webhook", status: result.status },
    });
  } catch {
    // The event is durable and marked for reconciliation. Tilopay documents a
    // single delivery attempt for purchases, so acknowledge without exposing
    // provider errors or causing the sender to include token data in logs.
    await finishTilopayEvent(event.id, "failed", "provider_consult_failed").catch(
      () => undefined,
    );
  }

  return reply({ ok: true, received: true }, 200);
}
