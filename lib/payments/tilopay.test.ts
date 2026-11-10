import assert from "node:assert/strict";
import test from "node:test";
import {
  PaymentIntegrationDisabledError,
  PaymentProviderError,
  type CreateHostedPaymentInput,
} from "./types";
import {
  amountMinorToDecimal,
  decimalToAmountMinor,
  TilopayPaymentProvider,
} from "./tilopay";

const TEST_API_USER = "fixture-api-user";
const TEST_API_PASSWORD = "fixture-api-password";
const TEST_API_KEY = "fixture-api-key";

const payment: CreateHostedPaymentInput = {
  orderNumber: "RRABC123456789",
  amountMinor: 350_000,
  currency: "CRC",
  redirectUrl: "https://example.com/api/payments/tilopay/callback",
  billing: {
    firstName: "Ada",
    lastName: "Lovelace",
    address: "Avenida Central",
    address2: "",
    city: "San Jose",
    state: "CR-SJ",
    postalCode: "10101",
    country: "CR",
    telephone: "+506 8000-0000",
    email: "ada@example.com",
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("Tilopay remains disabled unless flag and all credentials are present", async () => {
  let called = false;
  const provider = new TilopayPaymentProvider({
    enabled: true,
    apiUser: "merchant",
    apiPassword: "",
    apiKey: "key",
    fetchImpl: (async () => {
      called = true;
      return jsonResponse({});
    }) as typeof fetch,
  });

  assert.equal(provider.enabled, false);
  await assert.rejects(
    provider.createHostedPayment(payment),
    PaymentIntegrationDisabledError,
  );
  assert.equal(called, false);
});

test("Tilopay fails closed when the API host is overridden outside the official origin", () => {
  const provider = new TilopayPaymentProvider({
    enabled: true,
    apiUser: TEST_API_USER,
    apiPassword: TEST_API_PASSWORD,
    apiKey: TEST_API_KEY,
    apiBaseUrl: "https://attacker.example",
  });
  assert.equal(provider.enabled, false);
});

test("Hosted checkout logs in server-side and returns only a trusted Tilopay URL", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const provider = new TilopayPaymentProvider({
    enabled: true,
    apiUser: TEST_API_USER,
    apiPassword: TEST_API_PASSWORD,
    apiKey: TEST_API_KEY,
    now: () => 1_000,
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.endsWith("/api/v1/login")) {
        return jsonResponse({
          access_token: "server-token",
          token_type: "bearer",
          expires_in: 86400,
        });
      }
      return jsonResponse({
        type: "100",
        html: "Use url redirect",
        url: "https://secure.tilopay.com/htmls/order.html",
      });
    }) as typeof fetch,
  });

  const result = await provider.createHostedPayment(payment);
  assert.deepEqual(result, {
    orderNumber: payment.orderNumber,
    checkoutUrl: "https://secure.tilopay.com/htmls/order.html",
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].init?.headers instanceof Headers, false);
  assert.equal(
    (requests[1].init?.headers as Record<string, string>).Authorization,
    "bearer server-token",
  );
  const sent = JSON.parse(String(requests[1].init?.body)) as Record<string, unknown>;
  assert.equal(sent.amount, "3500.00");
  assert.equal(sent.currency, "CRC");
  assert.equal(sent.orderNumber, payment.orderNumber);
  assert.equal("apiuser" in sent, false);
  assert.equal("password" in sent, false);
});

test("Consult normalizes an approved record and reuses the cached API token", async () => {
  let loginCalls = 0;
  let consultCalls = 0;
  const provider = new TilopayPaymentProvider({
    enabled: true,
    apiUser: TEST_API_USER,
    apiPassword: TEST_API_PASSWORD,
    apiKey: TEST_API_KEY,
    now: () => 1_000,
    fetchImpl: (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/login")) {
        loginCalls += 1;
        return jsonResponse({ access_token: "token", expires_in: 86400 });
      }
      consultCalls += 1;
      return jsonResponse({
        type: "200",
        response: [
          {
            id_tilopay: 734312,
            orderNumber: payment.orderNumber,
            amount: "3500.00",
            currency: "CRC",
            code: "1",
            response: "Transacción aprobada",
            auth: "123456",
            environment: "Test",
            date: "2026-10-31 16:59:20",
          },
        ],
      });
    }) as typeof fetch,
  });

  const first = await provider.consultOrder(payment.orderNumber);
  const second = await provider.consultOrder(payment.orderNumber);
  assert.equal(first.status, "approved");
  assert.equal(first.amountMinor, 350_000);
  assert.equal(first.currency, "CRC");
  assert.equal(first.providerTransactionId, "734312");
  assert.equal(second.status, "approved");
  assert.equal(loginCalls, 1);
  assert.equal(consultCalls, 2);
});

test("Hosted checkout rejects a provider URL outside Tilopay", async () => {
  const provider = new TilopayPaymentProvider({
    enabled: true,
    apiUser: TEST_API_USER,
    apiPassword: TEST_API_PASSWORD,
    apiKey: TEST_API_KEY,
    fetchImpl: (async (input: RequestInfo | URL) =>
      String(input).endsWith("/api/v1/login")
        ? jsonResponse({ access_token: "token", expires_in: 86400 })
        : jsonResponse({ type: "100", url: "https://attacker.example/pay" })) as typeof fetch,
  });

  await assert.rejects(provider.createHostedPayment(payment), PaymentProviderError);
});

test("Money conversion is exact and rejects malformed provider amounts", () => {
  assert.equal(amountMinorToDecimal(350_000), "3500.00");
  assert.equal(decimalToAmountMinor("3500.00"), 350_000);
  assert.equal(decimalToAmountMinor("1.2"), 120);
  assert.equal(decimalToAmountMinor("1.234"), null);
  assert.equal(decimalToAmountMinor("1e3"), null);
});
