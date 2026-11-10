import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { requireSupabasePublicConfig } from "./config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

/** Per-request Supabase client for Server Components and server actions. */
export async function createSupabaseServerClient() {
  const config = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) cookieStore.set(cookie);
        } catch {
          // Server Components cannot always mutate response cookies. The
          // The request proxy refreshes the session and owns that response mutation.
        }
      },
    },
  });
}

/**
 * Route-handler client that accumulates auth-cookie mutations and applies
 * them only to the response actually returned to the browser.
 */
export function createSupabaseRouteClient(request: NextRequest) {
  const config = requireSupabasePublicConfig();
  const pendingCookies: CookieToSet[] = [];
  const client = createServerClient(config.url, config.publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
      },
    },
  });

  return {
    client,
    applyCookies<T extends NextResponse>(response: T): T {
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options);
      }
      return response;
    },
  };
}
