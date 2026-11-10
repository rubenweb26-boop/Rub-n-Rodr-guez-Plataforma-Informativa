import {
  extendRecurringAccess,
  findSubscriptionByEmail,
  setSubscriptionStatus,
} from "@/lib/payments/tilopay-orders";
import { getSubscriptionConfig } from "@/lib/payments/tilopay-recurring-server";
import {
  fingerprintPaymentMessage,
  tilopayEventType,
} from "@/lib/payments/tilopay-server";
import {
  finishTilopayEvent,
  registerTilopayEvent,
} from "@/lib/payments/webhook-events";
import {
  hasContentType,
  readRequestWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/origin";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 8 * 1024;

/**
 * Recurring-plan notifications.
 *
 * Tilopay publishes the plan webhook payloads (subscribe/payment/rejected/
 * unsubscribe/reactive) but they are unsigned: the only origin proof is
 * `orderHash`, whose algorithm is delivered privately. Every handler therefore
 * treats the body as a hint, and access only moves after the server confirms
 * state against its own records.
 */
type RecurringKind = "subscribe" | "payment" | "rejected" | "unsubscribe" | "reactive";

const KINDS: readonly RecurringKind[] = [
  "subscribe",
  "payment",
  "rejected",
  "unsubscribe",
  "reactive",
];

function isRecurringKind(value: unknown): value is RecurringKind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

function pickEmail(payload: Record<string, unknown>): string | null {
  const candidate = [payload.email, payload.customer_email, payload.customerEmail].find(
    (value): value is string => typeof value === "string",
  );
  const email = candidate?.trim().toLowerCase();
  return email && /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(email) ? email : null;
}

function pickOrderNumber(payload: Record<string, unknown>): string | null {
  const candidate = [payload.orderNumber, payload.order, payload.order_number].find(
    (value): value is string => typeof value === "string",
  );
  const order = candidate?.trim();
  return order && /^[A-Za-z0-9]{8,64}$/.test(order) ? order : null;
}

function pickAmountMinor(payload: Record<string, unknown>): number | null {
  const raw = payload.amount;
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw : "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [major, minor = ""] = text.split(".");
  const result = Number(major) * 100 + Number(minor.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

/** Adds one month to an instant without rolling past short months. */
function addMonth(from: Date): Date {
  const next = new Date(from.getTime());
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const daysInMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, daysInMonth));
  return next;
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");

  // Tilopay retries recurrence webhooks 5 times on 4xx/5xx; a 200 must be sent
  // as soon as the event is recorded, and processing happens after that.
  if (!hasContentType(request, "application/json")) {
    return new Response("Unsupported Media Type", { status: 415 });
  }

  let raw: string;
  try {
    const bytes = await readRequestWithLimit(request, MAX_REQUEST_BYTES);
    raw = new TextDecoder().decode(bytes);
  } catch (error) {
    return new Response("Payload too large", {
      status: error instanceof RequestBodyTooLargeError ? 413 : 400,
    });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Response("Bad Request", { status: 400 });
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const resolvedKind: RecurringKind = isRecurringKind(kind) ? kind : "payment";
  const payloadHash = await fingerprintPaymentMessage(`${resolvedKind}:${raw}`);
  const email = pickEmail(payload);
  const orderNumber = pickOrderNumber(payload);

  let eventId: string;
  try {
    const registered = await registerTilopayEvent({
      source: "webhook",
      orderNumber,
      eventType: tilopayEventType(payload, `recurring.${resolvedKind}`),
      payloadHash,
    });
    if (registered.duplicate) {
      // Already handled once; acknowledging stops Tilopay's retry loop.
      return new Response("OK", { status: 200 });
    }
    eventId = registered.id;
  } catch {
    // A storage failure must NOT be acknowledged, otherwise the event is lost
    // after Tilopay stops retrying.
    return new Response("Service Unavailable", { status: 503 });
  }

  try {
    const config = getSubscriptionConfig();
    if (!config.planId || !email) {
      await finishTilopayEvent(eventId, "ignored", "unresolvable_subscriber");
      return new Response("OK", { status: 200 });
    }

    const subscription = await findSubscriptionByEmail(config.planId, email);
    if (!subscription) {
      // No local match: keep it for operational reconciliation rather than
      // granting access to an unknown address.
      await finishTilopayEvent(eventId, "ignored", "subscription_not_found");
      return new Response("OK", { status: 200 });
    }

    if (resolvedKind === "payment") {
      const amountMinor = pickAmountMinor(payload);
      if (!orderNumber || amountMinor === null) {
        await finishTilopayEvent(eventId, "failed", "unverifiable_payment", false);
        return new Response("OK", { status: 200 });
      }
      // Anchored to the later of "now" and the current access window so an
      // early renewal extends from the paid period, never shortening it.
      const currentAccess = subscription.accessUntil
        ? new Date(subscription.accessUntil)
        : null;
      const base =
        currentAccess && currentAccess.getTime() > Date.now() ? currentAccess : new Date();
      const periodEnd = addMonth(base).toISOString();

      await extendRecurringAccess({
        subscriptionId: subscription.id,
        amountMinor,
        currency: "CRC",
        providerOrderNumber: orderNumber,
        providerTransactionId: orderNumber,
        periodEnd,
      });
      await finishTilopayEvent(eventId, "processed", null, true, subscription.id);
      return new Response("OK", { status: 200 });
    }

    if (resolvedKind === "subscribe" || resolvedKind === "reactive") {
      await setSubscriptionStatus({ subscriptionId: subscription.id, status: "active" });
      await finishTilopayEvent(eventId, "processed", null, true, subscription.id);
      return new Response("OK", { status: 200 });
    }

    if (resolvedKind === "rejected") {
      // A rejected charge does not revoke access immediately: the subscriber
      // keeps the window already paid for, and Tilopay retries.
      await setSubscriptionStatus({ subscriptionId: subscription.id, status: "past_due" });
      await finishTilopayEvent(eventId, "processed", null, true, subscription.id);
      return new Response("OK", { status: 200 });
    }

    // unsubscribe: access runs to the paid window end, then expires.
    await setSubscriptionStatus({
      subscriptionId: subscription.id,
      status: "canceled",
      canceledAt: new Date().toISOString(),
    });
    await finishTilopayEvent(eventId, "processed", null, true, subscription.id);
    return new Response("OK", { status: 200 });
  } catch {
    await finishTilopayEvent(eventId, "failed", "processing_error").catch(() => undefined);
    return new Response("OK", { status: 200 });
  }
}
