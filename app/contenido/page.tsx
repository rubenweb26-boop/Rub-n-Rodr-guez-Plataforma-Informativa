import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  FileSearch,
  Lock,
  PlayCircle,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getPublishedInvestigations } from "@/lib/data/investigations";

export const metadata: Metadata = {
  title: "Investigaciones y Videos Exclusivos | Rubén Rodríguez",
  description:
    "Casos documentados con fuentes identificables relacionados con Rubén Rodríguez.",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q = "", categoria = "" } = await searchParams;
  const allInvestigations = getPublishedInvestigations();

  const filtered = allInvestigations.filter((inv) => {
    const matchesQuery =
      !q ||
      inv.title.toLowerCase().includes(q.toLowerCase()) ||
      inv.summary.toLowerCase().includes(q.toLowerCase()) ||
      inv.category.toLowerCase().includes(q.toLowerCase());

    const matchesCategory =
      !categoria || inv.category.toLowerCase().includes(categoria.toLowerCase());

    return matchesQuery && matchesCategory;
  });

  const featured = allInvestigations[0];

  return (
    <PageShell>
      <main>
        {/* Editorial Hero Header */}
        <section className="relative overflow-hidden bg-[#142235] py-16 text-white sm:py-20">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_70%_10%,#d84d3d_0,transparent_30%),linear-gradient(120deg,transparent_0%,#1c3755_100%)]" />
          <div className="container-shell relative grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <span className="eyebrow flex items-center gap-2 !text-[#ffb9ae]">
                <FileSearch size={16} /> Periodismo de Investigación y Tutela Ciudadana
              </span>
              <h1 className="headline-display mt-4 text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[.92] tracking-[-.065em]">
                Hechos verificados. <br />
                <span className="text-[#ff9d8e]">Sin censura.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#d8e0e8]">
                Casos documentados mediante fuentes identificables. Cada expediente señala lo que está confirmado y enlaza el reporte original.
              </p>

              {/* Search Bar */}
              <form
                action="/contenido"
                method="GET"
                className="mt-8 flex max-w-lg items-center rounded-lg border border-white/20 bg-white/10 p-1.5 backdrop-blur-md transition focus-within:border-[#ff9d8e]"
              >
                <Search className="ml-3 text-[#ff9d8e]" size={20} />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar en investigaciones y reportajes…"
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-white/60 outline-none"
                />
                <button
                  type="submit"
                  className="btn-primary !border-[#d84d3d] !bg-[#d84d3d] !px-5 !py-2 text-sm"
                >
                  Buscar
                </button>
              </form>
            </div>

            {/* Featured Hero Card */}
            {featured && (
              <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#1b2c42] shadow-2xl">
                <div className="relative aspect-[16/10] w-full bg-[#0d1724]">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#142235] via-[#142235]/40 to-transparent" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span className="rounded bg-[#d84d3d] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                      Investigación Destacada
                    </span>
                    {featured.isPremium && (
                      <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        <Lock size={12} className="text-[#ff9d8e]" /> Exclusivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#ffb9ae]">
                    {featured.category} · {featured.readTime}
                  </p>
                  <h3 className="headline-display mt-2 text-2xl font-black text-white">
                    <Link
                      href={`/contenido/${featured.slug}`}
                      className="hover:text-[#ff9d8e] transition"
                    >
                      {featured.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#c5d3e0]">
                    {featured.summary}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-[#a0b3c6]">Por {featured.author}</span>
                    <Link
                      href={`/contenido/${featured.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-black text-[#ff9d8e] hover:underline"
                    >
                      Leer investigación completa <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category Filters Bar */}
        <section className="border-b border-[#ded8ce] bg-[#fffdf9] py-5">
          <div className="container-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                ["", "Todas las investigaciones"],
                ["Bienestar Animal", "Criaderos y Maltrato"],
                ["Investigación Especial", "Operativos Especiales"],
                ["Auditoría Pública", "Auditorías Municipales"],
                ["Análisis Jurídico", "Legislación y Reformas"],
              ].map(([catVal, catLabel]) => {
                const isActive = categoria === catVal;
                return (
                  <Link
                    key={catVal}
                    href={catVal ? `/contenido?categoria=${encodeURIComponent(catVal)}` : "/contenido"}
                    className={`rounded-full px-4 py-2 transition ${
                      isActive
                        ? "bg-[#142235] text-white"
                        : "bg-[#f2ede4] text-[#142235] hover:bg-[#ded8ce]"
                    }`}
                  >
                    {catLabel}
                  </Link>
                );
              })}
            </div>

            <p className="m-0 text-xs font-bold text-[#5d6875]">
              {filtered.length} {filtered.length === 1 ? "investigación" : "investigaciones"}
            </p>
          </div>
        </section>

        {/* Grid of Investigations */}
        <section className="container-shell py-16">
          {filtered.length === 0 ? (
            <div className="surface grid min-h-[300px] place-items-center bg-[#fffdf9] p-8 text-center">
              <div>
                <ShieldAlert className="mx-auto text-[#d84d3d]" size={40} />
                <h2 className="mt-4 text-2xl font-black">No se encontraron resultados</h2>
                <p className="section-copy mx-auto max-w-md">
                  No hay publicaciones que coincidan con los criterios de búsqueda seleccionados.
                </p>
                <Link href="/contenido" className="btn-secondary mt-5 inline-block">
                  Ver todas las investigaciones
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="surface group flex flex-col overflow-hidden bg-[#fffdf9] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#142235]">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span className="rounded bg-[#142235]/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                        {item.category}
                      </span>
                      {item.isPremium ? (
                        <span className="flex items-center gap-1 rounded bg-[#b74033] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                          <Lock size={11} /> Exclusivo
                        </span>
                      ) : (
                        <span className="rounded bg-[#087f5b] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                          Libre
                        </span>
                      )}
                    </div>

                    {item.videoUrl && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                        <PlayCircle size={14} className="text-[#ff9d8e]" />
                        <span>{item.videoDuration || "Video"}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 text-xs text-[#5d6875]">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {item.readTime}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.publishedAt).toLocaleDateString("es-CR")}</span>
                    </div>

                    <h3 className="headline-display mt-3 text-xl font-black leading-snug text-[#142235] group-hover:text-[#d84d3d] transition">
                      <Link href={`/contenido/${item.slug}`}>{item.title}</Link>
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5d6875]">
                      {item.summary}
                    </p>

                    <div className="mt-auto border-t border-[#ded8ce] pt-4">
                      <Link
                        href={`/contenido/${item.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-black text-[#d84d3d] group-hover:underline"
                      >
                        {item.isPremium ? "Acceder a investigación" : "Leer reportaje"}{" "}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Premium Membership Banner */}
        <section className="border-t border-[#ded8ce] bg-[#eaded1] py-16">
          <div className="container-shell grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <span className="eyebrow flex items-center gap-2 !text-[#b74033]">
                <Sparkles size={16} /> Membresía Ciudadana
              </span>
              <h2 className="headline-display mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Accede a investigaciones completas, videos y expedientes.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#5d6875]">
                Por solo ₡3.500 al mes financias la labor de investigación de campo y obtienes acceso irrestricto a todos los reportajes encubiertos y documentos probatorios.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <Link href="/membresia" className="btn-primary !px-8 !py-3.5 text-base">
                Activar Membresía (₡3.500 / mes) <ArrowRight size={18} />
              </Link>
              <p className="text-xs text-[#5d6875]">
                Renovación automática mensual. Cancela en cualquier momento sin penalizaciones.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
