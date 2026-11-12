"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "rubenweb_cookie_consent";

type ConsentLevel = "all" | "essential" | "custom";

interface CookiePreferences {
  level: ConsentLevel;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 600);
        return () => { clearTimeout(timer); clearTimeout(mountTimer); };
      }
    } catch {
      // localStorage deshabilitado — mostrar aviso igualmente
      const showTimer = setTimeout(() => setVisible(true), 0);
      return () => { clearTimeout(showTimer); clearTimeout(mountTimer); };
    }
    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    const reopen = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as CookiePreferences | null;
        setAnalytics(Boolean(saved?.analytics));
        setMarketing(Boolean(saved?.marketing));
      } catch { setAnalytics(false); setMarketing(false); }
      setShowCustomize(true);
      setVisible(true);
    };
    window.addEventListener("rubenweb:cookie-preferences", reopen);
    return () => window.removeEventListener("rubenweb:cookie-preferences", reopen);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignorar
    }
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      level: "all",
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      level: "essential",
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      level: "custom",
      analytics,
      marketing,
      timestamp: Date.now(),
    });
  };

  if (!mounted || !visible) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="container-shell max-w-4xl mx-auto rounded-2xl border border-white/15 bg-[#142235]/97 backdrop-blur-md text-white shadow-2xl overflow-hidden">
        {!showCustomize ? (
          /* ── Vista principal ── */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d84d3d] text-white">
                <Cookie size={20} />
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="m-0 text-sm font-black tracking-tight text-white">
                    Privacidad y Cookies en RubénWeb
                  </p>
                  <span className="inline-flex items-center gap-1 rounded bg-[#ffb9ae]/15 px-2 py-0.5 text-[10px] font-bold text-[#ffb9ae]">
                    <ShieldCheck size={12} /> Ley 8968 Costa Rica
                  </span>
                </div>
                <p className="m-0 text-xs leading-relaxed text-[#c6d4e4] max-w-2xl">
                  Usamos cookies técnicas necesarias para garantizar la seguridad de tus denuncias y sesión. Las cookies opcionales (analíticas y de marketing) solo se activan con tu consentimiento. Consulta nuestra{" "}
                  <Link href="/cookies" className="text-[#ff9d8e] underline hover:text-white">
                    Política de Cookies
                  </Link>{" "}
                  y{" "}
                  <Link href="/privacidad" className="text-[#ff9d8e] underline hover:text-white">
                    Aviso de Privacidad
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-[#e6eefc] hover:bg-white/15 transition-colors"
              >
                <Settings size={14} />
                Personalizar
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-3.5 py-2 rounded-xl border border-white/25 bg-white/5 text-xs font-bold text-[#e6eefc] hover:bg-white/15 transition-colors"
              >
                Solo esenciales
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl bg-[#d84d3d] text-xs font-black text-white hover:bg-[#b74033] shadow-md transition-colors"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                aria-label="Cerrar aviso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Vista de personalización ── */
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-white">
                Personalizar preferencias de cookies
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="text-white/50 hover:text-white p-1"
                aria-label="Volver"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Esenciales — siempre activas */}
              <CookieToggle
                title="Cookies esenciales"
                description="Necesarias para el funcionamiento del sitio (sesión, seguridad, formularios). No se pueden desactivar."
                checked={true}
                disabled
                onChange={() => {}}
              />

              {/* Analíticas */}
              <CookieToggle
                title="Cookies analíticas"
                description="Nos ayudan a entender cómo los visitantes usan el sitio para mejorar la experiencia (ej. Google Analytics)."
                checked={analytics}
                onChange={setAnalytics}
              />

              {/* Marketing */}
              <CookieToggle
                title="Cookies de marketing"
                description="Permiten mostrar contenido relevante y medir el impacto de las campañas de comunicación ciudadana."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <Link
                href="/cookies"
                target="_blank"
                className="text-xs text-[#ff9d8e] underline hover:text-white"
              >
                Ver Política de Cookies completa
              </Link>
              <span className="text-white/20 text-xs">·</span>
              <Link
                href="/privacidad"
                target="_blank"
                className="text-xs text-[#ff9d8e] underline hover:text-white"
              >
                Aviso de Privacidad
              </Link>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Solo esenciales
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#d84d3d] text-xs font-black text-white hover:bg-[#b74033] shadow-md transition"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function CookieToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
        disabled
          ? "border-white/10 bg-white/5 opacity-70"
          : "border-white/15 bg-white/5 hover:bg-white/8"
      }`}
    >
      <div>
        <p className="text-xs font-black text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#8ea4be]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d84d3d] ${
          checked ? "bg-[#d84d3d]" : "bg-white/20"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
