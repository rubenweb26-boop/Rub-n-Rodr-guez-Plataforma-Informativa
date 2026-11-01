export type PublicSearchResult = { title: string; summary: string; href: string; category: string };

const results: PublicSearchResult[] = [
  { title: "Membresía de contenido", summary: "Conoce el precio de ₡3.500 mensuales, beneficios y la próxima disponibilidad de pagos.", href: "/membresia", category: "Membresías" },
  { title: "Presentar una denuncia", summary: "Comparte información de interés público y consulta el seguimiento desde tu cuenta.", href: "/denuncias", category: "Denuncias" },
  { title: "Investigaciones y videos", summary: "Explora las publicaciones que se encuentren disponibles en el centro de contenido.", href: "/contenido", category: "Contenido" },
  { title: "Plan para anunciantes", summary: "Información para negocios que desean aparecer en la vitrina comercial, con revisión previa.", href: "/anuncios", category: "Anunciantes" },
  { title: "Contacto", summary: "Canales oficiales para consultas generales, editoriales o comerciales.", href: "/contacto", category: "Contacto" },
];

const concepts: Record<string, string[]> = {
  membresia: ["membresia", "membresías", "pago", "pagos", "pagar", "precio", "suscripcion", "suscripción", "tarjeta", "cobro"],
  denuncia: ["denuncia", "denuncias", "caso", "casos", "reclamo", "reporte", "informacion", "información", "seguimiento"],
  contenido: ["video", "videos", "investigacion", "investigación", "investigaciones", "noticia", "noticias", "contenido", "reportaje"],
  anunciante: ["publicidad", "anuncios", "anuncio", "producto", "productos", "servicio", "servicios", "negocio", "anunciante"],
  contacto: ["contacto", "correo", "email", "whatsapp", "facebook", "instagram"],
};

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }

export function searchPublicSite(query: string) {
  const normalized = normalize(query);
  if (!normalized) return results;
  const words = normalized.split(/\s+/).filter(Boolean);
  const topics = Object.entries(concepts).filter(([, terms]) => terms.some((term) => words.some((word) => normalize(term).includes(word) || word.includes(normalize(term))))).map(([topic]) => topic);
  return results.filter((result) => {
    const text = normalize(`${result.title} ${result.summary} ${result.category}`);
    return words.some((word) => text.includes(word)) || (topics.includes("membresia") && result.href === "/membresia") || (topics.includes("denuncia") && result.href === "/denuncias") || (topics.includes("contenido") && result.href === "/contenido") || (topics.includes("anunciante") && result.href === "/anuncios") || (topics.includes("contacto") && result.href === "/contacto");
  });
}
