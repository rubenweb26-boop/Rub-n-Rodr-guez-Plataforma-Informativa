"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ExternalLink,
  Filter,
  MessageCircle,
  PackageOpen,
  Phone,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import type { Advertiser, Product } from "@/lib/data/advertisers";

export function CommercialShowcase({
  advertisers,
  products,
}: {
  advertisers: Advertiser[];
  products: Product[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "",
    "Medicina Veterinaria",
    "Nutrición",
    "Educación y Etología",
    "Accesorios y Seguridad",
  ];

  const filteredProducts = products.filter((prod) => {
    const matchesCat =
      !selectedCategory ||
      prod.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery =
      !searchQuery ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.advertiserName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div>
      {/* Search and Filters Bar */}
      <div className="mb-10 flex flex-col gap-4 rounded-xl border border-[#ded8ce] bg-[#fffdf9] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#ded8ce] bg-white px-3 py-2">
          <Search size={18} className="text-[#b74033]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar veterinarias, alimento, adiestramiento…"
            className="w-full bg-transparent text-sm text-[#142235] placeholder-[#5d6875] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-[#5d6875]"
            >
              Borrar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <Filter size={15} className="mr-1 text-[#5d6875]" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1.5 transition ${
                selectedCategory === cat
                  ? "bg-[#142235] text-white"
                  : "bg-[#f2ede4] text-[#142235] hover:bg-[#ded8ce]"
              }`}
            >
              {cat || "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="surface grid min-h-[250px] place-items-center bg-[#fffdf9] p-8 text-center">
          <div>
            <PackageOpen className="mx-auto text-[#d84d3d]" size={36} />
            <h3 className="mt-4 text-xl font-black">No se encontraron productos</h3>
            <p className="mt-1 text-sm text-[#5d6875]">
              Intenta con otro término o limpia los filtros de categoría.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const price = formatPrice(product.priceCrc);
            return (
              <article
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="surface group flex cursor-pointer flex-col overflow-hidden bg-[#fffdf9] transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#142235]">
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

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#b74033]">
                    <ShieldCheck size={14} className="text-[#087f5b]" />
                    <span>{product.advertiserName}</span>
                  </div>

                  <h3 className="headline-display mt-2 line-clamp-1 text-lg font-black text-[#142235] group-hover:text-[#d84d3d] transition">
                    {product.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5d6875]">
                    {product.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-[#eee8df] pt-4">
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
            );
          })}
        </div>
      )}

      {/* Directory of Verified Businesses */}
      <div className="mt-16">
        <div className="mb-8">
          <span className="eyebrow flex items-center gap-1.5 !text-[#b74033]">
            <Store size={15} /> Directorio de Proveedores
          </span>
          <h2 className="headline-display mt-2 text-3xl font-black tracking-[-0.04em]">
            Comercios Aprobados en Costa Rica
          </h2>
          <p className="mt-1 text-sm text-[#5d6875]">
            Cada establecimiento cuenta con perfil comercial verificado y contacto directo sin intermediarios.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {advertisers.map((adv) => (
            <div
              key={adv.id}
              className="surface flex flex-col justify-between bg-[#fffdf9] p-6"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-black text-[#166534]">
                      Verificado
                    </span>
                    <h3 className="headline-display mt-2 text-xl font-black text-[#142235]">
                      {adv.businessName}
                    </h3>
                    <p className="text-xs font-bold text-[#5d6875]">
                      {adv.canton}, {adv.province} · {adv.category}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-[#5d6875]">
                  {adv.description}
                </p>

                <p className="mt-4 text-xs font-black text-[#142235]">
                  Catálogo: {adv.products.length} {adv.products.length === 1 ? "producto" : "productos"} registrados
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#ded8ce] pt-4">
                <a
                  href={`https://wa.me/${adv.whatsapp}?text=${encodeURIComponent(
                    `Hola, contacto desde la vitrina de la plataforma de Rubén Rodríguez. Deseo información sobre sus servicios.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary !border-[#25D366] !bg-[#25D366] !px-4 !py-2 text-xs !text-white hover:!bg-[#1ebc59]"
                >
                  <MessageCircle size={14} /> WhatsApp Comercial
                </a>

                {adv.phone && (
                  <a
                    href={`tel:${adv.phone}`}
                    className="btn-secondary flex items-center gap-1.5 !px-3 !py-2 text-xs"
                  >
                    <Phone size={13} /> {adv.phone}
                  </a>
                )}

                {adv.website && (
                  <a
                    href={adv.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary flex items-center gap-1.5 !px-3 !py-2 text-xs"
                  >
                    <ExternalLink size={13} /> Web
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
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
                    La plataforma funciona como vitrina informativa. No simulamos compras directas; toda contratación se acuerda directamente con el proveedor.
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
