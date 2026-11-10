import type { Metadata } from "next";
import { BookOpen, Database, KeyRound, ShieldCheck, TestTube2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Documentación del MVP" };

export default function DocsPage(){return <PageShell><main><section className="bg-[#071a3c] py-20 text-white"><div className="container-shell"><span className="eyebrow !text-[#8eb6ff]"><BookOpen size={16}/> Documentación</span><h1 className="mt-4 max-w-4xl text-[clamp(2.6rem,7vw,5.4rem)] font-black leading-[.94] tracking-[-0.065em]">Una base que se puede operar y auditar.</h1></div></section><section className="container-shell grid gap-5 py-14 md:grid-cols-2">{[
  [Database,"Arquitectura","Vinext sobre Workers con Supabase Postgres/Storage, RLS forzado y migraciones versionadas."],
  [KeyRound,"Identidad","Google OAuth mediante Supabase Auth, sesiones SSR protegidas y MFA obligatorio para roles administrativos."],
  [ShieldCheck,"Seguridad","Autorización server-side, propiedad por user ID estable, archivos privados, eventos de pago idempotentes, auditoría y secretos fuera del código."],
  [TestTube2,"Pruebas","Compilación, rutas, validación, aislamiento de usuario, cargas, webhooks falsos/duplicados y verificación visual responsive."],
].map(([Icon,title,copy])=>{const I=Icon as typeof Database;return <article key={title as string} className="surface p-7"><I className="text-[#0759e6]" size={27}/><h2 className="mt-5 text-xl font-black">{title as string}</h2><p className="section-copy text-sm">{copy as string}</p></article>})}</section><section className="container-shell pb-12"><div className="surface p-7"><h2 className="m-0 text-xl font-black">Archivos entregados con el código</h2><p className="section-copy">El repositorio incluye manual de administración, arquitectura, seguridad, despliegue, respaldos y registro de pruebas bajo la carpeta <code className="rounded bg-[#edf2f8] px-1.5 py-1">docs/</code>, además de <code className="rounded bg-[#edf2f8] px-1.5 py-1">.env.example</code> sin secretos.</p></div></section></main></PageShell>}
