import {
  PaymentProviderError,
  type ConsultedPayment,
  type CreateHostedPaymentInput,
  type HostedPaymentPage,
  type PaymentCurrency,
  type PaymentProvider,
} from "./types";
import {
  hasText,
  optionalText,
  providerMessage,
  requiredText,
  TilopayTransport,
  type JsonObject,
} from "./tilopay-transport";

interface TilopayProcessPaymentResponse extends JsonObject {
  type?: unknown;
  url?: unknown;
  message?: unknown;
}

interface TilopayConsultResponse extends JsonObject {
  type?: unknown;
  message?: unknown;
  response?: unknown;
}

export interface TilopayProviderConfig {
  /** Missing credentials never enable payments, even when this is true. */
  enabled: boolean;
  apiUser?: string;
  apiPassword?: string;
  apiKey?: string;
  merchantId?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

function assertOrderNumber(value: string): string {
  const orderNumber = value.trim();
  if (!/^[A-Za-z0-9]{8,64}$/.test(orderNumber)) {
    throw new TypeError("orderNumber must contain 8 to 64 alphanumeric characters.");
  }
  return orderNumber;
}

function assertRedirectUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("redirectUrl must be an absolute HTTPS URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new TypeError("redirectUrl must be an absolute HTTPS URL.");
  }
  return url.toString();
}

function assertCheckoutUrl(value: unknown): string {
  if (!hasText(value)) {
    throw new PaymentProviderError(
      "Tilopay did not return a checkout URL.",
      502,
      "tilopay",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PaymentProviderError(
      "Tilopay returned an invalid checkout URL.",
      502,
      "tilopay",
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    (hostname !== "tilopay.com" && !hostname.endsWith(".tilopay.com"))
  ) {
    throw new PaymentProviderError(
      "Tilopay returned an untrusted checkout URL.",
      502,
      "tilopay",
    );
  }
  return url.toString();
}

export function amountMinorToDecimal(amountMinor: number): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new TypeError("amountMinor must be a positive safe integer.");
  }
  const major = Math.floor(amountMinor / 100);
  const minor = String(amountMinor % 100).padStart(2, "0");
  return `${major}.${minor}`;
}

