import { Menu, Search, UserRound } from "lucide-react";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";

const links = [
  ["Inicio", "/"],
  ["Contenido", "/contenido"],
  ["Membresía", "/membresia"],
  ["Presentar denuncia", "/denuncias"],
  ["Anuncios", "/anuncios"],
  ["Sobre mí", "/sobre-mi"],
  ["Contacto", "/contacto"],
] as const;

export async function SiteHeader() {
  const user = await getChatGPTUser();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#ded8ce] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="container-shell flex min-h-[74px] items-center gap-5">
          <a href="/" className="mr-auto flex items-center gap-3" aria-label="RubénWeb, inicio">
            <span className="grid size-10 place-items-center rounded-full bg-[#d84d3d] text-xl font-black text-white shadow-[0_8px_20px_rgba(216,77,61,.22)]">
              R
            </span>
            <span className="leading-none">
              <span className="block text-[1.18rem] font-black tracking-[-0.045em]">
                Rubén<span className="text-[#d84d3d]">Web</span>
              </span>
              <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#6d7789]">
                Información ciudadana
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Navegación principal">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="text-[0.82rem] font-bold text-[#2b3547] hover:text-[#a5342a]">
                {label}
              </a>
            ))}
          </nav>

          <form action="/buscar" className="hidden lg:block">
            <label className="sr-only" htmlFor="header-search">Buscar contenido</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#637087]" size={17} aria-hidden="true" />
              <input id="header-search" name="q" placeholder="Buscar" className="h-10 w-28 rounded-full border border-[#d9d0c5] bg-[#f8f4ee] pl-9 pr-3 text-sm transition-all focus:w-44" />
            </div>
          </form>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <a className="btn-secondary !h-10 !min-h-10 !px-3" href="/mi-cuenta">
                <UserRound size={16} aria-hidden="true" /> Mi cuenta
              </a>
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
                <a key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#fff0e9]">
                  {label}
                </a>
              ))}
              <div className="my-1 h-px bg-[#e0e7f1]" />
              <a href="/mi-cuenta" className="rounded-xl px-4 py-3 text-sm font-bold text-[#a5342a]">
                Mi cuenta
              </a>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
