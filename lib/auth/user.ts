import "server-only";

import { redirect } from "next/navigation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { googleSignInPath } from "./paths";
import { isAuthProviderId, type AuthProviderId } from "./providers";

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** Which OAuth provider authenticated this session, when it is identifiable. */
  provider: AuthProviderId | null;
  /** True when the address is a provider relay that cannot receive mail directly. */
  usesPrivateRelayEmail: boolean;
};

const PRIVATE_RELAY_DOMAINS = [
  "privaterelay.appleid.com",
  "relay.appleid.com",
];

function isPrivateRelayEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain) && PRIVATE_RELAY_DOMAINS.includes(domain);
}

/**
 * Resolves the provider from Supabase's `app_metadata`. Only the auth server
 * can write `app_metadata`, so it is trusted; `user_metadata` is user-editable
 * and is used for display values only.
 */
function resolveProvider(appMetadata: Record<string, unknown>): AuthProviderId | null {
  const candidate = [appMetadata.provider, appMetadata.provider_id].find(
    (value): value is string => typeof value === "string",
  );
  return isAuthProviderId(candidate) ? candidate : null;
}

/**
 * Collects a display name across providers. Apple only returns `name` on the
 * very first authorization, so `full_name` and the email local part are kept as
 * fallbacks instead of showing an empty header.
 */
function resolveDisplayName(
  metadata: Record<string, unknown>,
  email: string,
): string {
  const candidates = [
    metadata.full_name,
    metadata.name,
    [metadata.given_name, metadata.family_name]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" "),
  ];
  const name = candidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return name?.trim() ?? email;
}

function resolveAvatarUrl(metadata: Record<string, unknown>): string | null {
  const avatar = [metadata.avatar_url, metadata.picture, metadata.picture_url].find(
    (value): value is string =>
      typeof value === "string" && value.startsWith("https://"),
  );
  return avatar ?? null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!getSupabasePublicConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const metadata = data.user.user_metadata as Record<string, unknown>;
  const appMetadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;

  return {
    id: data.user.id,
    email: data.user.email,
    displayName: resolveDisplayName(metadata, data.user.email),
    avatarUrl: resolveAvatarUrl(metadata),
    provider: resolveProvider(appMetadata),
    usesPrivateRelayEmail: isPrivateRelayEmail(data.user.email),
  };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(googleSignInPath(returnTo));
}

export async function getAuthenticatorAssuranceLevel(): Promise<"aal1" | "aal2" | null> {
  if (!getSupabasePublicConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return null;
  const level = data.currentLevel;
  if (level === "aal1") return "aal1";
  if (level === "aal2") return "aal2";
  return null;
}
