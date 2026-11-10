"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";
import { VERIFIED_INVESTIGATIONS } from "@/lib/data/investigations";

export function RealCasesShowcase() {
  const cases = VERIFIED_INVESTIGATIONS;
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => setCurrentIndex((val) => (val - 1 + cases.length) % cases.length);
  const next = () => setCurrentIndex((val) => (val + 1) % cases.length);

  const currentCase = cases[currentIndex];

  return (
    <section className="border-y border-[#ded8ce] bg-[#fffdf9] py-20">
      <div className="container-shell">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow flex items-center gap-1.5 !text-[#b74033]">
              Casos Reales e Investigaciones
            </span>
            <h2 className="headline-display mt-3 text-4xl font-black tracking-[-0.05em] text-[#142235] sm:text-5xl">
              Operativos documentados en el terreno.
            </h2>
            <p className="mt-2 text-sm text-[#556377]">
              Casos con fuentes identificables y fotografías del hecho documentado.
            </p>
          </div>

          {cases.length > 1 && <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="flex size-11 items-center justify-center rounded-full border border-[#ded8ce] bg-white text-[#142235] shadow-sm hover:bg-[#f5f1ea] transition cursor-pointer"
              aria-label="Caso anterior"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={next}
              className="flex size-11 items-center justify-center rounded-full bg-[#d84d3d] text-white shadow-md hover:bg-[#b74033] transition cursor-pointer"
              aria-label="Siguiente caso"
            >
              <ArrowRight size={18} />
            </button>
          </div>}
        </div>

        {/* Featured Interactive Case Showcase */}
        <div className="overflow-hidden rounded-3xl border border-[#ded8ce] bg-[#0c1624] text-white shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Image / Video Preview */}
          <div className="relative aspect-[16/10] overflow-hidden bg-black lg:aspect-auto lg:min-h-[440px]">
            <Image
              src={currentCase.coverImage}
              alt={currentCase.title}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-all duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
            
            <div className="absolute left-5 top-5">
              <span className="rounded-full bg-[#d84d3d] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
                {currentCase.category}
              </span>
            </div>
            <p className="absolute bottom-2 right-2 max-w-[70%] rounded bg-black/75 px-2 py-1 text-right text-[10px] text-white">{currentCase.imageCredit}</p>

            {currentCase.videoUrl && (
              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <PlayCircle size={16} className="text-[#ff9d8e]" />
                Video del caso ({currentCase.videoDuration || "HD"})
              </div>
            )}
          </div>

          {/* Case Content */}
          <div className="flex flex-col justify-between p-8 sm:p-12">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#ff9d8e]">
                <span>CASO {String(currentIndex + 1).padStart(2, "0")} / {String(cases.length).padStart(2, "0")}</span>
                <span>{currentCase.readTime}</span>
              </div>

              <h3 className="headline-display mt-4 text-2xl font-black leading-snug tracking-tight text-white sm:text-3xl">
                {currentCase.title}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-[#c3d1e4]">
                {currentCase.summary}
              </p>

              {/* Key actions */}
              <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#ffb9ae]">
                  Acciones clave del operativo:
                </p>
                <ul className="space-y-1.5 text-xs text-[#a9bed6]">
                  {currentCase.keyFindings.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#ff9d8e] font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                href={`/contenido/${currentCase.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black !text-[#142235] hover:bg-[#ff9d8e] hover:!text-[#0c1624] transition shadow-md"
              >
                Abrir expediente <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mini Preview Selector Thumbnails */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cases.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition cursor-pointer ${
                currentIndex === idx
                  ? "border-[#d84d3d] bg-white shadow-md ring-2 ring-[#d84d3d]/20"
                  : "border-[#ded8ce] bg-[#fbf9f5] hover:bg-white"
              }`}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                <Image src={c.coverImage} alt={c.title} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#142235]">{c.title}</p>
                <p className="text-[11px] font-bold text-[#b74033]">{c.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

