import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileSearch, Search } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { searchPublicSite } from "@/lib/public-search";

export const metadata: Metadata = { title: "Investigaciones y videos" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const matches = q ? searchPublicSite(q) : [];
  return <PageShell><main>
    <section className="border-b border-[#ded8ce] bg-[#fffdf9] py-16"><div className="container-shell"><span className="eyebrow"><FileSearch size={16}/> Investigaciones y videos</span><div className="mt-4 grid items-end gap-7 lg:grid-cols-[1fr_430px]"><div><h1 className="headline-display text-[clamp(3rem,6vw,5.5rem)] font-black leading-[.9] tracking-[-.065em]">Información con contexto.</h1><p className="section-copy max-w-2xl text-lg">Las investigaciones, reportajes y videos se publican aquí una vez que el equipo editorial los aprueba.</p></div><form action="/buscar" className="surface flex gap-2 bg-white p-2"><label htmlFor="content-search" className="sr-only">Buscar en la plataforma</label><Search className="ml-2 self-center text-[#b74033]" size={19}/><input id="content-search" name="q" defaultValue={q} placeholder="Pagos, denuncias, videos…" className="min-w-0 flex-1 bg-transparent px-1 outline-none"/><button className="btn-primary" type="submit">Buscar</button></form></div></div></section>
    <section className="container-shell py-14">{q && matches.length ? <div><p className="mb-6 text-sm font-bold text-[#5d6875]">También puede interesarte</p><div className="grid gap-4 md:grid-cols-2">{matches.map((result)=><Link key={result.href} href={result.href} className="surface bg-[#fffdf9] p-6"><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-[#b74033]">{result.category}</p><h2 className="mt-3 text-xl font-black">{result.title}</h2><p className="section-copy text-sm">{result.summary}</p><span className="inline-flex items-center gap-2 text-sm font-black text-[#a5342a]">Abrir <ArrowRight size={16}/></span></Link>)}</div></div> : <div className="grid gap-6 md:grid-cols-[.78fr_1.22fr]"><article className="surface relative min-h-[330px] overflow-hidden bg-[#fffdf9]"><Image src="/media/ruben-rodriguez-oficial.jpeg" alt="Rubén Rodríguez en una publicación oficial" fill sizes="(max-width: 768px) 94vw, 42vw" className="origin-[14%_26%] scale-[2.7] object-cover object-[0%_18%]"/></article><article className="surface flex min-h-[330px] flex-col bg-[#fffdf9] p-8"><p className="m-0 text-xs font-black uppercase tracking-[.14em] text-[#b74033]">Publicación oficial</p><h2 className="headline-display mt-4 text-3xl font-black">Convenio con las Aldeas Infantiles SOS</h2><p className="section-copy">Publicación identificada en la galería oficial de Rubén Rodríguez. La ficha mantiene el enlace a la fuente original para conservar el contexto disponible.</p><a href="https://rubenrodriguezoficial.com/" target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-sm font-black text-[#a5342a]">Abrir fuente original <ArrowRight size={16}/></a></article></div>}</section>
  </main></PageShell>;
}
