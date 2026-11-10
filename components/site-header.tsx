import { getCurrentUser } from "@/lib/auth/user";
import { SiteHeaderClient } from "./site-header-client";
import { getAvailableAuthProviders } from "@/lib/auth/available-providers";

/** Server Component: obtiene el usuario y pasa datos al Client Component */
export async function SiteHeader() {
  const [user, availableProviders] = await Promise.all([getCurrentUser(), getAvailableAuthProviders()]);
  return (
    <SiteHeaderClient
      userDisplayName={user?.displayName ?? null}
      userAvatarUrl={user?.avatarUrl ?? null}
      availableProviders={availableProviders}
    />
  );
}
