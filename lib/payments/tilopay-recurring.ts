import {
  PaymentIntegrationDisabledError,
  PaymentProviderError,
  type PaymentCurrency,
} from "./types";
import {
  type AuthenticatedTilopayTransport,
  type JsonObject,
  hasText,
  optionalText,
  providerMessage,
  requiredText,
} from "./tilopay-transport";

/** Tilopay `frecuency` codes from `POST /api/v1/createPlanRepeat`. */
export const TILOPAY_FREQUENCY = {
  daily: 1,
  weekly: 2,
  monthly: 3,
  yearly: 4,
  biweekly: 5,
  bimonthly: 6,
  quarterly: 7,
  fourmonthly: 8,
  semiannual: 9,
} as const;

export type TilopayFrequencyCode =
  (typeof TILOPAY_FREQUENCY)[keyof typeof TILOPAY_FREQUENCY];

export interface RecurringPlanModality {
  title: string;
  /** Major units, e.g. 3500.00 for ₡3.500. */
  amount: number;
}

export interface CreateRecurringPlanInput {
  title: string;
  description?: string;
  frequency: TilopayFrequencyCode;
  currency: PaymentCurrency;
  firstAmount?: number;
  trial?: boolean;
  trialDays?: number;
  attempts: number;
  modalities: RecurringPlanModality[];
  thanksUrl?: string;
  webhooks?: Partial<Record<RecurringWebhookKind, string>>;
  endAt?: string;
}

export type RecurringWebhookKind =
  | "subscribe"
  | "payment"
  | "rejected"
  | "unsubscribe"
  | "reactive";

export interface CreatedRecurringPlan {
  planId: string;
  url: string;
}

export interface RecurringSubscriberLink {
  registerUrl: string | null;
  renewUrl: string | null;
}

/**
 * Recurring billing adapter. Tilopay charges the subscriber on its own
 * schedule, so this client never moves money — it only creates plans, mints
 * registration URLs, and reads subscriber state back for reconciliation.
 *
 * Amounts on the wire are major units (decimals). The internal ledger stays in
 * minor units; conversion happens at this boundary only.
 */
export class TilopayRecurringClient {
  constructor(private readonly transport: AuthenticatedTilopayTransport) {}

  get enabled(): boolean {
    return this.transport.enabled;
  }

  async createPlan(input: CreateRecurringPlanInput): Promise<CreatedRecurringPlan> {
    if (input.modalities.length === 0 || input.modalities.length > 20) {
      throw new TypeError("A recurring plan needs between 1 and 20 modalities.");
    }
    if (!Number.isInteger(input.attempts) || input.attempts < 0 || input.attempts > 10) {
      throw new TypeError("attempts must be an integer between 0 and 10.");
    }

    const payload: JsonObject = {
      key: this.transport.requireApiKey(),
      title: requiredText(input.title, "title", 120),
      description: input.description ? requiredText(input.description, "description", 500) : "",
      frecuency: input.frequency,
      currency: input.currency,
      first_amount: modalityAmount(input.firstAmount ?? input.modalities[0].amount),
      trial: input.trial ? 1 : 0,
      trial_days: input.trial ? Math.max(0, Math.trunc(input.trialDays ?? 0)) : 0,
      attempts: input.attempts,
      modality: input.modalities.map((modality) => ({
        title: requiredText(modality.title, "modality.title", 60),
        amount: modalityAmount(modality.amount),
      })),
      thanks_url: input.thanksUrl ?? "",
      webhook_subscribe: input.webhooks?.subscribe ?? "",
      webhook_payment: input.webhooks?.payment ?? "",
      webhook_rejected: input.webhooks?.rejected ?? "",
      webhook_unsubscribe: input.webhooks?.unsubscribe ?? "",
      webhook_reactive: input.webhooks?.reactive ?? "",
      end_at: input.endAt ?? "",
      notify: 0,
      notify_detail_es: "",
      notify_detail_en: "",
      notify_note_es: "",
      notify_note_en: "",
    };

    const response = await this.transport.authenticatedRequest(
      "/api/v1/createPlanRepeat",
      payload,
    );

    const planId = response.id;
    const url = optionalText(response.url);
    if (
      (typeof planId !== "number" && !hasText(planId)) ||
      !url
    ) {
      throw new PaymentProviderError(
        providerMessage(response, "Tilopay did not return the recurring plan."),
        502,
        "tilopay",
      );
    }
    assertTilopayUrl(url);

    return { planId: String(planId), url };
  }

  /**
   * Returns the registration URL for a new subscriber, or the renewal URL when
   * the email already has a record. Both are real Tilopay URLs; the caller must
   * still validate them before redirecting a browser.
   */
  async subscriberLink(
    planId: string,
    email: string,
  ): Promise<RecurringSubscriberLink> {
    const response = await this.transport.authenticatedRequest("/api/v1/recurrentUrl", {
      key: this.transport.requireApiKey(),
      id: requiredText(planId, "planId", 32),
      email: requiredText(email, "email", 254),
    });

    const registerUrl = optionalText(response.url_register);
    const renewUrl = optionalText(response.url_renew);
    if (registerUrl) assertTilopayUrl(registerUrl);
    if (renewUrl) assertTilopayUrl(renewUrl);

    return { registerUrl, renewUrl };
  }
}

/** Rejects any checkout URL that is not HTTPS under a Tilopay-controlled host. */
export function assertTilopayUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PaymentProviderError("Tilopay returned an invalid URL.", 502, "tilopay");
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (hostname !== "tilopay.com" &&
      !hostname.endsWith(".tilopay.com") &&
      hostname !== "tp.cr" &&
      !hostname.endsWith(".tp.cr"))
  ) {
    throw new PaymentProviderError("Tilopay returned an untrusted URL.", 502, "tilopay");
  }
  return url.toString();
}

function modalityAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    throw new TypeError("Recurring amounts must be positive and bounded.");
  }
  // Two decimal places is all Tilopay accepts for CRC/USD modalities.
  return Math.round(value * 100) / 100;
}

export function assertRecurringEnabled(enabled: boolean): void {
  if (!enabled) throw new PaymentIntegrationDisabledError("tilopay");
}
