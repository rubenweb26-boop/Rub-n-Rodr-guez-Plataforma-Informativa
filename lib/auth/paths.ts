import { authProvider, type AuthProviderId } from "./providers";

export function safeReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    if (url.pathname.startsWith("/auth/")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/**
 * Canonical sign-in link for a provider. Every entry point (header, membership
 * card, account page) must use this so the callback and the rate-limit
 * operation always agree on the provider.
 */
export function signInPath(provider: AuthProviderId, returnTo = "/mi-cuenta"): string {
  const target = safeReturnPath(returnTo);
  return `/auth/sign-in/${provider}?return_to=${encodeURIComponent(target)}`;
}

export function googleSignInPath(returnTo = "/mi-cuenta"): string {
  return signInPath("google", returnTo);
}

export function providerLabel(provider: AuthProviderId): string {
  return authProvider(provider).label;
}
