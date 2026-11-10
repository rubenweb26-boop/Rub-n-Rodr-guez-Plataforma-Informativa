import type { NextRequest } from "next/server";
import { startOAuthSignIn } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

/**
 * Legacy Google-only entry point. Kept so existing links and bookmarks keep
 * working; the provider-scoped route is the canonical one.
 */
export async function GET(request: NextRequest) {
  return startOAuthSignIn(request, "google");
}
