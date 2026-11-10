import "server-only";

import { env } from "cloudflare:workers";
import {
  createTilopayProviderFromEnvironment,
  type TilopayPaymentProvider,
} from "./tilopay";

let provider: TilopayPaymentProvider | null = null;

export function getTilopayProvider(): TilopayPaymentProvider {
  provider ??= createTilopayProviderFromEnvironment(env);
  return provider;
}

export function requireTilopayCallbackUrl(): string {
  const value = env.TILOPAY_CALLBACK_URL?.trim();
  if (!value) throw new Error("Tilopay callback URL is unavailable.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Tilopay callback URL must be an absolute HTTPS URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Tilopay callback URL must be an absolute HTTPS URL.");
  }
  return url.toString();
}

export function tilopayResultUrl(
  status: "approved" | "rejected" | "pending" | "invalid",
): string {
  const url = new URL("/membresia", requireTilopayCallbackUrl());
  url.searchParams.set("payment", status);
  return url.toString();
}

/** Alphanumeric merchant order number, unique before it leaves our server. */
export function createTilopayOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase();
  return `RR${time}${random}`;
}

export async function fingerprintPaymentMessage(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function orderCandidate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  return /^[A-Za-z0-9]{8,64}$/.test(candidate) ? candidate : null;
}

/**
 * Tilopay publishes callback fields, but the purchase-webhook contract is
 * supplied privately per merchant. Support only bounded, explicit locations;
 * every candidate is still untrusted until `/consult` confirms it.
 */
export function extractTilopayOrderNumber(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const body = payload as Record<string, unknown>;
  const direct = [body.orderNumber, body.order, body.order_number]
    .map(orderCandidate)
    .find(Boolean);
  if (direct) return direct;

  for (const key of ["data", "transaction", "payment"] as const) {
    const nested = body[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    const record = nested as Record<string, unknown>;
    const candidate = [record.orderNumber, record.order, record.order_number]
      .map(orderCandidate)
      .find(Boolean);
    if (candidate) return candidate;
  }
  return null;
}

export function tilopayEventType(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fallback;
  }
  const body = payload as Record<string, unknown>;
  const candidate = [body.eventType, body.event_type, body.type].find(
    (value): value is string => typeof value === "string",
  );
  const cleaned = candidate?.trim().replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80);
  return cleaned || fallback;
}
