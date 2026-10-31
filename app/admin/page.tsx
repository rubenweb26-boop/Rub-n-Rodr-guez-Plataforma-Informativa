import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { count, eq } from "drizzle-orm";
import { AlertTriangle, BadgeDollarSign, FileSearch, Megaphone, Settings, ShieldCheck, Users } from "lucide-react";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { PageShell } from "@/components/page-shell";
import { getDb } from "@/db";
import { advertisements, complaints, paymentTransactions, profiles, subscriptions } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración" };

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowlist = (env.ADMIN_EMAILS ?? "").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if (!allowlist.includes(user.email.toLowerCase())) return <PageShell><main className="container-shell py-16"><div className="surface mx-auto max-w-2xl p-8 text-center"><AlertTriangle className="mx-auto text-[#9a6700]" size={35}/><h1 className="mt-5 text-2xl font-black">Acceso administrativo no configurado</h1><p className="section-copy">Tu sesión es válida, pero el correo no está en la variable segura <code>ADMIN_EMAILS</code>. No se asignan privilegios por estar autenticado.</p></div></main></PageShell>;

  let metrics = { users:0, premium:0, complaints:0, payments:0, ads:0 };
  let databaseReady = true;
  try {
    const db = getDb();
    const [usersResult,premiumResult,complaintsResult,paymentsResult,adsResult] = await Promise.all([
      db.select({value:count()}).from(profiles), db.select({value:count()}).from(subscriptions).where(eq(subscriptions.status,"active")), db.select({value:count()}).from(complaints), db.select({value:count()}).from(paymentTransactions).where(eq(paymentTransactions.status,"approved")), db.select({value:count()}).from(advertisements),
    ]);
    metrics = { users:usersResult[0].value, premium:premiumResult[0].value, complaints:complaintsResult[0].value, payments:paymentsResult[0].value, ads:adsResult[0].value };
  } catch { databaseReady = false; }

  const cards = [[Users,"Usuarios",metrics.users],[ShieldCheck,"Premium activos",metrics.premium],[FileSearch,"Casos recibidos",metrics.complaints],[BadgeDollarSign,"Pagos aprobados",metrics.payments],[Megaphone,"Anuncios",metrics.ads]] as const;
  return <PageShell><main><section className="bg-[#071a3c] py-12 text-white"><div className="container-shell flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="eyebrow !text-[#8eb6ff]">Panel privado</span><h1 className="mb-0 mt-3 text-4xl font-black tracking-[-0.05em]">Administración</h1></div><p className="m-0 text-sm text-[#c6d4e9]">Sesión: {user.email}</p></div></section><section className="container-shell py-10">{!databaseReady && <div className="mb-6 flex gap-3 rounded-xl border border-[#f0d99e] bg-[#fff9e9] p-4 text-sm text-[#6d5313]"><AlertTriangle size={18}/><span>La base de datos todavía no está disponible en este entorno.</span></div>}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([Icon,label,value])=><div key={label} className="surface p-5"><Icon className="text-[#0759e6]" size={23}/><p className="mb-1 mt-4 text-sm font-bold text-[#68758a]">{label}</p><p className="m-0 text-3xl font-black">{databaseReady?value:"—"}</p></div>)}</div><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[[FileSearch,"Denuncias","Filtrar, asignar, solicitar información y registrar cada cambio de estado."],[BadgeDollarSign,"Finanzas","Conciliar eventos confirmados; nunca activar premium desde el navegador."],[Megaphone,"Publicidad","Revisar anunciantes, aprobar piezas y controlar vencimientos."],[Users,"Usuarios","Consultar cuentas, roles y actividad sin exponer datos innecesarios."],[ShieldCheck,"Contenido","Gestionar publicaciones y acceso premium en el servidor."],[Settings,"Configuración","Precios, moneda, integraciones y feature flags desde entorno seguro."]].map(([Icon,title,copy])=>{const I=Icon as typeof Settings;return <article key={title as string} className="surface p-6"><I className="text-[#0759e6]"/><h2 className="mt-4 text-lg font-black">{title as string}</h2><p className="m-0 text-sm leading-6 text-[#657187]">{copy as string}</p></article>})}</div></section></main></PageShell>;
}
