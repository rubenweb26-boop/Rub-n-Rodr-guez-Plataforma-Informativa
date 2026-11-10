import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FolderOpen,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SplineHeroAnimation } from "@/components/spline-hero-animation";
import { RealCasesShowcase } from "@/components/real-cases-showcase";

const steps = [
  ["1", "Registro Seguro", "Accede a tu cuenta para asegurar la trazabilidad y privacidad de tus datos."],
  ["2", "Información Verificable", "Aporta detalles precisos para facilitar la revisión de tu reporte."],
  ["3", "Envío de Denuncia", "Describe los hechos, selecciona cantón y distrito, y sube pruebas verificables."],
  ["4", "Seguimiento Continuo", "Consulta en tiempo real cada fase del caso sin exponer tu identidad."],
] as const;

export default function Home() {
  return (
    <PageShell>
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#0c1624] text-white">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_70%_15%,#d84d3d_0,transparent_35%),linear-gradient(130deg,#0c1624_0%,#1a2d44_100%)]" />
          <div className="container-shell relative grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
            <div className="max-w-[620px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d84d3d]/30 bg-[#d84d3d]/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#ff9d8e]">
                <span className="size-2 rounded-full bg-[#d84d3d] animate-ping" /> Costa Rica · Plataforma Informativa
              </span>

              <h1 className="headline-display mt-6 text-[clamp(3.2rem,6.5vw,5.8rem)] font-black leading-[0.88] tracking-tight">
                Tu comunidad tiene voz. <br />
                <span className="text-[#ff9d8e]">Presenta tu denuncia.</span>
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-relaxed text-[#c3d1e4] sm:text-lg">
                Canal independiente de Rubén Rodríguez. Un espacio para reportar casos de maltrato animal, criaderos clandestinos y situaciones de interés público en Costa Rica.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/denuncias"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d84d3d] px-7 py-4 text-sm font-black text-white shadow-xl hover:bg-[#b74033] transition"
                >
                  Presentar una denuncia <ArrowRight size={17} />
                </Link>
                <Link
                  href="/membresia"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-black text-white backdrop-blur-sm hover:bg-white/10 transition"
                >
                  Conocer membresías (₡3.500)
                </Link>
              </div>

              <p className="mt-6 text-xs text-[#8ea4be]">
                ⚠️ Este canal no sustituye al 9-1-1 en emergencias de riesgo inminente ni a las autoridades judiciales competentes.
              </p>
            </div>

            {/* Fotografía de Don Rubén con Logo Oficial integrado */}
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/15 bg-[#17273a] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
                <Image
                  src="/media/ruben-retrato-principal.png"
                  alt="Rubén Rodríguez, Presidente de la Federación Canina y Defensor Ciudadano"
                  fill
                  sizes="(max-width: 1024px) 94vw, 520px"
                  priority
                  className="object-cover object-top"
                />
                
                {/* Logo superpuesto en la esquina inferior */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-[#0c1624]/85 p-3.5 backdrop-blur-md flex items-center justify-between">
                  <Image src="/media/ruben-logo-oficial.jpg" alt="Logo oficial completo de Rubén Rodríguez" width={58} height={47} className="h-12 w-auto rounded-md object-contain" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#ff9d8e]">
                    Voz Ciudadana
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pasarela Horizontal Moderna de Casos Reales e Investigaciones */}
        <RealCasesShowcase />

        {/* Cómo funciona */}
        <section className="border-b border-[#ded8ce] bg-[#fbf9f5] py-16">
          <div className="container-shell">
            <div className="max-w-2xl">
              <span className="eyebrow !text-[#b74033]">Ruta de Atención</span>
              <h2 className="headline-display mt-3 text-3xl font-black tracking-tight text-[#142235] sm:text-4xl">
                Un proceso riguroso desde el primer reporte.
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(([n, title, copy]) => (
                <div key={n} className="rounded-2xl border border-[#ded8ce] bg-white p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#d84d3d] text-lg font-black text-white shadow">
                    {n}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-[#142235]">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#556377]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sistema Principal de Denuncias con Animación 3D */}
        <section className="container-shell py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] items-center">
            <div>
              <span className="eyebrow flex items-center gap-1.5 !text-[#b74033]">
                <ShieldCheck size={16} /> Sistema Principal de Denuncias
              </span>
              <h2 className="headline-display mt-4 text-[clamp(2.6rem,5vw,4.4rem)] font-black leading-tight tracking-tight text-[#142235]">
                Reporta con respaldo y trazabilidad oficial.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#556377]">
                El formulario integra el catálogo territorial oficial de Costa Rica (Provincias, Cantones y Distritos), categorización por tipo de hecho, carga segura de evidencias y generación de un identificador único de seguimiento.
              </p>
              
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#ded8ce] bg-[#fffdf9] p-5 shadow-sm">
                  <LockKeyhole className="text-[#d84d3d]" size={24} />
                  <h3 className="mt-3 text-base font-black text-[#142235]">Tratamiento Protegido</h3>
                  <p className="mt-1 text-xs text-[#556377]">
                    Tus datos y pruebas aportadas se custodian conforme a la Ley 8968.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#ded8ce] bg-[#fffdf9] p-5 shadow-sm">
                  <MessageSquareText className="text-[#d84d3d]" size={24} />
                  <h3 className="mt-3 text-base font-black text-[#142235]">Seguimiento Continuo</h3>
                  <p className="mt-1 text-xs text-[#556377]">
                    Monitorea el avance de tu caso mediante tu código o canal de WhatsApp.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/denuncias"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d84d3d] px-7 py-3.5 text-sm font-black text-white shadow-lg hover:bg-[#b74033] transition"
                >
                  Ir al formulario de denuncia <ArrowRight size={17} />
                </Link>
                <Link
                  href="/mi-cuenta"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#ded8ce] bg-white px-6 py-3.5 text-xs font-black text-[#142235] hover:bg-[#f5f1ea] transition"
                >
                  <FolderOpen size={16} /> Consultar mis casos
                </Link>
              </div>
            </div>

            {/* Terminal Spline 3D */}
            <div className="w-full">
              <SplineHeroAnimation />
            </div>
          </div>
        </section>

        {/* Membresías Call To Action */}
        <section className="bg-[#142235] py-20 text-white">
          <div className="container-shell grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <span className="eyebrow flex items-center gap-2 !text-[#ff9d8e]">
                <Sparkles size={16} /> Membresía Oficial
              </span>
              <h2 className="headline-display mt-4 text-[clamp(2.7rem,5vw,4.5rem)] font-black leading-tight tracking-tight">
                Financia la verdad y participa activamente.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#c3d1e4]">
                Elige entre el Plan Ciudadano (para acceso completo a investigaciones y videos) o el Plan Comercial (para presencia de tu negocio en nuestra vitrina).
              </p>
              <div className="mt-8">
                <Link
                  href="/membresia"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d84d3d] px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-[#b74033] transition"
                >
                  Ver planes de membresía <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
              <span className="rounded-full bg-[#d84d3d]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#ff9d8e]">
                Aporte transparente
              </span>
              <p className="mt-4 text-5xl font-black text-white">
                ₡3.500 <span className="text-base font-normal text-slate-300">/ mes</span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[#c3d1e4]">
                Aporte en moneda local que sostiene directamente los rescates en el terreno, peritajes forenses veterinarios y la fiscalización en Costa Rica.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
