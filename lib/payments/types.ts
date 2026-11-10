export type PaymentProviderName = "tilopay";

export type PaymentCurrency = "CRC" | "USD";

export interface TilopayBillingDetails {
  firstName: string;
  lastName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  telephone: string;
  email: string;
}

export interface CreateHostedPaymentInput {
  /** Unique merchant order number persisted before this call is made. */
  orderNumber: string;
  amountMinor: number;
  currency: PaymentCurrency;
  redirectUrl: string;
  billing: TilopayBillingDetails;
  returnData?: string;
}

export interface HostedPaymentPage {
  orderNumber: string;
  checkoutUrl: string;
}

export type ConsultedPaymentStatus = "approved" | "rejected" | "not_found";

export interface ConsultedPayment {
  orderNumber: string;
  status: ConsultedPaymentStatus;
  providerTransactionId: string | null;
  amountMinor: number | null;
  currency: PaymentCurrency | null;
  authorizationCode: string | null;
  providerMessage: string | null;
  environment: string | null;
  occurredAt: Date | null;
}

/** Server-only boundary for the Tilopay Hosted Payment Page API. */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  readonly enabled: boolean;

  createHostedPayment(
    input: CreateHostedPaymentInput,
  ): Promise<HostedPaymentPage>;

  /**
   * The only source of truth after a browser callback or webhook. Neither of
   * those untrusted messages may grant access without this lookup succeeding.
   */
  consultOrder(orderNumber: string): Promise<ConsultedPayment>;
}

export class PaymentIntegrationDisabledError extends Error {
  readonly code = "payment_integration_disabled";

  constructor(provider: PaymentProviderName) {
    super(
      `The ${provider} payment integration is disabled. Configure server credentials and explicitly enable it before creating charges.`,
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
