import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  ChevronDown,
} from "lucide-react";
import { AdminStatsCards } from "@/components/admin-stats-cards";
import { AdminCharts } from "@/components/admin-charts";
import { AdminComplaintsTable } from "@/components/admin-complaints-table";
import { requireUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | Panel de Administración",
};

export default async function AdminDashboard() {
  const user = await requireUser("/admin");
  const supabase = await createSupabaseServerClient();

  // Verificar permisos
  const { data: profileRoles } = await supabase
    .from("profile_roles")
    .select("role_key")
    .eq("profile_id", user.id);

  const isAdmin = profileRoles?.some((r) => r.role_key === "admin") ?? false;
  const isSuperAdmin = profileRoles?.some((r) => r.role_key === "super_admin") ?? false;

  if (!isAdmin && !isSuperAdmin) {
    redirect("/mi-cuenta");
  }

  // Obtener estadísticas rápidas
  const [
    { count: totalComplaints },
    { count: pendingComplaints },
    { count: inReviewComplaints },
    { count: closedComplaints },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from("complaints").select("*", { count: "exact", head: true }),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "received"),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "in_review"),
    supabase.from("complaints").select("*", { count: "exact", head: true }).in("status", ["closed", "rejected"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#142235]">Panel de Administración</h1>
          <p className="mt-1 text-sm text-[#556377]">
            Vista general de denuncias, usuarios y estadísticas de la plataforma
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 rounded-xl border border-[#ded8ce] bg-white px-4 py-2.5 text-sm font-bold text-[#142235] hover:bg-[#f5f1ea] transition"
          >
            <Filter size={16} /> Ver todas las denuncias
          </Link>
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-2 rounded-xl bg-[#d84d3d] px-4 py-2.5 text-sm font-black text-white shadow hover:bg-[#b74033] transition"
          >
            <Download size={16} /> Exportar Excel
          </Link>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <AdminStatsCards
        stats={{
          totalComplaints: totalComplaints ?? 0,
          pendingComplaints: pendingComplaints ?? 0,
          inReviewComplaints: inReviewComplaints ?? 0,
          closedComplaints: closedComplaints ?? 0,
          totalUsers: totalUsers ?? 0,
        }}
      />

      {/* Gráficos Estadísticos */}
      <AdminCharts />

      {/* Tabla de denuncias recientes */}
      <AdminComplaintsTable />
    </div>
  );
}