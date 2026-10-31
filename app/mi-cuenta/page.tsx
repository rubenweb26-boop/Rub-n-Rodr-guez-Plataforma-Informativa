import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, CircleUserRound, Clock3, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { PageShell } from "@/components/page-shell";
import { getDb } from "@/db";
import { complaints } from "@/db/schema";
import { ensureProfile } from "@/lib/data/profiles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi cuenta" };

const statusLabels: Record<string,string> = { received:"Recibida", in_review:"En revisión", additional_information_requested:"Información adicional solicitada", investigating:"En investigación", closed:"Cerrada", rejected:"Rechazada" };

export default async function AccountPage() {
  const user = await requireChatGPTUser("/mi-cuenta");
  let records: Array<typeof complaints.$inferSelect> = [];
  let databaseReady = true;
  try { const profile = await ensureProfile(user); records = await getDb().select().from(complaints).where(eq(complaints.ownerProfileId, profile.id)).orderBy(desc(complaints.createdAt)); } catch { databaseReady = false; }
  return <PageShell><main><section className="border-b border-[#dce5f1] bg-white py-12"><div className="container-shell flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-[#eaf2ff] text-[#0759e6]"><CircleUserRound size={27}/></span><div><p className="m-0 text-xs font-black uppercase tracking-widest text-[#0759e6]">Mi cuenta</p><h1 className="mb-0 mt-1 text-2xl font-black">{user.displayName}</h1><p className="mb-0 mt-1 text-sm text-[#69758a]">{user.email}</p></div></div><a href={chatGPTSignOutPath("/")} target="_top" className="btn-secondary">Cerrar sesión</a></div></section><section className="container-shell py-12"><div className="grid gap-5 md:grid-cols-3"><div className="surface p-6"><ShieldCheck className="text-[#0759e6]"/><p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">Estado de acceso</p><p className="m-0 text-xl font-black">Cuenta gratuita</p></div><div className="surface p-6"><CreditCard className="text-[#0759e6]"/><p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">Membresía</p><p className="m-0 text-xl font-black">No activa</p><Link href="/membresia" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Ver propuesta <ArrowRight size={15}/></Link></div><div className="surface p-6"><FileText className="text-[#0759e6]"/><p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">Información enviada</p><p className="m-0 text-xl font-black">{databaseReady ? records.length : "—"}</p></div></div><section className="mt-9"><div className="mb-5 flex items-center justify-between"><div><span className="eyebrow">Seguimiento privado</span><h2 className="mt-2 text-2xl font-black">Mis casos</h2></div><Link href="/denuncias" className="btn-primary">Nuevo aporte</Link></div>{!databaseReady ? <div className="surface p-7"><h3 className="m-0 font-black">Base de datos en preparación</h3><p className="section-copy mb-0">Las migraciones se aplicarán en el despliegue. No se usa almacenamiento del navegador como fuente de verdad.</p></div> : records.length ? <div className="grid gap-4">{records.map(item=><article key={item.id} className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><span className="status-pill"><Clock3 size={14}/>{statusLabels[item.status] ?? item.status}</span><h3 className="mb-1 mt-3 text-lg font-black">{item.title}</h3><p className="m-0 text-xs text-[#6d788a]">Código: {item.trackingCode}</p></div><p className="m-0 text-sm text-[#657187]">{new Intl.DateTimeFormat("es-CR",{dateStyle:"medium"}).format(item.createdAt)}</p></article>)}</div> : <div className="surface grid min-h-[260px] place-items-center p-8 text-center"><div><FileText className="mx-auto text-[#8aa4cb]" size={32}/><h3 className="mt-4 text-xl font-black">Aún no has enviado información</h3><p className="section-copy">Cuando el canal sea habilitado, tus casos aparecerán aquí y solo serán visibles desde tu cuenta.</p></div></div>}</section></section></main></PageShell>;
}
