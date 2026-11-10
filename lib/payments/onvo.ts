import crypto from "node:crypto";

async function getAdminClient() {
  const { createSupabaseAdminClient } = await import("../supabase/admin");
  return createSupabaseAdminClient();
}

export type OnvoPlanKey = "membership_citizen" | "membership_commercial";

export interface PlanConfig {
  key: OnvoPlanKey;
  name: string;
  description: string;
  amountCrc: number; // e.g. 3500
  interval: "month";
}

export const ONVO_PLANS: Record<OnvoPlanKey, PlanConfig> = {
  membership_citizen: {
    key: "membership_citizen",
    name: "Membresía Ciudadana Rubén Rodríguez",
    description: "Acceso total a investigaciones exclusivas, videos premium y seguimiento privado de denuncias.",
    amountCrc: 3500,
    interval: "month",
  },
  membership_commercial: {
    key: "membership_commercial",
    name: "Membresía Comercial para Anunciantes",
    description: "Perfil comercial verificado, publicación de hasta 10 productos/servicios y vitrina publicitaria.",
    amountCrc: 3500,
    interval: "month",
  },
};

export function isOnvoConfigured(): boolean {
  return Boolean(process.env.ONVO_SECRET_KEY);
}

/**
 * Creates an ONVO Pay Hosted Checkout Session.
 * Redirects the user to the official ONVO Pay payment page (supports Tarjetas & SINPE Móvil).
 */
export async function createOnvoCheckoutSession({
  userId,
  userEmail,
  planKey,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  planKey: OnvoPlanKey;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; sessionId?: string }> {
  const secretKey = process.env.ONVO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("ONVO Pay no está configurado en las variables de entorno (ONVO_SECRET_KEY requerida).");
  }

  const plan = ONVO_PLANS[planKey];
  if (!plan) throw new Error(`Plan no válido: ${planKey}`);

  const unitAmount = plan.amountCrc * 100; // Minor units (3500 * 100 = 350000 céntimos de CRC)

  const payload = {
    lineItems: [
      {
        quantity: 1,
        unitAmount,
        currency: "CRC",
        description: `${plan.name} - ₡${plan.amountCrc} / mes`,
      },
    ],
    customerEmail: userEmail,
    redirectUrl: successUrl,
    cancelUrl: cancelUrl,
    metadata: {
      userId,
      planKey,
      interval: plan.interval,
    },
  };

  const response = await fetch("https://api.onvopay.com/v1/checkout/sessions/one-time-link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    url?: string;
    id?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok || !data.url) {
    const errorDetail = data.message || data.error || `HTTP ${response.status}`;
    throw new Error(`Error de Onvo Pay: ${errorDetail}`);
  }

  return { url: data.url, sessionId: data.id };
}

/**
 * Handles incoming ONVO Pay Webhooks with X-Webhook-Secret validation.
 */
export async function processOnvoWebhook(
  rawBody: string,
  secretHeader: string | null,
): Promise<{ received: boolean; eventType: string }> {
  const configuredWebhookSecret = process.env.ONVO_WEBHOOK_SECRET;

  if (configuredWebhookSecret) {
    if (!secretHeader) {
      throw new Error("Encabezado X-Webhook-Secret faltante.");
    }

    const secretBuffer = Buffer.from(secretHeader, "utf8");
    const configuredBuffer = Buffer.from(configuredWebhookSecret, "utf8");

    if (
      secretBuffer.length !== configuredBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, configuredBuffer)
    ) {
      throw new Error("Firma o secreto de webhook ONVO no válido.");
    }
  }

  let event: {
    type?: string;
    event?: string;
    data?: {
      id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      customerEmail?: string;
      metadata?: {
        userId?: string;
        planKey?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new Error("Cuerpo de webhook ONVO no es JSON válido.");
  }

  const eventType = event.type || event.event || "unknown";
  const eventData = event.data || {};
  const eventId = eventData.id || `onvo_evt_${crypto.randomUUID()}`;

  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  const admin = await getAdminClient();

  // Guard against duplicate webhook deliveries (idempotency)
  const { data: existingEvent } = await admin
    .from("payment_provider_events")
    .select("id")
    .eq("provider", "onvo")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return { received: true, eventType };
  }

  await admin.from("payment_provider_events").insert({
    provider: "onvo",
    provider_event_id: eventId,
    event_type: eventType,
    payload_hash: payloadHash,
    signature_verified: Boolean(configuredWebhookSecret),
    processing_status: "received",
  });

  // Handle successful payments and recurring renewals
  const isPaymentSuccess =
    eventType === "checkout-session.succeeded" ||
    eventType === "payment-intent.succeeded" ||
    eventType === "subscription.renewal.succeeded";

  if (isPaymentSuccess) {
    const userId = eventData.metadata?.userId;
    const planKey = (eventData.metadata?.planKey || "membership_citizen") as OnvoPlanKey;

    if (userId) {
      const planCode = planKey === "membership_commercial" ? "commercial_monthly" : "citizen_monthly";

      const { data: planRow } = await admin
        .from("plans")
        .select("id")
        .eq("code", planCode)
        .maybeSingle();

      const planId = planRow?.id;
      const accessUntil = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan_id: planId,
          status: "active",
          provider: "onvo",
          provider_subscription_id: eventId,
          provider_customer_id: eventData.customerEmail || userId,
          access_until: accessUntil,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider,provider_subscription_id" },
      );

      const orderNumber = eventData.id || `ord_${Date.now()}`;
      const amountMinor = Number(eventData.amount || 350000);
      const idempotencyKey = `tx_${orderNumber}_${Date.now()}`;

      await admin.from("payment_transactions").insert({
        user_id: userId,
        provider: "onvo",
        provider_order_number: orderNumber,
        provider_transaction_id: eventId,
        idempotency_key: idempotencyKey,
        amount_minor: amountMinor,
        currency: (eventData.currency || "CRC").toUpperCase(),
        status: "approved",
        kind: "charge",
        metadata_json: eventData.metadata || {},
      });
    }
  } else if (eventType === "subscription.renewal.failed" || eventType === "subscription.canceled") {
    if (eventId) {
      await admin
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("provider", "onvo")
        .eq("provider_subscription_id", eventId);
    }
  }

  return { received: true, eventType };
}

/**
 * Server-only verification of paid access.
 * Checks database access window - unexpired and status active/past_due/canceled.
 */
export async function checkUserSubscriptionAccess(userId: string): Promise<{
  hasAccess: boolean;
  planCode: string | null;
  accessUntil: string | null;
}> {
  if (!userId) return { hasAccess: false, planCode: null, accessUntil: null };

  const admin = await getAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, access_until, plans(code)")
    .eq("user_id", userId)
    .in("status", ["active", "past_due", "canceled"])
    .order("access_until", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.access_until) {
    return { hasAccess: false, planCode: null, accessUntil: null };
  }

  const accessUntilDate = new Date(data.access_until);
  const isUnexpired = accessUntilDate.getTime() > Date.now();

  const rawPlans = data.plans as unknown;
  const planCode =
    rawPlans && typeof rawPlans === "object" && "code" in rawPlans
      ? String((rawPlans as { code?: string }).code)
      : null;

  return {
    hasAccess: isUnexpired,
    planCode,
    accessUntil: data.access_until,
  };
}
