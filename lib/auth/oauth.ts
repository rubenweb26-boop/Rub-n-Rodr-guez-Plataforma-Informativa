import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { safeReturnPath } from "./paths";
import { authProvider, type AuthProviderId } from "./providers";

function errorRedirect(request: NextRequest, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth/error?code=${code}`, request.url));
}

/**
 * Single OAuth entry point. Routes under /auth/sign-in/<provider> delegate here
 * so no provider can bypass the origin-independent safety checks below.
 *
 * The browser never receives a provider secret: it is redirected to the URL
 * Supabase returns, and the authorization code is exchanged server-side in
 * /auth/callback.
 */
export async function startOAuthSignIn(
  request: NextRequest,
  provider: AuthProviderId,
): Promise<NextResponse> {
  if (!getSupabasePublicConfig()) {
    return errorRedirect(request, "not_configured");
  }

  const rateLimit = await checkRateLimit(request, {
    operation: `auth.${provider}.start`,
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.configured || !rateLimit.allowed) {
    return errorRedirect(request, "rate_limited");
  }

  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("return_to"));
  const callback = new URL("/auth/callback", request.url);
  callback.searchParams.set("return_to", returnTo);
  // Remember which provider started the flow so the callback can report a
  // provider-specific failure without trusting anything else from the browser.
  callback.searchParams.set("provider", provider);

  const routeClient = createSupabaseRouteClient(request);
  const definition = authProvider(provider);
  const { data, error } = await routeClient.client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callback.toString(),
      ...(Object.keys(definition.queryParams).length
        ? { queryParams: definition.queryParams }
        : {}),
    },
  });

  if (error || !data.url) {
    return errorRedirect(request, "oauth_start_failed");
  }

  return routeClient.applyCookies(NextResponse.redirect(data.url));
}
