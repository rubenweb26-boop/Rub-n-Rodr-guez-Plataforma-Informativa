/**
 * OAuth providers offered to visitors. Supabase Auth performs the exchange; this
 * module only decides which buttons exist and how each one is presented.
 *
 * Supabase identifies Apple as "apple" and Facebook as "facebook". Keeping the
 * list in one place stops a provider from being enabled in the UI while the
 * callback route still assumes Google.
 */
export const authProviders = ["google", "apple", "facebook"] as const;

export type AuthProviderId = (typeof authProviders)[number];

export type AuthProviderDefinition = {
  id: AuthProviderId;
  label: string;
  /** Provider-specific OAuth query parameters. Never includes a secret. */
  queryParams: Record<string, string>;
  /** Whether this provider can hide the user's real email address. */
  mayUsePrivateEmail: boolean;
};

export function isAuthProviderId(value: unknown): value is AuthProviderId {
  return (
    typeof value === "string" &&
    (authProviders as readonly string[]).includes(value)
  );
}

const definitions: Record<AuthProviderId, AuthProviderDefinition> = {
  google: {
    id: "google",
    label: "Continuar con Google",
    // `select_account` avoids silently reusing a previously chosen account.
    // `access_type: "offline"` is intentionally absent: this app never calls
    // Google APIs on the visitor's behalf, so requesting a refresh token would
    // collect a credential we do not need.
    queryParams: { prompt: "select_account" },
    mayUsePrivateEmail: false,
  },
  apple: {
    id: "apple",
    label: "Continuar con Apple",
    // Apple only returns the full name on the very first authorization, so the
    // profile name must also come from Supabase metadata later. No extra query
    // parameters are supported for Apple in Supabase Auth.
    queryParams: {},
    // Hide My Email produces a @privaterelay.appleid.com address that is still
    // a valid, deliverable identifier for this account.
    mayUsePrivateEmail: true,
  },
  facebook: {
    id: "facebook",
    label: "Continuar con Facebook",
    // `reauthenticate` forces credential entry instead of reusing a live
    // Facebook session on a shared device.
    queryParams: { auth_type: "reauthenticate" },
    mayUsePrivateEmail: false,
  },
};

export function authProvider(id: AuthProviderId): AuthProviderDefinition {
  return definitions[id];
}

export function authProviderSignInPath(
  id: AuthProviderId,
  returnTo: string,
  safeReturnPath: (value: string | null | undefined) => string,
): string {
  const target = safeReturnPath(returnTo);
  return `/auth/sign-in/${id}?return_to=${encodeURIComponent(target)}`;
}
