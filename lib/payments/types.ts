export type PaymentProviderName = "onvo";

export type PaymentCurrency = "CRC" | "USD";

export type PaymentMode = "test" | "live";

export interface SubscriptionItemInput {
  priceId: string;
  quantity?: number;
}

export interface CreateSubscriptionInput {
  customerId: string;
  items: SubscriptionItemInput[];
  metadata?: Record<string, string>;
}

export interface ProviderSubscription {
  id: string;
  status: string;
  mode?: PaymentMode;
  customerId?: string;
  currentPeriodEnd?: string;
}

export interface ProviderPaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: PaymentCurrency;
  receivedAmount?: number;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Server-only boundary for payment operations. UI code should never import a
 * provider implementation or receive a provider secret.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  readonly enabled: boolean;

  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<ProviderSubscription>;

  getSubscription(subscriptionId: string): Promise<ProviderSubscription>;

  cancelSubscription(subscriptionId: string): Promise<ProviderSubscription>;

  /**
   * Source of truth after a browser returns from checkout. A redirect query
   * string is never sufficient to grant premium access.
   */
  getPaymentIntent(paymentIntentId: string): Promise<ProviderPaymentIntent>;
}

export class PaymentIntegrationDisabledError extends Error {
  readonly code = "payment_integration_disabled";

  constructor(provider: PaymentProviderName) {
    super(
      `The ${provider} payment integration is disabled. Configure test credentials and explicitly enable it before creating charges.`,
    );
    this.name = "PaymentIntegrationDisabledError";
  }
}

export class PaymentProviderError extends Error {
  readonly code = "payment_provider_error";

  constructor(
    message: string,
    readonly status: number,
    readonly provider: PaymentProviderName,
  ) {
    super(message);
    this.name = "PaymentProviderError";
  }
}
