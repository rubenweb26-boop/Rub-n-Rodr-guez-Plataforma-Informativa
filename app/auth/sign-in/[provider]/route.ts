import { NextResponse, type NextRequest } from "next/server";
import { startOAuthSignIn } from "@/lib/auth/oauth";
import { isAuthProviderId } from "@/lib/auth/providers";

export const dynamic = "force-dynamic";

const SUPPORTED_PROVIDERS = ["google", "apple", "facebook"] as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isAuthProviderId(provider)) {
    return NextResponse.redirect(new URL("/auth/error?code=unsupported_provider", request.url));
  }
  return startOAuthSignIn(request, provider);
}

export function generateStaticParams() {
  return SUPPORTED_PROVIDERS.map((provider) => ({ provider }));
}
