"use client";

import { useEffect, useRef, useState } from "react";

interface SplineHeroAnimationProps {
  className?: string;
}

/** Detecta soporte de WebGL en el navegador actual */
function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(ctx);
  } catch {
    return false;
  }
}

export function SplineHeroAnimation({
  className = "",
}: SplineHeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!detectWebGL() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("fallback");
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || state !== "loading") return;
    const timer = setTimeout(() => setState("fallback"), 25_000);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== containerRef.current?.querySelector("iframe")?.contentWindow) return;
      if (event.data?.type === "rubenweb-spline-loaded") { clearTimeout(timer); setState("ok"); }
      if (event.data?.type === "rubenweb-spline-error") { clearTimeout(timer); setState("fallback"); }
    };
    window.addEventListener("message", onMessage);
    return () => { clearTimeout(timer); window.removeEventListener("message", onMessage); };
  }, [active, state]);

  return (
    <div
      className={`relative w-full h-[450px] lg:h-[520px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center ${className}`}
      style={{
        background:
          "linear-gradient(135deg, #0f1e30 0%, #142235 40%, #0c1624 100%)",
      }}
    >
      {/* The external viewer runs in a restricted frame. */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-700 ${
          state === "ok" ? "opacity-100" : "opacity-0"
        }`}
      >{active && state !== "fallback" && <iframe src="/spline-terminal.html" title="Terminal interactiva de denuncias" sandbox="allow-scripts allow-same-origin" className="h-full w-full border-0" />}</div>

      {/* Fallback visual animado (CSS puro) cuando no hay WebGL o hay error */}
      {(state === "loading" || state === "fallback") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          {/* Anillos animados */}
          <div className="relative flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute rounded-full border border-[#d84d3d]/30"
                style={{
                  width: `${120 + i * 60}px`,
                  height: `${120 + i * 60}px`,
                  animation: `ping ${1.4 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.4 - i * 0.1,
                }}
              />
            ))}
            {/* Icono central */}
            <div className="relative z-10 flex size-20 items-center justify-center rounded-2xl border border-[#d84d3d]/30 bg-[#d84d3d]/10 backdrop-blur-sm">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff9d8e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>

          <p className="mt-8 text-sm font-bold text-white/70">
            {state === "loading"
              ? "Cargando terminal 3D…"
              : "Sistema de Denuncias"}
          </p>
          <p className="mt-1 text-xs text-[#5d7a99]">
            {state === "loading"
              ? "Iniciando visualización interactiva"
              : "Plataforma segura · Costa Rica"}
          </p>

          {/* Grid de fondo decorativo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#4fa0d8 1px, transparent 1px), linear-gradient(90deg, #4fa0d8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      )}

      {/* Badge inferior */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/90 flex items-center gap-2 shadow-lg">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        {state === "ok" ? "Terminal 3D · Arrastra para explorar" : "Canal de denuncias seguro"}
      </div>
    </div>
  );
}
