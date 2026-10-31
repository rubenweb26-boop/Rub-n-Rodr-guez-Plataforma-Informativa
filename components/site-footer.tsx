import Link from "next/link";
import { AtSign, Camera, Mail, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#071a3c] text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.25fr_.8fr_.8fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#1266f1] text-xl font-black">R</span>
            <div>
              <p className="m-0 text-xl font-black tracking-[-0.04em]">RubénWeb</p>
              <p className="m-0 text-[0.63rem] font-bold uppercase tracking-[0.16em] text-[#a9c3ef]">Nombre provisional</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#bdcbe1]">
            Plataforma editorial en desarrollo para información, investigación y participación ciudadana responsable en Costa Rica.
          </p>
          <div className="mt-5 flex gap-2">
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20" href="https://www.facebook.com/share/1FGcVCAAKb/" target="_blank" rel="noreferrer" aria-label="Facebook oficial"><AtSign size={18} /></a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20" href="https://www.instagram.com/rubenrodriguezoficialdog" target="_blank" rel="noreferrer" aria-label="Instagram oficial"><Camera size={18} /></a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20" href="mailto:rr@rubenrodriguezoficial.com" aria-label="Correo electrónico"><Mail size={18} /></a>
            <a className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20" href="https://wa.me/50670150301" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#a9c3ef]">Explorar</h2>
          <div className="grid gap-3 text-sm text-[#e6eefc]">
            <Link href="/contenido">Contenido</Link>
            <Link href="/membresia">Membresía</Link>
            <Link href="/denuncias">Canal de información</Link>
            <Link href="/anuncios">Anuncios y servicios</Link>
            <Link href="/estado-del-proyecto">Estado del proyecto</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#a9c3ef]">Legal y soporte</h2>
          <div className="grid gap-3 text-sm text-[#e6eefc]">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos de uso</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/docs">Documentación del MVP</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col gap-2 py-5 text-xs text-[#a9b9d1] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Rubén Rodríguez. Sitio privado en validación.</span>
          <span>Este canal no sustituye al 9-1-1 ni a las autoridades competentes.</span>
        </div>
      </div>
    </footer>
  );
}
