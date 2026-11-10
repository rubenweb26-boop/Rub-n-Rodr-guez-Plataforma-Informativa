"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { AuthProviderId } from "@/lib/auth/providers";
import {
  Search,
  ChevronDown,
  Settings,
  CreditCard,
  FileText,
  LogOut,
  Trash2,
  User,
} from "lucide-react";

const navLinks = [
  ["Inicio", "/"],
  ["Investigaciones", "/contenido"],
  ["Membresías", "/membresia"],
  ["Presentar denuncia", "/denuncias"],
  ["Sobre Rubén", "/sobre-mi"],
  ["Contacto", "/contacto"],
] as const;

/* ─────────────────────────── UserDropdown ──────────────────────────── */

function UserDropdown({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setShowDeleteConfirm(false);
        }}
        className="flex items-center gap-2 rounded-full border border-[#d84d3d]/40 bg-[#d84d3d]/15 pl-1.5 pr-3 py-1 text-xs font-bold text-white transition hover:bg-[#d84d3d]/25"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <span className="relative size-7 overflow-hidden rounded-full border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-7 object-cover"
              referrerPolicy="no-referrer"
            />
          </span>
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-[#d84d3d] text-[11px] font-black text-white select-none">
            {initials}
          </span>
        )}
        <span className="hidden sm:inline max-w-[90px] truncate">
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown
          size={13}
          className={`text-[#ff9d8e] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#0c1624] shadow-2xl ring-1 ring-black/20 backdrop-blur-md overflow-hidden z-50">
          {/* Info usuario */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-black text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[#8ea4be] mt-0.5">Cuenta activa</p>
          </div>

          {!showDeleteConfirm ? (
            <>
              <nav className="p-2 space-y-0.5">
                <DropdownLink href="/mi-cuenta" icon={<User size={15} />}>
                  Mi perfil
                </DropdownLink>
                <DropdownLink href="/mi-cuenta" icon={<Settings size={15} />}>
                  Configuración
                </DropdownLink>
                <DropdownLink href="/membresia" icon={<CreditCard size={15} />}>
                  Mi membresía
                </DropdownLink>
                <DropdownLink href="/mi-cuenta" icon={<FileText size={15} />}>
                  Mis denuncias
                </DropdownLink>
              </nav>

              <div className="border-t border-white/10 p-2 space-y-0.5">
                <form action="/auth/sign-out" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#ff9d8e] hover:bg-white/10 transition"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 size={15} />
                  Eliminar cuenta
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-xs font-black text-white">
                ¿Eliminar tu cuenta?
              </p>
              <p className="text-[11px] text-[#8ea4be] leading-relaxed">
                Por seguridad, confirma la solicitud en la página de tu cuenta. Los expedientes y pagos sujetos a conservación requieren revisión antes de eliminar los datos.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold text-white hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <Link href="/mi-cuenta/eliminar" className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-center text-[11px] font-black text-white hover:bg-rose-700 transition">Continuar</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#c8d7e8] hover:bg-white/10 hover:text-white transition"
    >
      <span className="text-[#ff9d8e]">{icon}</span>
      {children}
    </Link>
  );
}

/* ──────────────────────────── SignInModal ───────────────────────────── */

function SignInButton({ availableProviders }: { availableProviders: AuthProviderId[] }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#d84d3d] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#b74033]"
      >
        Mi cuenta
      </button>

      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === overlayRef.current) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0c1624] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Gradiente decorativo */}
            <div className="absolute inset-0 opacity-20 pointer-events-none [background:radial-gradient(circle_at_50%_0%,#d84d3d_0,transparent_60%)]" />

            <div className="relative p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="relative h-12 w-44">
                  <Image
                    src="/media/ruben-logo-oficial.jpg"
                    alt="RubénWeb"
                    fill
                    sizes="176px"
                    className="object-contain"
                  />
                </div>
              </div>

              <h2 className="text-center text-xl font-black text-white mb-1">
                Bienvenido
              </h2>
              <p className="text-center text-xs text-[#8ea4be] mb-6">
                Accede a tu cuenta para gestionar tus denuncias y membresía
              </p>

              {/* Botones de autenticación */}
              <div className="space-y-3">
                {availableProviders.includes("google") && <a
                  href={
                    agreed
                      ? "/auth/sign-in/google?return_to=%2Fmi-cuenta"
                      : "#"
                  }
                  onClick={(e) => {
                    if (!agreed) e.preventDefault();
                  }}
                  aria-disabled={!agreed}
                  className={`flex items-center gap-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition ${
                    !agreed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {/* Google icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    className="shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.3 30.2 0 24 0 14.7 0 6.8 5.4 2.9 13.3l7.9 6.1C12.6 13.1 17.9 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.1-4.4 6.7l6.9 5.3c4-3.7 6.2-9.2 6.2-16z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.8 28.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5L2.9 13.3C1 16.9 0 20.8 0 25s1 8.1 2.9 11.7l7.9-8.2z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.2 0 11.4-2 15.2-5.5l-6.9-5.3c-2.1 1.4-4.8 2.3-8.3 2.3-6.1 0-11.4-3.6-13.2-9.5l-7.9 6.1C6.8 42.6 14.7 48 24 48z"
                    />
                  </svg>
                  Continuar con Google
                </a>}

                {availableProviders.includes("facebook") && <a
                  href={
                    agreed
                      ? "/auth/sign-in/facebook?return_to=%2Fmi-cuenta"
                      : "#"
                  }
                  onClick={(e) => {
                    if (!agreed) e.preventDefault();
                  }}
                  aria-disabled={!agreed}
                  className={`flex items-center gap-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition ${
                    !agreed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {/* Facebook icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#1877F2"
                    className="shrink-0"
                  >
                    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97H15.8c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
                  </svg>
                  Continuar con Facebook
                </a>}
                {availableProviders.includes("apple") && <a href={agreed ? "/auth/sign-in/apple?return_to=%2Fmi-cuenta" : "#"} onClick={e => { if (!agreed) e.preventDefault(); }} aria-disabled={!agreed} className={`flex items-center gap-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition ${!agreed ? "opacity-50 cursor-not-allowed" : ""}`}>Continuar con Apple</a>}
                {availableProviders.length === 0 && <p className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-[#c8d7e8]">El inicio de sesión se habilitará cuando los proveedores de acceso estén configurados.</p>}
              </div>

              {/* Checkbox TyC — obligatorio antes de acceder */}
              <label className="mt-5 flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[#d84d3d] cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed text-[#8ea4be] group-hover:text-[#c8d7e8] transition">
                  He leído y acepto los{" "}
                  <Link
                    href="/terminos"
                    target="_blank"
                    className="text-[#ff9d8e] underline hover:text-white font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link
                    href="/privacidad"
                    target="_blank"
                    className="text-[#ff9d8e] underline hover:text-white font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Política de Privacidad
                  </Link>
                </span>
              </label>

              {!agreed && (
                <p className="mt-2 text-center text-[11px] text-[#ff9d8e]/70">
                  Acepta los términos para habilitar el acceso
                </p>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-5 w-full text-center text-xs text-[#5d6875] hover:text-[#8ea4be] transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────── Main Client Header ──────────────────────── */

export function SiteHeaderClient({
  userDisplayName,
  userAvatarUrl,
  availableProviders,
}: {
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  availableProviders: AuthProviderId[];
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1f2d3d] bg-[#0c1624]/95 backdrop-blur-md">
      <div className="container-shell flex min-h-[78px] items-center justify-between gap-4 py-2">
        {/* Logo oficial — ancho explícito para evitar recorte */}
        <Link
          href="/"
          className="flex shrink-0 items-center transition hover:opacity-95"
          aria-label="Rubén Rodríguez, Plataforma Informativa"
        >
          <Image src="/media/ruben-logo-oficial.jpg" alt="" width={74} height={60} priority className="h-[52px] w-[65px] shrink-0 rounded-lg object-contain sm:h-[60px] sm:w-[74px]" />
          <span className="ml-2 hidden max-w-[150px] flex-col leading-tight text-white sm:flex">
            <strong className="text-sm font-black sm:text-base">Rubén Rodríguez</strong>
            <small className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#ffb9ae]">Información Ciudadana</small>
          </span>
        </Link>

        {/* Navegación de escritorio */}
        <nav
          className="hidden items-center gap-4 xl:flex xl:gap-5"
          aria-label="Navegación principal"
        >
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap text-[0.84rem] font-bold tracking-tight text-[#c8d7e8] transition-colors hover:text-[#ff9d8e]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones y usuario */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/buscar"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c5d5e8] transition hover:border-[#d84d3d]/50 hover:bg-white/10 hover:text-white"
            title="Buscar caso"
          >
            <Search size={15} className="text-[#ff9d8e]" />
            <span className="hidden sm:inline">Buscar</span>
          </Link>

          {userDisplayName ? (
            <UserDropdown
              displayName={userDisplayName}
              avatarUrl={userAvatarUrl}
            />
          ) : (
            <SignInButton availableProviders={availableProviders} />
          )}
        </div>
      </div>

      {/* Subbarra móvil */}
      <div className="border-t border-white/5 bg-[#08101a] py-2 xl:hidden">
        <div className="container-shell flex gap-2 overflow-x-auto no-scrollbar py-1">
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-[#c8d7e8] hover:bg-[#d84d3d]/20 hover:text-[#ff9d8e]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

