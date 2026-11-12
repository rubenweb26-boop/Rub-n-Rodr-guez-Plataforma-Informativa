import "server-only";

import { env } from "cloudflare:workers";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export function getTurnstileSiteKey(): string | null {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(getTurnstileSiteKey() && env.TURNSTILE_SECRET_KEY?.trim());
}

function expectedHostname(request: Request): string | null {
  const configured = env.TURNSTILE_EXPECTED_HOSTNAME?.trim().toLowerCase();
  if (configured) return configured;
  try {
    return new URL(request.url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function verifyTurnstile(
  token: string | null,
  request: Request,
  expectedAction: string,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!isTurnstileConfigured() || !secret || !token || token.length > 2048) return false;
  const hostname = expectedHostname(request);
  if (!hostname) return false;

  const body = new URLSearchParams({ secret, response: token });
  const remoteIp = request.headers.get("cf-connecting-ip");
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    return (
      result.success === true &&
      result.action === expectedAction &&
      result.hostname?.toLowerCase() === hostname
    );
  } catch {
    return false;
  }
}
