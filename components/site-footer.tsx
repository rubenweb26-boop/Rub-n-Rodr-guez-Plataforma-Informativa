import Link from "next/link";
import { Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#142235] text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.25fr_.8fr_.8fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#1266f1] text-xl font-black">R</span>
            <div>
              <p className="m-0 text-xl font-black tracking-[-0.04em]">RubénWeb</p>
              <p className="m-0 text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#e7b0a8]">Información ciudadana</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#bdcbe1]">
            Un espacio para compartir información de interés público, conocer investigaciones y dar seguimiento privado a tus aportes.
          </p>
          <div className="mt-5 flex gap-2">
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 text-sm font-black hover:bg-white/20" href="https://www.facebook.com/share/1FGcVCAAKb/" target="_blank" rel="noreferrer" aria-label="Facebook oficial">f</a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 text-xs font-black hover:bg-white/20" href="https://www.instagram.com/rubenrodriguezoficialdog" target="_blank" rel="noreferrer" aria-label="Instagram oficial">◎</a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20" href="mailto:rr@rubenrodriguezoficial.com" aria-label="Correo electrónico"><Mail size={18} /></a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 text-xs font-black hover:bg-white/20" href="https://wa.me/50670150301" target="_blank" rel="noreferrer" aria-label="WhatsApp">WA</a>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#a9c3ef]">Explorar</h2>
          <div className="grid gap-3 text-sm text-[#e6eefc]">
            <Link href="/contenido">Contenido</Link>
            <Link href="/membresia">Membresía</Link>
            <Link href="/denuncias">Presentar denuncia</Link>
            <Link href="/anuncios">Anuncios y servicios</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#a9c3ef]">Legal y soporte</h2>
          <div className="grid gap-3 text-sm text-[#e6eefc]">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos de uso</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col gap-2 py-5 text-xs text-[#a9b9d1] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Rubén Rodríguez.</span>
          <span>Este canal no sustituye al 9-1-1 ni a las autoridades competentes.</span>
        </div>
      </div>
    </footer>
  );
}
