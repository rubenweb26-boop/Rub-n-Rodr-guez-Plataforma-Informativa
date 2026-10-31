import Link from "next/link";
import { Menu, Search, ShieldCheck, UserRound } from "lucide-react";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";

const links = [
  ["Inicio", "/"],
  ["Contenido", "/contenido"],
  ["Membresía", "/membresia"],
  ["Denuncias", "/denuncias"],
  ["Anuncios", "/anuncios"],
  ["Sobre mí", "/sobre-mi"],
  ["Contacto", "/contacto"],
] as const;

export async function SiteHeader() {
  const user = await getChatGPTUser();

  return (
    <>
      <div className="border-b border-[#d7e2f2] bg-[#071a3c] text-white">
        <div className="container-shell flex min-h-9 items-center justify-between gap-4 py-2 text-[0.72rem] font-bold tracking-wide">
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} aria-hidden="true" />
            MVP privado · datos reales sensibles aún no habilitados
          </span>
          <Link className="hidden text-[#bcd2ff] hover:text-white sm:inline" href="/estado-del-proyecto">
            Ver estado de integraciones
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-[#dce5f1] bg-white/95 backdrop-blur-xl">
        <div className="container-shell flex min-h-[74px] items-center gap-5">
          <Link href="/" className="mr-auto flex items-center gap-3" aria-label="RubénWeb, inicio">
            <span className="grid size-10 place-items-center rounded-[13px] bg-[#0759e6] text-xl font-black text-white shadow-[0_8px_20px_rgba(7,89,230,.22)]">
              R
            </span>
            <span className="leading-none">
              <span className="block text-[1.18rem] font-black tracking-[-0.045em]">
                Rubén<span className="text-[#0759e6]">Web</span>
              </span>
              <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#6d7789]">
                Información con propósito
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Navegación principal">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="text-[0.82rem] font-bold text-[#2b3547] hover:text-[#0759e6]">
                {label}
              </Link>
            ))}
          </nav>

          <form action="/contenido" className="hidden lg:block">
            <label className="sr-only" htmlFor="header-search">Buscar contenido</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#637087]" size={17} aria-hidden="true" />
              <input id="header-search" name="q" placeholder="Buscar" className="h-10 w-28 rounded-xl border border-[#d4dfed] bg-[#f7f9fc] pl-9 pr-3 text-sm transition-all focus:w-44" />
            </div>
          </form>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link className="btn-secondary !h-10 !min-h-10 !px-3" href="/mi-cuenta">
                <UserRound size={16} aria-hidden="true" /> Mi cuenta
              </Link>
              <a className="btn-primary !h-10 !min-h-10 !px-3" href={chatGPTSignOutPath("/")} target="_top">
                Salir
              </a>
            </div>
          ) : (
            <span className="hidden md:inline-flex">
              <a className="btn-primary !h-10 !min-h-10" href={chatGPTSignInPath("/mi-cuenta")} target="_top">
                Iniciar sesión
              </a>
            </span>
          )}

          <details className="relative xl:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-[#d4dfed] bg-white" aria-label="Abrir menú">
              <Menu size={21} aria-hidden="true" />
            </summary>
            <div className="absolute right-0 mt-3 grid w-[min(320px,calc(100vw-24px))] gap-1 rounded-2xl border border-[#d4dfed] bg-white p-3 shadow-2xl">
              {links.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#eef4ff]">
                  {label}
                </Link>
              ))}
              <div className="my-1 h-px bg-[#e0e7f1]" />
              <Link href="/mi-cuenta" className="rounded-xl px-4 py-3 text-sm font-bold text-[#0759e6]">
                Mi cuenta
              </Link>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
