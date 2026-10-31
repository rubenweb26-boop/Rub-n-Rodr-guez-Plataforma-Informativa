import {
  PaymentIntegrationDisabledError,
  PaymentProviderError,
  type CreateSubscriptionInput,
  type PaymentProvider,
  type ProviderPaymentIntent,
  type ProviderSubscription,
} from "./types";

const DEFAULT_ONVO_API_BASE_URL = "https://api.onvopay.com";

export interface OnvoProviderConfig {
  /** Must be an explicit true. Missing credentials never enable payments. */
  enabled: boolean;
  secretKey?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

type OnvoErrorPayload = {
  message?: string | string[];
  error?: string;
};

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanIdentifier(value: string, field: string): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned.includes("/") || cleaned.includes("?")) {
    throw new TypeError(`${field} is invalid.`);
  }
  return cleaned;
}

function providerErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as OnvoErrorPayload;
  if (Array.isArray(body.message)) return body.message.join("; ");
  if (hasText(body.message)) return body.message;
  if (hasText(body.error)) return body.error;
  return fallback;
}

/**
 * ONVO adapter. Every network operation is guarded by both an explicit
 * feature flag and a server-side secret key. The default configuration is
 * therefore inert.
 */
export class OnvoPaymentProvider implements PaymentProvider {
  readonly name = "onvo" as const;
  readonly enabled: boolean;

  private readonly secretKey?: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: OnvoProviderConfig) {
    this.secretKey = config.secretKey?.trim();
    this.enabled = config.enabled && hasText(this.secretKey);
    this.apiBaseUrl = (
      config.apiBaseUrl?.trim() || DEFAULT_ONVO_API_BASE_URL
    ).replace(/\/$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<ProviderSubscription> {
    if (!input.items.length) {
      throw new TypeError("A subscription requires at least one price item.");
    }

    return this.request<ProviderSubscription>("/v1/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customerId: cleanIdentifier(input.customerId, "customerId"),
        paymentBehavior: "allow_incomplete",
        items: input.items.map((item) => ({
          priceId: cleanIdentifier(item.priceId, "priceId"),
          quantity: item.quantity ?? 1,
        })),
        metadata: input.metadata,
      }),
    });
  }

  async getSubscription(subscriptionId: string): Promise<ProviderSubscription> {
    const id = cleanIdentifier(subscriptionId, "subscriptionId");
    return this.request<ProviderSubscription>(`/v1/subscriptions/${id}`);
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<ProviderSubscription> {
    const id = cleanIdentifier(subscriptionId, "subscriptionId");
    return this.request<ProviderSubscription>(`/v1/subscriptions/${id}`, {
      method: "DELETE",
    });
  }

  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<ProviderPaymentIntent> {
    const id = cleanIdentifier(paymentIntentId, "paymentIntentId");
    return this.request<ProviderPaymentIntent>(`/v1/payment-intents/${id}`);
  }

  private requireSecretKey(): string {
    if (!this.enabled || !hasText(this.secretKey)) {
      throw new PaymentIntegrationDisabledError(this.name);
    }
    return this.secretKey;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const secretKey = this.requireSecretKey();

    const response = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      throw new PaymentProviderError(
        providerErrorMessage(payload, `ONVO request failed (${response.status}).`),
        response.status,
        this.name,
      );
    }

    return payload as T;
  }
}

export function createOnvoProviderFromEnvironment(environment: {
  ONVO_PAYMENTS_ENABLED?: string;
  ONVO_SECRET_KEY?: string;
  ONVO_API_BASE_URL?: string;
}): OnvoPaymentProvider {
  return new OnvoPaymentProvider({
    enabled: environment.ONVO_PAYMENTS_ENABLED === "true",
    secretKey: environment.ONVO_SECRET_KEY,
    apiBaseUrl: environment.ONVO_API_BASE_URL,
  });
}

export const onvoWebhookEventTypes = [
  "payment-intent.succeeded",
  "payment-intent.failed",
  "payment-intent.deferred",
  "subscription.renewal.succeeded",
  "subscription.renewal.failed",
  "checkout-session.succeeded",
] as const;

export type OnvoWebhookEventType = (typeof onvoWebhookEventTypes)[number];

export interface OnvoWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export function parseOnvoWebhookEvent(payload: unknown): OnvoWebhookEvent {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("Webhook body must be a JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.type !== "string" || !candidate.type.trim()) {
    throw new TypeError("Webhook event type is required.");
  }
  if (
    !candidate.data ||
    typeof candidate.data !== "object" ||
    Array.isArray(candidate.data)
  ) {
    throw new TypeError("Webhook event data must be an object.");
  }

  return {
    type: candidate.type.trim(),
    data: candidate.data as Record<string, unknown>,
  };
}

/** Constant-time comparison suitable for ONVO's shared webhook secret. */
export function verifyOnvoWebhookSecret(
  providedSecret: string | null,
  configuredSecret: string,
): boolean {
  if (!providedSecret || !configuredSecret) return false;

  const encoder = new TextEncoder();
  const provided = encoder.encode(providedSecret);
  const configured = encoder.encode(configuredSecret);
  const size = Math.max(provided.length, configured.length);
  let difference = provided.length ^ configured.length;

  for (let index = 0; index < size; index += 1) {
    difference |= (provided[index] ?? 0) ^ (configured[index] ?? 0);
  }

  return difference === 0;
}

export async function fingerprintWebhookBody(rawBody: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawBody),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function getOnvoObjectId(event: OnvoWebhookEvent): string | null {
  const candidates = [
    event.data.id,
    event.data.subscriptionId,
    event.data.paymentIntentId,
  ];
  const value = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.length > 0,
  );
  return value ?? null;
}

/**
 * ONVO does not currently document a top-level delivery/event ID. Build a
 * deterministic business-event key and fall back to the body hash. Renewal
 * attempts include their attempt number so separate failed retries are kept.
 */
export function getOnvoProviderEventId(
  event: OnvoWebhookEvent,
  payloadHash: string,
): string {
  const values = [
    event.type,
    event.data.id,
    event.data.subscriptionId,
    event.data.paymentIntentId,
    event.data.attemptCount,
    event.data.periodStart,
    event.data.periodEnd,
    event.data.updatedAt,
  ];
  const parts = values
    .filter(
      (value): value is string | number =>
        (typeof value === "string" && value.length > 0) ||
        typeof value === "number",
    )
    .map(String);

  return parts.length > 1 ? parts.join(":") : `${event.type}:${payloadHash}`;
}

export function getOnvoProviderOccurredAt(
  event: OnvoWebhookEvent,
): Date | null {
  const candidates = [
    event.data.updatedAt,
    event.data.createdAt,
    event.data.attemptedAt,
    event.data.authorizationDate,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const timestamp = Date.parse(candidate);
    if (Number.isFinite(timestamp)) return new Date(timestamp);
  }

  return null;
}