export function decimalToAmountMinor(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : optionalText(value);
  if (!text || !/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [major, minor = ""] = text.split(".");
  const result = Number(major) * 100 + Number(minor.padEnd(2, "0"));
  return Number.isSafeInteger(result) ? result : null;
}

function paymentCurrency(value: unknown): PaymentCurrency | null {
  return value === "CRC" || value === "USD" ? value : null;
}

function parseDate(value: unknown): Date | null {
  if (!hasText(value)) return null;
  // Tilopay currently returns `YYYY-MM-DD HH:mm:ss`; normalise it without
  // claiming a timezone because the API does not document one.
  const timestamp = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

function responseRecord(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/**
 * Tilopay Hosted Payment Page adapter. API user, password, key, and bearer
 * tokens remain inside the shared transport and are never returned to UI.
 */
export class TilopayPaymentProvider implements PaymentProvider {
  readonly name = "tilopay" as const;
  readonly enabled: boolean;

  private readonly merchantId: string;
  private readonly transport: TilopayTransport;

  constructor(config: TilopayProviderConfig) {
    this.merchantId = config.merchantId?.trim() ?? "";
    this.transport = new TilopayTransport(config);
    this.enabled = this.transport.enabled;
  }

  async createHostedPayment(
    input: CreateHostedPaymentInput,
  ): Promise<HostedPaymentPage> {
    const orderNumber = assertOrderNumber(input.orderNumber);
    const billing = input.billing;
    const payload = {
      redirect: assertRedirectUrl(input.redirectUrl),
      key: this.transport.requireApiKey(),
      amount: amountMinorToDecimal(input.amountMinor),
      currency: input.currency,
      orderNumber,
      capture: "1",
      billToFirstName: requiredText(billing.firstName, "billing.firstName", 100),
      billToLastName: requiredText(billing.lastName, "billing.lastName", 100),
      billToAddress: requiredText(billing.address, "billing.address"),
      billToAddress2: billing.address2.trim().slice(0, 240),
      billToCity: requiredText(billing.city, "billing.city", 100),
      billToState: requiredText(billing.state, "billing.state", 16),
      billToZipPostCode: requiredText(billing.postalCode, "billing.postalCode", 24),
      billToCountry: requiredText(billing.country, "billing.country", 2).toUpperCase(),
      billToTelephone: requiredText(billing.telephone, "billing.telephone", 32),
      billToEmail: requiredText(billing.email, "billing.email", 254),
      subscription: "0",
      platform: "rubenweb",
      ...(input.returnData
        ? { returnData: requiredText(input.returnData, "returnData", 512) }
        : {}),
      hashVersion: "V2",
      token_version: "v2",
    };

    const response = (await this.transport.authenticatedRequest(
      "/api/v1/processPayment",
      payload,
      false,
    )) as TilopayProcessPaymentResponse;

    if (String(response.type) !== "100") {
      throw new PaymentProviderError(
        providerMessage(response, "Tilopay did not create the hosted payment page."),
        502,
        this.name,
      );
    }

    return {
      orderNumber,
      checkoutUrl: assertCheckoutUrl(response.url),
    };
  }

  async consultOrder(orderNumberInput: string): Promise<ConsultedPayment> {
    const orderNumber = assertOrderNumber(orderNumberInput);
    const response = (await this.transport.authenticatedRequest("/api/v1/consult", {
      key: this.transport.requireApiKey(),
      orderNumber,
      merchantId: this.merchantId,
    })) as TilopayConsultResponse;

    const records = Array.isArray(response.response)
      ? (response.response.map(responseRecord).filter(Boolean) as JsonObject[])
      : [];
    const exact = records.filter(
      (record) => optionalText(record.orderNumber) === orderNumber,
    );
    if (exact.length === 0) {
      return {
        orderNumber,
        status: "not_found",
        providerTransactionId: null,
        amountMinor: null,
        currency: null,
        authorizationCode: null,
        providerMessage: optionalText(response.message),
        environment: null,
        occurredAt: null,
      };
    }

    // Prefer an approved record when Tilopay returns more than one attempt for
    // the same merchant order. Amount/currency are still compared to our DB by
    // the reconciliation layer before any entitlement can change.
    const record = exact.find((candidate) => String(candidate.code) === "1") ?? exact[0];
    return {
      orderNumber,
      status: String(record.code) === "1" ? "approved" : "rejected",
      providerTransactionId:
        record.id_tilopay === undefined || record.id_tilopay === null
          ? null
          : String(record.id_tilopay),
      amountMinor: decimalToAmountMinor(record.amount),
      currency: paymentCurrency(record.currency),
      authorizationCode: optionalText(record.auth),
      providerMessage: optionalText(record.response) ?? optionalText(response.message),
      environment: optionalText(record.environment),
      occurredAt: parseDate(record.date),
    };
  }
}

export function createTilopayProviderFromEnvironment(environment: {
  TILOPAY_PAYMENTS_ENABLED?: string;
  TILOPAY_API_USER?: string;
  TILOPAY_API_PASSWORD?: string;
  TILOPAY_API_KEY?: string;
  TILOPAY_MERCHANT_ID?: string;
  TILOPAY_API_BASE_URL?: string;
}): TilopayPaymentProvider {
  return new TilopayPaymentProvider({
    enabled: environment.TILOPAY_PAYMENTS_ENABLED === "true",
    apiUser: environment.TILOPAY_API_USER,
    apiPassword: environment.TILOPAY_API_PASSWORD,
    apiKey: environment.TILOPAY_API_KEY,
    merchantId: environment.TILOPAY_MERCHANT_ID,
    apiBaseUrl: environment.TILOPAY_API_BASE_URL,
  });
}
