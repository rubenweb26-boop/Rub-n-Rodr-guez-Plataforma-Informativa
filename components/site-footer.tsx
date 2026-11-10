import Image from "next/image";
import Link from "next/link";
import { CookiePreferencesButton } from "./cookie-preferences-button";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1e3450] bg-[#0c1624] text-white">
      {/* Main Footer Container */}
      <div className="container-shell grid gap-12 py-16 md:grid-cols-[1.4fr_.8fr_.8fr]">
        {/* Brand & Socials */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <Image src="/media/ruben-logo-oficial.jpg" alt="Rubén Rodríguez - Plataforma Informativa" width={100} height={81} className="h-20 w-auto rounded-lg object-contain" />
          </div>
          
          <p className="max-w-md text-sm leading-relaxed text-[#c3d1e4]">
            Plataforma informativa y de participación ciudadana independiente de Rubén Rodríguez. Un canal seguro para fiscalizar, denunciar maltrato animal y dar seguimiento directo a casos en Costa Rica.
          </p>

          {/* Social Icons with Official Logos */}
          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://www.facebook.com/share/1FGcVCAAKb/"
              target="_blank"
              rel="noreferrer"
              className="group relative flex size-11 items-center justify-center rounded-xl bg-white/10 p-2.5 transition-all hover:scale-105 hover:bg-white/20 hover:shadow-lg"
              aria-label="Facebook oficial"
              title="Facebook oficial de Rubén Rodríguez"
            >
              <Image
                src="/media/social-facebook.png"
                alt="Facebook"
                width={26}
                height={26}
                className="object-contain"
              />
            </a>

            <a
              href="https://www.instagram.com/rubenrodriguezoficialdog"
              target="_blank"
              rel="noreferrer"
              className="group relative flex size-11 items-center justify-center rounded-xl bg-white/10 p-2.5 transition-all hover:scale-105 hover:bg-white/20 hover:shadow-lg"
              aria-label="Instagram oficial"
              title="Instagram oficial de Rubén Rodríguez"
            >
              <Image
                src="/media/social-instagram.png"
                alt="Instagram"
                width={26}
                height={26}
                className="object-contain"
              />
            </a>

            <a
              href="https://wa.me/50670150301"
              target="_blank"
              rel="noreferrer"
              className="group relative flex size-11 items-center justify-center rounded-xl bg-white/10 p-2.5 transition-all hover:scale-105 hover:bg-white/20 hover:shadow-lg"
              aria-label="WhatsApp oficial"
              title="WhatsApp de atención ciudadana"
            >
              <Image
                src="/media/social-whatsapp.png"
                alt="WhatsApp"
                width={26}
                height={26}
                className="object-contain"
              />
            </a>

            <a
              href="mailto:rr@rubenrodriguezoficial.com"
              className="group relative flex size-11 items-center justify-center rounded-xl bg-white/10 p-2.5 transition-all hover:scale-105 hover:bg-white/20 hover:shadow-lg"
              aria-label="Correo electrónico"
              title="Correo rr@rubenrodriguezoficial.com"
            >
              <Image
                src="/media/social-gmail.png"
                alt="Gmail"
                width={26}
                height={26}
                className="object-contain"
              />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#ffb9ae]">
            Explorar
          </h2>
          <div className="grid gap-3 text-sm font-semibold text-[#d4e1f2]">
            <Link href="/" className="hover:text-[#ff9d8e] transition">Inicio</Link>
            <Link href="/contenido" className="hover:text-[#ff9d8e] transition">Investigaciones y Casos</Link>
            <Link href="/membresia" className="hover:text-[#ff9d8e] transition">Membresías</Link>
            <Link href="/denuncias" className="hover:text-[#ff9d8e] transition">Presentar Denuncia</Link>
            <Link href="/sobre-mi" className="hover:text-[#ff9d8e] transition">Sobre Rubén Rodríguez</Link>
            <Link href="/buscar" className="hover:text-[#ff9d8e] transition">Buscar Casos</Link>
          </div>
        </div>

        {/* Legal & Terms */}
        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#ffb9ae]">
            Legal y Soporte
          </h2>
          <div className="grid gap-3 text-sm font-semibold text-[#d4e1f2]">
            <Link href="/privacidad" className="hover:text-[#ff9d8e] transition">Política de Privacidad (Ley 8968)</Link>
            <Link href="/terminos" className="hover:text-[#ff9d8e] transition">Términos y Condiciones</Link>
            <Link href="/cookies" className="hover:text-[#ff9d8e] transition">Política de Cookies</Link>
            <CookiePreferencesButton />
            <Link href="/contacto" className="hover:text-[#ff9d8e] transition">Contacto Directo</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#070e17]">
        <div className="container-shell flex flex-col gap-3 py-6 text-xs text-[#8da2bd] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Rubén Rodríguez · Plataforma Informativa · San José, Costa Rica.
          </span>
          <span className="text-[#e2a89f]">
            Canal civil y ciudadano independiente. Ante riesgo inminente, llama al 9-1-1 o a autoridades judiciales.
          </span>
        </div>
      </div>
    </footer>
  );
}
