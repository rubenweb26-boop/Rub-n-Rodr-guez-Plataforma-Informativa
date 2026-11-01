import Link from "next/link";
import { Check, ShieldAlert } from "lucide-react";

export function CurrencySwitcher() {
  return <div className="surface mx-auto max-w-[430px] overflow-hidden bg-[#fffdf9] p-7 sm:p-9">
    <p className="m-0 text-xs font-black uppercase tracking-[.14em] text-[#b74033]">Membresía de contenido</p>
    <p className="mb-0 mt-5 text-6xl font-black tracking-[-.07em]">₡3.500<span className="ml-2 text-base font-bold text-[#6b7688]">/ mes</span></p>
    <p className="mt-4 text-sm leading-6 text-[#667287]">Accede al contenido exclusivo disponible, a la gestión de tu cuenta y al seguimiento privado de tus denuncias.</p>
    <ul className="my-7 grid gap-3 p-0 text-sm font-bold">{["Investigaciones completas exclusivas", "Videos completos premium", "Formulario privado de denuncias", "Seguimiento de tus denuncias", "Gestión de cuenta y suscripción"].map((item) => <li key={item} className="flex items-start gap-2"><Check size={17} className="mt-0.5 text-[#b74033]" /> {item}</li>)}</ul>
    <button disabled type="button" className="btn-primary w-full">Suscribirme</button>
    <p className="mt-4 flex gap-2 rounded-xl bg-[#fff1e7] p-3 text-xs leading-5 text-[#795500]"><ShieldAlert className="mt-0.5 shrink-0" size={16} /> Los pagos en línea estarán disponibles próximamente.</p>
    <Link href="/contacto" className="mt-4 block text-center text-sm font-black text-[#a5342a]">¿Tienes una consulta? Contáctanos</Link>
  </div>;
}
