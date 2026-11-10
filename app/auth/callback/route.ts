import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/paths";
import { isAuthProviderId } from "@/lib/auth/providers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function errorRedirect(request: NextRequest, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth/error?code=${code}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!getSupabasePublicConfig()) {
    return errorRedirect(request, "not_configured");
  }

  const params = request.nextUrl.searchParams;

  // A provider can refuse the request (user cancels, Apple hides the email and
  // the scope was rejected, Facebook denies the app). Surface that distinctly
  // instead of reporting a generic exchange failure.
  if (params.get("error")) {
    return errorRedirect(request, "provider_denied");
  }

  const code = params.get("code");
  const returnTo = safeReturnPath(params.get("return_to"));
  const provider = params.get("provider");
  const state = isAuthProviderId(provider) ? params.get("state") : null;

  if (!code || code.length > 2048) {
    return errorRedirect(request, "invalid_callback");
  }

  const routeClient = createSupabaseRouteClient(request);
  const { error } = await routeClient.client.auth.exchangeCodeForSession(code);
  if (error) {
    return errorRedirect(request, "exchange_failed");
  }

  // `state` is optional and provider-defined; it is only used to keep the
  // redirect target distinguishable in logs. It never influences access.
  void state;

  return routeClient.applyCookies(NextResponse.redirect(new URL(returnTo, request.url)));
}
