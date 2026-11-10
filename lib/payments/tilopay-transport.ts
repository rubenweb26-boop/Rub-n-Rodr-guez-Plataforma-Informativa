import {
  PaymentIntegrationDisabledError,
  PaymentProviderError,
} from "./types";

export type JsonObject = Record<string, unknown>;

const DEFAULT_TILOPAY_API_BASE_URL = "https://app.tilopay.com";
const TOKEN_EXPIRY_SKEW_MS = 60_000;

interface TilopayLoginResponse extends JsonObject {
  access_token?: unknown;
  expires_in?: unknown;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function optionalText(value: unknown): string | null {
  return hasText(value) ? value.trim() : null;
}

export function requiredText(value: string, field: string, max = 240): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max || /[\u0000-\u001f\u007f]/.test(cleaned)) {
    throw new TypeError(`${field} is invalid.`);
  }
  return cleaned;
}

export function providerMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as JsonObject;
  return optionalText(body.message) ?? fallback;
}

/**
 * Only app.tilopay.com is accepted. Testing and production share this host, so
 * allowing an override would let a misconfigured environment silently post
 * merchant credentials to an attacker-controlled endpoint.
 */
export function trustedApiBaseUrl(value: string | undefined): string | null {
  const candidate = value?.trim() || DEFAULT_TILOPAY_API_BASE_URL;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "app.tilopay.com" ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export interface AuthenticatedTilopayTransport {
  readonly enabled: boolean;
  /** The merchant `key`, which Tilopay requires in most request bodies. */
  requireApiKey(): string;
  authenticatedRequest(
    path: string,
    body: JsonObject,
    retryExpiredToken?: boolean,
  ): Promise<JsonObject>;
}

/**
 * Owns the bearer token and the credential boundary for every Tilopay call.
 * Tokens cannot be revoked upstream, so they are cached per instance and never
 * leave the server process.
 */
export class TilopayTransport implements AuthenticatedTilopayTransport {
  readonly enabled: boolean;

  private readonly apiUser?: string;
  private readonly apiPassword?: string;
  private readonly apiKey?: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private token: CachedToken | null = null;

  constructor(config: {
    enabled: boolean;
    apiUser?: string;
    apiPassword?: string;
    apiKey?: string;
    apiBaseUrl?: string;
    fetchImpl?: typeof fetch;
    now?: () => number;
  }) {
    this.apiUser = config.apiUser?.trim();
    this.apiPassword = config.apiPassword?.trim();
    this.apiKey = config.apiKey?.trim();
    const apiBaseUrl = trustedApiBaseUrl(config.apiBaseUrl);
    this.enabled =
      config.enabled &&
      hasText(this.apiUser) &&
      hasText(this.apiPassword) &&
      hasText(this.apiKey) &&
      apiBaseUrl !== null;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_TILOPAY_API_BASE_URL;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.now = config.now ?? Date.now;
  }

  requireApiKey(): string {
    const { apiKey } = this.requireCredentials();
    return apiKey;
  }

  async authenticatedRequest(
    path: string,
    body: JsonObject,
    retryExpiredToken = true,
  ): Promise<JsonObject> {
    const send = async (forceRefresh: boolean) => {
      const token = await this.getAccessToken(forceRefresh);
      return this.fetchImpl(`${this.apiBaseUrl}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
    };

    let response = await send(false);
    if (response.status === 401 && retryExpiredToken) {
      this.token = null;
      response = await send(true);
    }
    const payload = (await response.json().catch(() => null)) as JsonObject | null;
    if (!response.ok || !payload) {
      throw new PaymentProviderError(
        providerMessage(payload, `Tilopay request failed (${response.status}).`),
        response.status || 502,
        "tilopay",
      );
    }
    return payload;
  }

  private requireCredentials(): {
    apiUser: string;
    apiPassword: string;
    apiKey: string;
  } {
    if (
      !this.enabled ||
      !hasText(this.apiUser) ||
      !hasText(this.apiPassword) ||
      !hasText(this.apiKey)
    ) {
      throw new PaymentIntegrationDisabledError("tilopay");
    }
    return {
      apiUser: this.apiUser,
      apiPassword: this.apiPassword,
      apiKey: this.apiKey,
    };
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    const credentials = this.requireCredentials();
    if (
      !forceRefresh &&
      this.token &&
      this.token.expiresAt - TOKEN_EXPIRY_SKEW_MS > this.now()
    ) {
      return this.token.value;
    }

    const response = await this.fetchImpl(`${this.apiBaseUrl}/api/v1/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        apiuser: credentials.apiUser,
        password: credentials.apiPassword,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = (await response.json().catch(() => null)) as
      | TilopayLoginResponse
      | null;
    if (!response.ok || !payload || !hasText(payload.access_token)) {
      throw new PaymentProviderError(
        providerMessage(payload, "Tilopay authentication failed."),
        response.status || 502,
        "tilopay",
      );
    }

    const expiresIn = Number(payload.expires_in);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new PaymentProviderError(
        "Tilopay returned an invalid token lifetime.",
        502,
        "tilopay",
      );
    }
    this.token = {
      value: payload.access_token.trim(),
      expiresAt: this.now() + expiresIn * 1000,
    };
    return this.token.value;
  }
}
