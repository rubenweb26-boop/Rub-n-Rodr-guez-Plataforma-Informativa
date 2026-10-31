import { env } from "cloudflare:workers";
import {
  parseOnvoWebhookEvent,
  verifyOnvoWebhookSecret,
} from "@/lib/payments";
import { registerOnvoWebhookEvent } from "@/lib/payments/webhook-events";

export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 1_000_000;

function jsonError(message: string, status: number): Response {
  return Response.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const configuredSecret = env.ONVO_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    return jsonError("ONVO webhook receiver is not configured.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return jsonError("Webhook body is too large.", 413);
  }

  if (
    !verifyOnvoWebhookSecret(
      request.headers.get("x-webhook-secret"),
      configuredSecret,
    )
  ) {
    return jsonError("Invalid webhook credentials.", 401);
  }

  const rawBody = await request.text();
  if (!rawBody) return jsonError("Webhook body is required.", 400);
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return jsonError("Webhook body is too large.", 413);
  }

  let event;
  try {
    event = parseOnvoWebhookEvent(JSON.parse(rawBody) as unknown);
  } catch {
    return jsonError("Webhook body is not a valid ONVO event.", 400);
  }

  try {
    const registered = await registerOnvoWebhookEvent({ event, rawBody });
    return Response.json({
      ok: true,
      received: true,
      duplicate: registered.duplicate,
      eventId: registered.id,
      processingStatus: registered.processingStatus,
      entitlementChanged: false,
    });
  } catch (error) {
    // Never acknowledge an event that could not be durably recorded; ONVO can
    // then retry delivery. Do not log secrets or the raw payment payload.
    console.error(
      "Unable to persist ONVO webhook event.",
      error instanceof Error ? error.message : "Unknown persistence error",
    );
    return jsonError("Webhook event could not be recorded.", 503);
  }
}
