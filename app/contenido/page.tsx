import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CirclePlay, FileSearch, Search, Sparkles } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Contenido" };

const entries = [
  {
    title: "Investigaciones de interés público",
    summary: "Área editorial preparada para reportajes con fuentes, fechas y estado de revisión visibles.",
    category: "Investigación",
    type: "investigacion",
    image: "/media/investigacion-card-hd.png",
    href: "/estado-del-proyecto",
    state: "En preparación",
  },
  {
    title: "Archivo documental",
    summary: "Colección en preparación para materiales autorizados, contrastados y debidamente contextualizados.",
    category: "Archivo editorial",
    type: "investigacion",
    image: "/media/investigacion-hero-hd.png",
    href: "/estado-del-proyecto",
    state: "En preparación",
  },
  {
    title: "Entrevistas y reportajes en video",
    summary: "La reproducción premium se habilitará con un proveedor de streaming privado.",
    category: "Video",
    type: "video",
    image: "/media/investigacion-card-hd.png",
    href: "/estado-del-proyecto",
    state: "Próximamente",
  },
];

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const type = (params.tipo ?? "").trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    const matchesQuery = !query || `${entry.title} ${entry.summary} ${entry.category}`.toLowerCase().includes(query);
    const matchesType = !type || entry.type === type;
    return matchesQuery && matchesType;
  });

  return (
    <PageShell>
      <main>
        <section className="border-b border-[#dce5f1] bg-white py-16">
          <div className="container-shell">
            <span className="eyebrow"><FileSearch size={16} /> Centro de contenido</span>
            <div className="mt-4 grid items-end gap-7 lg:grid-cols-[1fr_430px]">
              <div><h1 className="section-title !text-[clamp(2.4rem,6vw,5rem)]">Información con contexto.</h1><p className="section-copy max-w-2xl text-lg">Noticias verificadas, investigaciones, entrevistas y avances públicos. El contenido pendiente aparece identificado y no se presenta como publicado.</p></div>
              <form action="/contenido" className="surface flex gap-2 p-2">
                <label htmlFor="content-search" className="sr-only">Buscar contenido</label>
                <Search className="ml-2 self-center text-[#647188]" size={19} />
                <input id="content-search" name="q" defaultValue={params.q} placeholder="Tema, categoría o palabra clave" className="min-w-0 flex-1 bg-transparent px-1 outline-none" />
                <button className="btn-primary" type="submit">Buscar</button>
              </form>
            </div>
          </div>
        </section>

        <section className="container-shell py-12">
          <div className="mb-8 flex flex-wrap gap-2">
            {[['Todo',''],['Noticias','noticia'],['Investigaciones','investigacion'],['Videos','video']].map(([label,value]) => <Link key={label} href={`/contenido${value ? `?tipo=${value}` : ''}`} className={`rounded-full border px-4 py-2 text-sm font-black ${type === value || (!type && !value) ? 'border-[#0759e6] bg-[#0759e6] text-white' : 'border-[#cbd7e6] bg-white text-[#526076]'}`}>{label}</Link>)}
          </div>
          {filtered.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((entry) => (
                <article key={entry.title} className="surface overflow-hidden">
                  <div className="relative"><Image src={entry.image} alt="" width={760} height={440} className="aspect-[16/10] w-full object-cover" /><span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#0759e6] shadow-sm">{entry.state}</span></div>
                  <div className="p-6"><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-[#0759e6]">{entry.category}</p><h2 className="mt-3 text-xl font-black leading-tight tracking-[-0.035em]">{entry.title}</h2><p className="section-copy text-sm">{entry.summary}</p>{entry.href.startsWith('http') ? <a href={entry.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Abrir fuente <ArrowRight size={16} /></a> : <Link href={entry.href} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#0759e6]">Ver estado <ArrowRight size={16} /></Link>}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface grid min-h-[330px] place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-[#0759e6]" size={34} /><h2 className="mt-4 text-2xl font-black">No encontramos resultados</h2><p className="section-copy">Prueba otra palabra o limpia los filtros.</p><Link href="/contenido" className="btn-secondary mt-3">Ver todo el contenido</Link></div></div>
          )}
          <div className="mt-10 rounded-2xl bg-[#071a3c] p-7 text-white sm:flex sm:items-center sm:justify-between"><div className="flex gap-4"><CirclePlay className="mt-1 shrink-0 text-[#8eb6ff]" /><div><h2 className="m-0 text-xl font-black">Streaming privado pendiente</h2><p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-[#c9d7eb]">No se publican URLs ocultas en el navegador. El video premium se habilitará solo con permisos temporales emitidos por el backend.</p></div></div><Link href="/estado-del-proyecto" className="btn-secondary mt-5 sm:mt-0">Ver decisión técnica</Link></div>
        </section>
      </main>
    </PageShell>
  );
}
