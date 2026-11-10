import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

/**
 * Next.js 16 request proxy. It refreshes Supabase auth cookies before pages
 * render, while every authorization decision still validates the current user
 * in the route or server component that needs it.
 */
export async function proxy(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) request.cookies.set(cookie);
        response = NextResponse.next({ request });
        for (const cookie of cookiesToSet) response.cookies.set(cookie);
      },
    },
  });

  // getUser validates the JWT with Supabase and refreshes expired sessions.
  // Never authorize a request from getSession() alone.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.svg|media/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
