import {
  fingerprintPaymentMessage,
  tilopayResultUrl,
} from "@/lib/payments/tilopay-server";
import { reconcileTilopayOrder } from "@/lib/payments/tilopay-orders";
import {
  finishTilopayEvent,
  registerTilopayEvent,
} from "@/lib/payments/webhook-events";
import { recordAuditEvent } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

function redirectToResult(
  status: "approved" | "rejected" | "pending" | "invalid",
): Response {
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: tilopayResultUrl(status),
      "Referrer-Policy": "no-referrer",
    },
  });
}

function callbackOrder(value: string | null): string | null {
  const candidate = value?.trim() ?? "";
  return /^[A-Za-z0-9]{8,64}$/.test(candidate) ? candidate : null;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // `code=1`, auth, OrderHash, and every other callback field are untrusted.
  // Only the merchant order locates our pending record; `/consult` decides its
  // state. The full query is reduced to a one-way fingerprint for deduplication.
  const orderNumber = callbackOrder(
    url.searchParams.get("order") ??
      url.searchParams.get("orderNumber") ??
      url.searchParams.get("order_number"),
  );
  const payloadHash = await fingerprintPaymentMessage(url.searchParams.toString());

  let event;
  try {
    event = await registerTilopayEvent({
      source: "callback",
      orderNumber,
      eventType: "hpp.callback",
      payloadHash,
    });
  } catch {
    return redirectToResult("pending");
  }

  if (!orderNumber || !event.transactionId) {
    await finishTilopayEvent(event.id, "ignored", "unknown_order").catch(
      () => undefined,
    );
    return redirectToResult("invalid");
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
      metadata: { provider: "tilopay", source: "callback", status: result.status },
    });
    return redirectToResult(result.status);
  } catch {
    await finishTilopayEvent(event.id, "failed", "provider_consult_failed").catch(
      () => undefined,
    );
    await recordAuditEvent({
      action: "payment.provider_verified",
      resourceType: "payment_transaction",
      resourceId: event.transactionId,
      outcome: "failure",
      requestHeaders: request.headers,
      metadata: { provider: "tilopay", source: "callback" },
    });
    return redirectToResult("pending");
  }
}
