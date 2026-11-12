import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminAuthGuard } from "./admin-auth-guard";
import { OfflineStatusIndicator } from "@/components/offline-status";

export const metadata: Metadata = {
  title: "Panel de Administración | Rubén Rodríguez – Plataforma Informativa",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/admin");
  const supabase = await createSupabaseServerClient();

  // Verificar si es admin o super admin
  const { data: profileRoles } = await supabase
    .from("profile_roles")
    .select("role_key")
    .eq("profile_id", user.id);

  const isAdmin = profileRoles?.some((r) => r.role_key === "admin") ?? false;
  const isSuperAdmin = profileRoles?.some((r) => r.role_key === "super_admin") ?? false;

  if (!isAdmin && !isSuperAdmin) {
    redirect("/mi-cuenta");
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef]">
      <header className="border-b border-[#ded8ce] bg-white sticky top-0 z-40">
        <div className="container-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#d84d3d] text-white font-black text-lg">
                RR
              </span>
              <span className="hidden sm:block font-black text-[#142235]">Admin Panel</span>
            </Link>
            <span className="hidden md:block h-6 w-px bg-[#ded8ce]" />
            <span className="text-xs font-medium text-[#556377]">
              {isSuperAdmin ? "Super Admin" : "Administrador"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <OfflineStatusIndicator />
            <Link href="/mi-cuenta" className="text-xs font-semibold text-[#556377] hover:text-[#d84d3d]">
              Mi Cuenta
            </Link>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="text-xs font-semibold text-[#556377] hover:text-[#d84d3d]">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-shell py-8">
        <AdminAuthGuard isSuperAdmin={isSuperAdmin}>
          {children}
        </AdminAuthGuard>
      </main>
    </div>
  );
}