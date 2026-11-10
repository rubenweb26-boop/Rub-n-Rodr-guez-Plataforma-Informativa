"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import type { Product } from "@/lib/data/advertisers";

export function CommercialCarousel({ products }: { products: Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, products.length]);

  if (!products || products.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Controls Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="eyebrow flex items-center gap-1.5 !text-[#d84d3d]">
            <Store size={15} /> Vitrina Comercial
          </span>
          <h3 className="headline-display mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Comercios y Servicios Recomendados
          </h3>
          <p className="mt-1 text-sm text-[#5d6875]">
            Emprendimientos e iniciativas verificadas. Cada consulta se gestiona directamente con el proveedor.
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={prevSlide}
            aria-label="Producto anterior"
            className="flex size-10 items-center justify-center rounded-full border border-[#ded8ce] bg-white text-[#142235] shadow-sm transition hover:bg-[#142235] hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Siguiente producto"
            className="flex size-10 items-center justify-center rounded-full border border-[#ded8ce] bg-white text-[#142235] shadow-sm transition hover:bg-[#142235] hover:text-white"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / Math.min(products.length, 3))}%)`,
          }}
        >
          {products.map((product) => {
            const price = formatPrice(product.priceCrc);
            return (
              <div
                key={product.id}
                className="w-full flex-shrink-0 px-2 sm:w-1/2 lg:w-1/3"
              >
                <article
                  onClick={() => setSelectedProduct(product)}
                  className="surface group flex h-full cursor-pointer flex-col overflow-hidden bg-[#fffdf9] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#203d5d]">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded bg-[#142235]/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="m-0 text-xs font-bold text-[#b74033]">
                      {product.advertiserName}
                    </p>
                    <h4 className="mt-1 line-clamp-1 text-base font-black text-[#142235]">
                      {product.name}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5d6875]">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-[#eee8df] pt-3">
                      {price ? (
                        <span className="text-base font-black text-[#142235]">
                          {price}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#5d6875]">
                          Consultar precio
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d84d3d] group-hover:underline">
                        Ver detalle <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Nav Arrows & Indicators */}
      <div className="mt-4 flex items-center justify-between sm:hidden">
        <button
          onClick={prevSlide}
          className="flex size-9 items-center justify-center rounded-full border border-[#ded8ce] bg-white text-[#142235]"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex gap-1.5">
          {products.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-all ${
                i === currentIndex ? "w-5 bg-[#d84d3d]" : "bg-[#ded8ce]"
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="flex size-9 items-center justify-center rounded-full border border-[#ded8ce] bg-white text-[#142235]"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[#fffdf9] p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              aria-label="Cerrar ventana"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#f2ede4] text-[#142235] hover:bg-[#142235] hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#203d5d]">
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="eyebrow !text-[#b74033]">
                  {selectedProduct.category}
                </span>

                <h3 className="headline-display mt-2 text-2xl font-black tracking-[-0.03em] text-[#142235]">
                  {selectedProduct.name}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[#5d6875]">
                  <ShieldCheck size={16} className="text-[#087f5b]" />
                  <span>{selectedProduct.advertiserName}</span>
                </div>

                {selectedProduct.priceCrc && (
                  <p className="mt-4 text-3xl font-black text-[#142235]">
                    {formatPrice(selectedProduct.priceCrc)}
                  </p>
                )}

                <p className="mt-3 text-sm leading-6 text-[#5d6875]">
                  {selectedProduct.description}
                </p>

                <div className="mt-6 border-t border-[#eee8df] pt-5">
                  <p className="text-xs text-[#707e94]">
                    Esta plataforma es una vitrina informativa. La contratación y pago se acuerda de forma directa y soberana con el comercio.
                  </p>

                  <a
                    href={`https://wa.me/${selectedProduct.advertiserWhatsapp}?text=${encodeURIComponent(
                      `Hola, vi su publicación "${selectedProduct.name}" en la vitrina de la plataforma de Rubén Rodríguez y deseo más información.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary mt-4 flex w-full items-center justify-center gap-2 !bg-[#25D366] !text-white hover:!bg-[#1ebc59]"
                  >
                    <MessageCircle size={18} />
                    Infórmate directamente con el proveedor
                  </a>

                  {selectedProduct.providerUrl && (
                    <a
                      href={selectedProduct.providerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary mt-2 flex w-full items-center justify-center gap-2 text-xs"
                    >
                      <ExternalLink size={15} />
                      Sitio web oficial
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
