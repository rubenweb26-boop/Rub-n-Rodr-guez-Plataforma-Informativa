import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/user";
import {
  createPendingTilopayTransaction,
  findActivePlanPrice,
  markTilopayCheckoutFailed,
  upsertRecurringSubscription,
} from "@/lib/payments/tilopay-orders";
import { assertTilopayUrl } from "@/lib/payments/tilopay-recurring";
import {
  getSubscriptionConfig,
  getTilopayRecurringClient,
} from "@/lib/payments/tilopay-recurring-server";
import { createTilopayOrderNumber, requireTilopayCallbackUrl } from "@/lib/payments/tilopay-server";
import { recordAuditEvent } from "@/lib/security/audit";
import {
  hasContentType,
  isSameOriginMutation,
  readRequestWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/origin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 4 * 1024;
const controlCharacter = /[\u0000-\u001f\u007f]/;

const subscribeSchema = z
  .object({
    planCode: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
    turnstileToken: z.string().trim().min(1).max(2048),
  })
  .strict();

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

/**
 * Starts a recurring subscription. The browser sends only a plan code and a
 * Turnstile token: price, currency, plan id, and billing owner all come from
 * the server, and the returned URL is re-validated before it leaves.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) {
    return json({ error: "Solicitud no permitida." }, 403);
  }
  if (!hasContentType(request, "application/json")) {
    return json({ error: "El contenido debe ser JSON." }, 415);
  }

  const user = await getCurrentUser();
  if (!user) return json({ error: "Debes iniciar sesión." }, 401);

  const config = getSubscriptionConfig();
  if (!config.enabled || !config.planId) {
    return json({ error: "La suscripción no está disponible." }, 503);
  }

  const rateLimit = await checkRateLimit(request, {
    operation: "tilopay_subscribe",
    userId: user.id,
    limit: 5,
    windowSeconds: 300,
  });
  if (!rateLimit.configured) {
    return json({ error: "El servicio de pagos no está disponible." }, 503);
  }
  if (!rateLimit.allowed) {
    return json(
      { error: "Demasiados intentos. Intenta nuevamente en unos minutos." },
      429,
      { "Retry-After": "300" },
    );
  }

  let input: z.infer<typeof subscribeSchema>;
  try {
    const bytes = await readRequestWithLimit(request, MAX_REQUEST_BYTES);
    const parsed = subscribeSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes)) as unknown,
    );
    if (!parsed.success) return json({ error: "La solicitud no es válida." }, 400);
    input = parsed.data;
  } catch (error) {
    return json(
      { error: "La solicitud no es válida o es demasiado grande." },
      error instanceof RequestBodyTooLargeError ? 413 : 400,
    );
  }

  if (controlCharacter.test(input.planCode)) {
    return json({ error: "La solicitud no es válida." }, 400);
  }

  if (!(await verifyTurnstile(input.turnstileToken, request, "tilopay_subscribe"))) {
    return json({ error: "No fue posible validar la solicitud." }, 403);
  }

  if (input.planCode !== config.planCode) {
    return json({ error: "El plan seleccionado no está disponible." }, 404);
  }

  let planPrice;
  try {
    planPrice = await findActivePlanPrice(input.planCode, "CRC");
  } catch {
    return json({ error: "No fue posible verificar el precio del plan." }, 503);
  }
  if (!planPrice) return json({ error: "El plan seleccionado no está disponible." }, 404);

  const transactionId = crypto.randomUUID();
  const orderNumber = createTilopayOrderNumber();

  try {
    // Record the commercial record before the provider is contacted so a
    // failure leaves an auditable pending row instead of a silent charge.
    await createPendingTilopayTransaction({
      id: transactionId,
      userId: user.id,
      planPriceId: planPrice.id,
      orderNumber,
      amountMinor: planPrice.amountMinor,
      currency: planPrice.currency,
    });

    const client = getTilopayRecurringClient();
    const link = await client.subscriberLink(config.planId, user.email);
    const target = link.renewUrl ?? link.registerUrl;
    if (!target) {
      throw new Error("Tilopay did not return a subscription URL.");
    }

    const safeUrl = assertTilopayUrl(target);

    await upsertRecurringSubscription({
      userId: user.id,
      planPriceId: planPrice.id,
      planId: config.planId,
      email: user.email,
      status: "pending",
      accessUntil: null,
      currentPeriodEnd: null,
    });

    await recordAuditEvent({
      actorId: user.id,
      action: "payment.subscription_started",
      resourceType: "payment_transaction",
      resourceId: transactionId,
      outcome: "success",
      requestHeaders: request.headers,
      metadata: {
        provider: "tilopay",
        plan_code: input.planCode,
        mode: link.renewUrl ? "renew" : "register",
        callback_configured: Boolean(requireTilopayCallbackUrl()),
      },
    });

    return json({ subscriptionUrl: safeUrl }, 201);
  } catch {
    await markTilopayCheckoutFailed(transactionId).catch(() => undefined);
    await recordAuditEvent({
      actorId: user.id,
      action: "payment.subscription_started",
      resourceType: "payment_transaction",
      resourceId: transactionId,
      outcome: "failure",
      requestHeaders: request.headers,
      metadata: { provider: "tilopay", plan_code: input.planCode },
    });
    return json({ error: "No fue posible iniciar la suscripción." }, 502);
  }
}
