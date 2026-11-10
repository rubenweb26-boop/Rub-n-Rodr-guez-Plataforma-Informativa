import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { searchPublicSite } from "@/lib/public-search";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const safeQuery = q.slice(0, 120);
  const results = searchPublicSite(safeQuery);
  return <PageShell><main><section className="bg-[#142235] py-16 text-white"><div className="container-shell max-w-4xl"><span className="eyebrow !text-[#ffb9ae]">Buscar en RubénWeb</span><h1 className="headline-display mt-4 text-5xl font-black tracking-[-.06em]">Encuentra lo que necesitas.</h1><form action="/buscar" className="mt-7 flex rounded-full bg-white p-2 text-[#142235]"><Search className="ml-3 self-center text-[#a5342a]" size={20}/><label className="sr-only" htmlFor="site-search">Buscar</label><input id="site-search" name="q" maxLength={120} defaultValue={safeQuery} placeholder="Ej.: pagos, denuncias, videos o publicidad" className="min-w-0 flex-1 bg-transparent px-3 outline-none"/><button className="btn-primary" type="submit">Buscar</button></form></div></section><section className="container-shell py-14"><p className="text-sm font-bold text-[#5d6875]">{safeQuery ? `Resultados para “${safeQuery}”` : "Explora los servicios de la plataforma"}</p>{results.length ? <div className="grid gap-4 md:grid-cols-2">{results.map((result)=><Link key={result.href} href={result.href} className="surface bg-[#fffdf9] p-6 transition-transform hover:-translate-y-1"><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-[#b74033]">{result.category}</p><h2 className="mt-3 text-2xl font-black">{result.title}</h2><p className="section-copy text-sm">{result.summary}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#a5342a]">Ir a la sección <ArrowRight size={16}/></span></Link>)}</div> : <div className="surface bg-[#fffdf9] p-8"><h2 className="m-0 text-2xl font-black">No encontramos una coincidencia exacta.</h2><p className="section-copy">Prueba con “membresía”, “denuncias”, “videos”, “anuncios” o “contacto”.</p></div>}</section></main></PageShell>;
}
