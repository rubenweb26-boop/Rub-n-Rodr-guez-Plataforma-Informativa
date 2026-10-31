import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CheckCircle2, LockKeyhole, RefreshCcw } from "lucide-react";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Membresía" };

export default function MembershipPage() {
  return (
    <PageShell>
      <main>
        <section className="bg-[#071a3c] py-20 text-white"><div className="container-shell text-center"><span className="eyebrow !text-[#8eb6ff]"><BadgeDollarSign size={16} /> Membresía</span><h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5.6rem)] font-black leading-[.94] tracking-[-0.065em]">Apoya el trabajo. Accede a más contexto.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-[#c6d4e9]">Una propuesta simple y transparente, aún sin cobros activos.</p></div></section>
        <section className="container-shell grid items-start gap-10 py-16 lg:grid-cols-[1fr_470px]">
          <div><span className="eyebrow">Qué incluye</span><h2 className="section-title mt-4">Un solo plan, sin letra pequeña.</h2><div className="mt-8 grid gap-4 sm:grid-cols-2">{[
            [CheckCircle2,"Contenido completo","Videos, entrevistas y archivo premium cuando el streaming esté habilitado."],
            [LockKeyhole,"Seguimiento privado","Consulta únicamente tus propios aportes y solicitudes de información."],
            [RefreshCcw,"Gestión clara","Historial, renovación y cancelación desde tu cuenta una vez activada la pasarela."],
            [BadgeDollarSign,"Precio configurable","El administrador define una moneda y un precio; no se asume equivalencia."],
          ].map(([Icon,title,copy]) => { const I = Icon as typeof CheckCircle2; return <div key={title as string} className="surface p-6"><I className="text-[#0759e6]" size={24} /><h3 className="mb-1 mt-4 text-lg font-black">{title as string}</h3><p className="m-0 text-sm leading-6 text-[#667287]">{copy as string}</p></div> })}</div><div className="mt-8 rounded-2xl border border-[#eed89f] bg-[#fff9e9] p-5 text-sm leading-6 text-[#6f5511]"><strong>Importante:</strong> la membresía no sustituye canales públicos para denunciar delitos o emergencias. Este es un canal editorial privado y sujeto a revisión.</div></div>
          <CurrencySwitcher />
        </section>
        <section className="container-shell pb-10"><div className="surface flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="m-0 text-xl font-black">¿Quieres revisar el estado de pagos?</h2><p className="mb-0 mt-2 text-sm text-[#667287]">Consulta proveedor recomendado, pruebas pendientes y credenciales requeridas.</p></div><Link href="/estado-del-proyecto" className="btn-primary">Estado técnico <ArrowRight size={17} /></Link></div></section>
      </main>
    </PageShell>
  );
}
