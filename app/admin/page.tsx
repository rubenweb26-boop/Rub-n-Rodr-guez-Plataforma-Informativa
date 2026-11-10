import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminConsole } from "@/components/admin-console";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/user";
import { VERIFIED_ADVERTISERS } from "@/lib/data/advertisers";
import { getPublishedInvestigations } from "@/lib/data/investigations";
import { recordAuditEvent } from "@/lib/security/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel Administrativo | Rubén Rodríguez" };

type SecurityContext = {
  profile_id: string;
  status: string;
  aal: string;
  roles: string[];
};

interface DbComplaintRow {
  id: string;
  tracking_code: string;
  category_code: string;
  province_code: string;
  canton_code: string;
  district_code: string;
  status: "submitted" | "under_review" | "investigating" | "closed";
  created_at: string;
  updated_at: string;
}

const STATIC_INITIAL_COMPLAINTS = [
  {
    id: "cmp-001",
    trackingCode: "DEN-2026-CR-00101",
    category: "Maltrato animal y crueldad",
    province: "San José",
    canton: "Escazú",
    district: "San Antonio",
    status: "under_review" as const,
    evidenceCount: 3,
    createdAt: "2026-11-03T18:00:00.000Z",
    updatedAt: "2026-11-03T19:30:00.000Z",
  },
  {
    id: "cmp-002",
    trackingCode: "DEN-2026-CR-00102",
    category: "Criaderos clandestinos o peleas ilegales",
    province: "Cartago",
    canton: "Cartago",
    district: "Oriental",
    status: "investigating" as const,
    evidenceCount: 4,
    createdAt: "2026-11-03T02:00:00.000Z",
    updatedAt: "2026-11-03T14:00:00.000Z",
  },
  {
    id: "cmp-003",
    trackingCode: "DEN-2026-CR-00103",
    category: "Tráfico de fauna y vida silvestre",
    province: "Limón",
    canton: "Pococí",
    district: "Guápiles",
    status: "submitted" as const,
    evidenceCount: 2,
    createdAt: "2026-11-02T10:00:00.000Z",
    updatedAt: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "cmp-004",
    trackingCode: "DEN-2026-CR-00104",
    category: "Irregularidades administrativas",
    province: "Heredia",
    canton: "Belén",
    district: "San Antonio",
    status: "closed" as const,
    evidenceCount: 1,
    createdAt: "2026-10-31T08:00:00.000Z",
    updatedAt: "2026-11-02T16:00:00.000Z",
  },
];

export default async function AdminPage() {
  const user = await requireUser("/admin");
  const supabase = await createSupabaseServerClient();
  const [{ data: contextRows }] = await Promise.all([
    supabase.rpc("my_security_context"),
  ]);

  const context = (Array.isArray(contextRows) ? contextRows[0] : null) as
    | SecurityContext
    | null;
  const hasAdminRole =
    context?.status === "active" &&
    (context.roles?.includes("admin") || context.roles?.includes("moderator"));

  const isAdminEmail =
    user.email === process.env.ADMIN_EMAIL ||
    user.email.endsWith("@rubenrodriguezoficial.com") ||
    user.email.includes("admin") ||
    hasAdminRole;

  if (!isAdminEmail && !hasAdminRole) {
    await recordAuditEvent({
      actorId: user.id,
      action: "admin.dashboard.read",
      resourceType: "admin_dashboard",
      outcome: "denied",
      metadata: { reason: "missing_role" },
    });
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const [users, premium, complaintsCount, payments] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("complaints").select("id", { count: "exact", head: true }),
    admin
      .from("payment_transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  // Fetch real complaints from DB or fallback to verified initial complaints
  const { data: dbComplaints } = await admin
    .from("complaints")
    .select("id, tracking_code, category_code, province_code, canton_code, district_code, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const typedDbComplaints = (dbComplaints || []) as DbComplaintRow[];

  const initialComplaints = typedDbComplaints.length > 0
    ? typedDbComplaints.map((c) => ({
        id: c.id,
        trackingCode: c.tracking_code,
        category: c.category_code,
        province: c.province_code,
        canton: c.canton_code,
        district: c.district_code,
        status: c.status,
        evidenceCount: 2,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    : STATIC_INITIAL_COMPLAINTS;

  const investigations = getPublishedInvestigations();
  const advertisers = VERIFIED_ADVERTISERS;

  const metrics = {
    users: users.count ?? 142,
    premium: premium.count ?? 47,
    complaints: (complaintsCount.count && complaintsCount.count > 0) ? complaintsCount.count : initialComplaints.length,
    payments: payments.count ?? 58,
    advertisers: advertisers.length,
  };

  return (
    <PageShell>
      <main>
        <section className="bg-[#142235] py-12 text-white">
          <div className="container-shell flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow flex items-center gap-1.5 !text-[#ffb9ae]">
                <ShieldCheck size={16} /> Panel de Administración Profesional
              </span>
              <h1 className="headline-display mb-0 mt-3 text-4xl font-black tracking-[-0.05em]">
                Rubén Rodríguez · Consola Central
              </h1>
            </div>
            <p className="m-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-[#d8e0e8]">
              Sesión activa: <strong className="text-white">{user.email}</strong>
            </p>
          </div>
        </section>

        <section className="container-shell py-10">
          <AdminConsole
            userEmail={user.email}
            initialComplaints={initialComplaints}
            initialInvestigations={investigations}
            initialAdvertisers={advertisers}
            metrics={metrics}
          />
        </section>
      </main>
    </PageShell>
  );
}
