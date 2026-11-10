import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/user";
import {
  createPendingTilopayTransaction,
  findActivePlanPrice,
  markTilopayCheckoutCreated,
  markTilopayCheckoutFailed,
} from "@/lib/payments/tilopay-orders";
import {
  createTilopayOrderNumber,
  getTilopayProvider,
  requireTilopayCallbackUrl,
} from "@/lib/payments/tilopay-server";
import { recordAuditEvent } from "@/lib/security/audit";
import {
  isSameOriginMutation,
  hasContentType,
  readRequestWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/origin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 16 * 1024;
const controlCharacter = /[\u0000-\u001f\u007f]/;
const boundedText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).refine((value) => !controlCharacter.test(value));

const checkoutSchema = z
  .object({
    planCode: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
    turnstileToken: z.string().trim().min(1).max(2048),
    billing: z
      .object({
        firstName: boundedText(100),
        lastName: boundedText(100),
        address: boundedText(240),
        address2: z.string().trim().max(240).default(""),
        city: boundedText(100),
        state: z.string().trim().regex(/^[A-Z0-9]{1,3}(?:-[A-Z0-9]{1,3})?$/),
        postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{1,24}$/),
        country: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
        telephone: z.string().trim().regex(/^\+?[0-9 ()-]{7,32}$/),
      })
      .strict(),
  })
  .strict();

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) {
    return json({ error: "Solicitud no permitida." }, 403);
  }
  if (!hasContentType(request, "application/json")) {
    return json({ error: "El contenido debe ser JSON." }, 415);
  }

  const user = await getCurrentUser();
  if (!user) return json({ error: "Debes iniciar sesión." }, 401);

  const rateLimit = await checkRateLimit(request, {
    operation: "tilopay_checkout",
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

  const paymentProvider = getTilopayProvider();
  if (!paymentProvider.enabled) {
    return json({ error: "El servicio de pagos no está disponible." }, 503);
  }

  let input: z.infer<typeof checkoutSchema>;
  try {
    const bytes = await readRequestWithLimit(request, MAX_REQUEST_BYTES);
    const parsed = checkoutSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes)) as unknown,
    );
    if (!parsed.success) return json({ error: "Los datos de facturación no son válidos." }, 400);
    input = parsed.data;
  } catch (error) {
    return json(
      { error: "La solicitud no es válida o es demasiado grande." },
      error instanceof RequestBodyTooLargeError ? 413 : 400,
    );
  }

  if (!(await verifyTurnstile(input.turnstileToken, request, "tilopay_checkout"))) {
    return json({ error: "No fue posible validar la solicitud." }, 403);
  }

  // The client never supplies price, amount, or currency. All three are read
  // from the server-controlled catalogue immediately before creating an order.
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
    // Persist the unique merchant order before sending it to Tilopay. A retry
    // must create a new transaction instead of reusing an unrecorded number.
    await createPendingTilopayTransaction({
      id: transactionId,
      userId: user.id,
      planPriceId: planPrice.id,
      orderNumber,
      amountMinor: planPrice.amountMinor,
      currency: planPrice.currency,
    });

    const hostedPage = await paymentProvider.createHostedPayment({
      orderNumber,
      amountMinor: planPrice.amountMinor,
      currency: planPrice.currency,
      redirectUrl: requireTilopayCallbackUrl(),
      billing: { ...input.billing, email: user.email },
    });
    await markTilopayCheckoutCreated(transactionId);
    await recordAuditEvent({
      actorId: user.id,
      action: "payment.checkout_created",
      resourceType: "payment_transaction",
      resourceId: transactionId,
      outcome: "success",
      requestHeaders: request.headers,
      metadata: { provider: "tilopay", plan_code: input.planCode },
    });
    return json({ checkoutUrl: hostedPage.checkoutUrl }, 201);
  } catch {
    await markTilopayCheckoutFailed(transactionId).catch(() => undefined);
    await recordAuditEvent({
      actorId: user.id,
      action: "payment.checkout_created",
      resourceType: "payment_transaction",
      resourceId: transactionId,
      outcome: "failure",
      requestHeaders: request.headers,
      metadata: { provider: "tilopay", plan_code: input.planCode },
    });
    return json({ error: "No fue posible iniciar el pago." }, 502);
  }
}
