import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleUserRound,
  Clock3,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";
import type { AuthProviderId } from "@/lib/auth/providers";
import { requireUser } from "@/lib/auth/user";
import { recordAuditEvent } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi cuenta" };

type ComplaintSummary = {
  complaint_id: string;
  status: string;
  tracking_code: string;
  category_name: string;
  created_at: string;
};

const providerNames: Record<AuthProviderId, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

function providerName(provider: AuthProviderId): string {
  return providerNames[provider];
}

const statusLabels: Record<string, string> = {
  received: "Recibida",
  in_review: "En revisión",
  additional_information_requested: "Información adicional solicitada",
  investigating: "En investigación",
  closed: "Cerrada",
  rejected: "Rechazada",
};

export default async function AccountPage() {
  const user = await requireUser("/mi-cuenta");
  const supabase = await createSupabaseServerClient();
  const [complaintsResult, subscriptionResult] = await Promise.all([
    supabase.rpc("my_complaints", { p_limit: 100, p_offset: 0 }),
    supabase.rpc("my_subscription_summary"),
  ]);

  let records = (complaintsResult.data ?? []) as ComplaintSummary[];
  const auditOk = await recordAuditEvent({
    actorId: user.id,
    action: "complaints.list",
    resourceType: "complaint",
    outcome: complaintsResult.error ? "failure" : "success",
    metadata: { returned_count: records.length },
  });
  const databaseReady = !complaintsResult.error && auditOk;
  if (!databaseReady) records = [];
  const membership = subscriptionResult.error ? null : subscriptionResult.data?.[0];

  return (
    <PageShell>
      <main>
        <section id="perfil" className="scroll-mt-24 border-b border-[#dce5f1] bg-white py-12">
          <div className="container-shell flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#eaf2ff] text-[#0759e6]">
                <CircleUserRound size={27} />
              </span>
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-widest text-[#0759e6]">
                  Mi cuenta
                </p>
                <h1 className="mb-0 mt-1 text-2xl font-black">{user.displayName}</h1>
                <p className="mb-0 mt-1 text-sm text-[#69758a]">{user.email}</p>
              </div>
            </div>
            <form action="/auth/sign-out" method="post">
              <input type="hidden" name="return_to" value="/" />
              <button type="submit" className="btn-secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </section>

        <section className="container-shell py-12">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="surface p-6">
              <ShieldCheck className="text-[#0759e6]" />
              <p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">Estado de acceso</p>
              <p className="m-0 text-xl font-black">
                {user.provider ? `Cuenta verificada con ${providerName(user.provider)}` : "Cuenta verificada"}
              </p>
              {user.usesPrivateRelayEmail && (
                <p className="m-0 mt-2 text-xs leading-5 text-[#68758a]">
                  Usas la dirección privada de Apple. Los correos llegan a tu bandeja real.
                </p>
              )}
            </div>
            <div id="membresia" className="surface scroll-mt-24 p-6">
              <CreditCard className="text-[#0759e6]" />
              <p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">Membresía</p>
              <p className="m-0 text-xl font-black">
                {membership?.status === "active" ? "Activa" : "No activa"}
              </p>
              <Link
                href="/membresia"
                className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]"
              >
                Ver membresía <ArrowRight size={15} />
              </Link>
              {membership?.status === "active" && <BillingPortalButton />}
            </div>
            <div className="surface p-6">
              <FileText className="text-[#0759e6]" />
              <p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">
                Información enviada
              </p>
              <p className="m-0 text-xl font-black">{databaseReady ? records.length : "—"}</p>
            </div>
          </div>

          <section id="denuncias" className="mt-9 scroll-mt-24">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="eyebrow">Seguimiento privado</span>
                <h2 className="mt-2 text-2xl font-black">Mis casos</h2>
              </div>
              <Link href="/denuncias" className="btn-primary">
                Nuevo aporte
              </Link>
            </div>
            {!databaseReady ? (
              <div className="surface p-7">
                <h3 className="m-0 font-black">Datos privados no disponibles</h3>
                <p className="section-copy mb-0">
                  El acceso se mantiene cerrado cuando la base de datos, RLS o la auditoría no
                  están disponibles.
                </p>
              </div>
            ) : records.length ? (
              <div className="grid gap-4">
                {records.map((item) => (
                  <article
                    key={item.complaint_id}
                    className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="status-pill">
                        <Clock3 size={14} />
                        {statusLabels[item.status] ?? item.status}
                      </span>
                      <h3 className="mb-1 mt-3 text-lg font-black">{item.category_name}</h3>
                      <p className="m-0 text-xs text-[#6d788a]">
                        Código: {item.tracking_code}
                      </p>
                    </div>
                    <p className="m-0 text-sm text-[#657187]">
                      {new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(
                        new Date(item.created_at),
                      )}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="surface grid min-h-[260px] place-items-center p-8 text-center">
                <div>
                  <FileText className="mx-auto text-[#8aa4cb]" size={32} />
                  <h3 className="mt-4 text-xl font-black">Aún no has enviado información</h3>
                  <p className="section-copy">
                    Cuando el canal sea habilitado, tus casos aparecerán aquí y solo serán
                    visibles desde tu cuenta.
                  </p>
                </div>
              </div>
            )}
          </section>
          <section id="configuracion" className="surface mt-9 scroll-mt-24 p-6">
            <h2 className="text-xl font-black">Configuración</h2>
            <p className="mt-2 text-sm text-[#556377]">Controla tus preferencias de privacidad y el acceso a tu cuenta.</p>
            <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold text-[#a5342a]"><CookiePreferencesButton /><Link href="/mi-cuenta/eliminar">Eliminar cuenta</Link></div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
