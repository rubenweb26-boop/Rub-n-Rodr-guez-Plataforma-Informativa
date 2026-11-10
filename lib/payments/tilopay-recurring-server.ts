import "server-only";

import { env } from "cloudflare:workers";
import { TilopayRecurringClient } from "./tilopay-recurring";
import { TilopayTransport } from "./tilopay-transport";

export interface SubscriptionConfig {
  /** Recurring billing is only live when the flag is true AND every id exists. */
  enabled: boolean;
  /** Numeric id of the plan created in Tilopay with `createPlanRepeat`. */
  planId: string | null;
  /** Public code of the plan in our own `plans` table. */
  planCode: string;
  frequency: "monthly" | "yearly";
  /** Where Tilopay returns the subscriber after registering a card. */
  thanksUrlConfigured: boolean;
}

type SubscriptionEnvironment = {
  TILOPAY_RECURRING_ENABLED?: string;
  TILOPAY_RECURRING_PLAN_ID?: string;
  TILOPAY_RECURRING_PLAN_CODE?: string;
  TILOPAY_RECURRING_FREQUENCY?: string;
  TILOPAY_PAYMENTS_ENABLED?: string;
  TILOPAY_CALLBACK_URL?: string;
};

/**
 * Resolves the recurring configuration without ever inventing a plan id. A
 * missing id keeps checkout inert instead of charging against the wrong plan.
 */
export function subscriptionConfigFromEnvironment(
  environment: SubscriptionEnvironment,
): SubscriptionConfig {
  const rawPlanId = environment.TILOPAY_RECURRING_PLAN_ID?.trim() ?? "";
  const planId = /^[0-9]{1,12}$/.test(rawPlanId) ? rawPlanId : null;
  const planCode = /^[a-z][a-z0-9_-]{1,49}$/.test(
    environment.TILOPAY_RECURRING_PLAN_CODE?.trim() ?? "",
  )
    ? (environment.TILOPAY_RECURRING_PLAN_CODE as string).trim()
    : "contenido-mensual";
  const frequency =
    environment.TILOPAY_RECURRING_FREQUENCY?.trim() === "yearly" ? "yearly" : "monthly";

  return {
    enabled:
      environment.TILOPAY_RECURRING_ENABLED === "true" &&
      environment.TILOPAY_PAYMENTS_ENABLED === "true" &&
      planId !== null,
    planId,
    planCode,
    frequency,
    thanksUrlConfigured: Boolean(environment.TILOPAY_CALLBACK_URL?.trim()),
  };
}

export function getSubscriptionConfig(): SubscriptionConfig {
  return subscriptionConfigFromEnvironment(env);
}

let recurringClient: TilopayRecurringClient | null = null;

/**
 * Recurring client backed by the same credential boundary as one-time charges.
 * It is deliberately separate from the HPP provider so a failure in the
 * recurrence API cannot silently enable hosted-page charges.
 */
export function getTilopayRecurringClient(): TilopayRecurringClient {
  recurringClient ??= new TilopayRecurringClient(
    new TilopayTransport({
      enabled: env.TILOPAY_PAYMENTS_ENABLED === "true",
      apiUser: env.TILOPAY_API_USER,
      apiPassword: env.TILOPAY_API_PASSWORD,
      apiKey: env.TILOPAY_API_KEY,
      apiBaseUrl: env.TILOPAY_API_BASE_URL,
    }),
  );
  return recurringClient;
}

/**
 * Absolute HTTPS URL for a recurring webhook. Tilopay stores these per plan, so
 * they must be stable across deployments.
 */
export function recurringWebhookUrl(kind: string): string {
  const base = env.TILOPAY_CALLBACK_URL?.trim();
  if (!base) throw new Error("Tilopay callback URL is unavailable.");
  const url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Tilopay callback URL must be an absolute HTTPS URL.");
  }
  url.pathname = `/api/webhooks/tilopay/recurring`;
  url.search = "";
  url.hash = "";
  url.searchParams.set("kind", kind);
  return url.toString();
}
