import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getCurrentUser } from "@/lib/auth/user";
import { getInvestigationBySlug } from "@/lib/data/investigations";
import { checkUserSubscriptionAccess } from "@/lib/payments/onvo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const investigation = getInvestigationBySlug(slug);
  if (!investigation) return { title: "Investigación no encontrada" };

  return {
    title: `${investigation.title} | Rubén Rodríguez`,
    description: investigation.summary,
  };
}

export default async function InvestigationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const investigation = getInvestigationBySlug(slug);

  if (!investigation) {
    notFound();
  }

  const user = await getCurrentUser();
  const subStatus = user
    ? await checkUserSubscriptionAccess(user.id)
    : { hasAccess: false, planCode: null, accessUntil: null };

  const canAccessFullContent = !investigation.isPremium || subStatus.hasAccess;

  return (
    <PageShell>
      <main className="bg-[#fffdf9]">
        {/* Breadcrumb Navigation */}
        <section className="border-b border-[#ded8ce] bg-[#f8f5ef] py-4">
          <div className="container-shell flex items-center justify-between">
            <Link
              href="/contenido"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#142235] hover:text-[#d84d3d] transition"
            >
              <ArrowLeft size={15} /> Volver a todas las investigaciones
            </Link>

            <span className="text-xs font-bold text-[#5d6875]">
              {investigation.category}
            </span>
          </div>
        </section>

        {/* Article Editorial Header */}
        <article className="container-shell py-12 lg:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#142235] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                {investigation.category}
              </span>
              {investigation.isPremium ? (
                <span className="flex items-center gap-1.5 rounded bg-[#b74033] px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <Lock size={12} /> Contenido Exclusivo
                </span>
              ) : (
                <span className="rounded bg-[#087f5b] px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Acceso Público
                </span>
              )}
            </div>

            <h1 className="headline-display mt-5 text-[clamp(2.4rem,5vw,4.4rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#142235]">
              {investigation.title}
            </h1>

            <p className="mt-6 text-xl leading-8 text-[#4a5568]">
              {investigation.summary}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[#ded8ce] py-4 text-xs font-bold text-[#5d6875]">
              <div className="flex items-center gap-4">
                <span>Por <strong className="text-[#142235]">{investigation.author}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {investigation.readTime}
                </span>
                <span>•</span>
                <span>{new Date(investigation.publishedAt).toLocaleDateString("es-CR", { dateStyle: "long" })}</span>
              </div>

              {canAccessFullContent && investigation.isPremium && (
                <span className="flex items-center gap-1 text-[#087f5b]">
                  <ShieldCheck size={16} /> Membresía Activa
                </span>
              )}
            </div>

            {/* Hero Cover Image */}
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#ded8ce] bg-[#142235] shadow-lg">
              <Image
                src={investigation.coverImage}
                alt={investigation.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Key Findings Box */}
            <div className="mt-10 rounded-2xl border border-[#ded8ce] bg-[#f8f5ef] p-6 sm:p-8">
              <h2 className="headline-display flex items-center gap-2 text-xl font-black text-[#142235]">
                <ShieldCheck className="text-[#d84d3d]" size={22} /> Puntos Clave de la Investigación
              </h2>
              <ul className="mt-4 grid gap-3">
                {investigation.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-6 text-[#334155]">
                    <CheckCircle2 className="mt-1 shrink-0 text-[#087f5b]" size={16} />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Player Section (for premium subscribers or free videos) */}
            {canAccessFullContent && investigation.videoUrl && (
              <div className="mt-12">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="headline-display flex items-center gap-2 text-2xl font-black text-[#142235]">
                    <PlayCircle className="text-[#d84d3d]" size={24} /> Reportaje en Video Exclusivo
                  </h2>
                  {investigation.videoDuration && (
                    <span className="text-xs font-bold text-[#5d6875]">
                      Duración: {investigation.videoDuration}
                    </span>
                  )}
                </div>

                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#142235] bg-black shadow-xl">
                  <iframe
                    src={investigation.videoUrl}
                    title={investigation.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              </div>
            )}

            {/* Full Content vs Paywall */}
            {canAccessFullContent ? (
              <div className="prose prose-slate mt-12 max-w-none text-base leading-8 text-[#2d3748]">
                <div
                  className="whitespace-pre-line font-serif text-lg leading-relaxed text-[#2d3748]"
                  dangerouslySetInnerHTML={{
                    __html: investigation.content
                      .replace(/^### (.*$)/gim, '<h3 class="headline-display text-2xl font-black mt-8 mb-4 text-[#142235]">$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2 class="headline-display text-3xl font-black mt-10 mb-5 text-[#142235]">$1</h2>')
                      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-[#d84d3d] pl-4 italic text-[#4a5568] my-6">$1</blockquote>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />

                <div className="mt-12 rounded-xl border border-[#ded8ce] bg-white p-6 shadow-sm">
                  <h3 className="text-base font-black text-[#142235]">Documentos y actas de este caso</h3>
                  <p className="mt-1 text-sm text-[#5d6875]">
                    Expediente legal registrado bajo custodia de la coordinación de investigaciones.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => alert("El expediente original se encuentra certificado en actas con cadena de custodia.")}
                      className="btn-secondary flex items-center gap-2 text-xs"
                    >
                      <Download size={14} /> Descargar Dictamen Forense Preliminar (PDF)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Paywall Card */
              <div className="surface mt-12 overflow-hidden border-2 border-[#d84d3d]/30 bg-[#fffdf9] p-8 shadow-2xl sm:p-12">
                <div className="mx-auto max-w-lg text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#ffefe8] text-[#d84d3d]">
                    <Lock size={30} />
                  </div>

                  <span className="eyebrow mt-5 !text-[#b74033]">
                    Contenido Restringido para Miembros
                  </span>

                  <h3 className="headline-display mt-2 text-3xl font-black text-[#142235]">
                    Desbloquea el reportaje completo y el video en HD
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-[#5d6875]">
                    Esta investigación contiene material encubierto de alto impacto, testimonios protegidos y video documental completo.
                    Apoya el periodismo ciudadano independiente de Rubén Rodríguez con tu suscripción mensual.
                  </p>

                  <div className="mt-6 rounded-xl bg-[#f8f5ef] p-5 text-left text-xs">
                    <p className="m-0 font-black text-[#142235]">Tu membresía de ₡3.500/mes incluye:</p>
                    <ul className="mt-2.5 grid gap-2 pl-0 list-none font-bold text-[#4a5568]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#087f5b]" /> Video completo de 24+ minutos sin cortes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#087f5b]" /> Informes técnicos y actas judiciales probatorias
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#087f5b]" /> Presentación y seguimiento prioritario de denuncias
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <Link
                      href="/membresia"
                      className="btn-primary !w-full justify-center !py-3.5 text-base"
                    >
                      Activar Membresía por ₡3.500 / mes <ArrowRight size={18} />
                    </Link>

                    {!user && (
                      <Link
                        href="/auth/sign-in"
                        className="btn-secondary !w-full justify-center text-xs"
                      >
                        ¿Ya eres miembro? Inicia sesión
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
    </PageShell>
  );
}
