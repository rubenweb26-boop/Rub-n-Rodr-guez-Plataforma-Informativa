export interface Investigation {
  id: string; title: string; slug: string; summary: string; content: string;
  coverImage: string; imageCredit: string; sourceUrl: string; isPremium: boolean;
  videoUrl?: string; videoDuration?: string; author: string; category: string;
  publishedAt: string; readTime: string; keyFindings: string[];
}

// Cases require a traceable report and a photograph of the event.
export const VERIFIED_INVESTIGATIONS: Investigation[] = [
  {
    id: "heredia-2024",
    title: "Rescate de un perro tras denuncia de maltrato en Heredia",
    slug: "rescate-perro-maltrato-heredia-2024",
    summary: "Una fundación de rescate, la Fuerza Pública y miembros de la Federación Canina acudieron al caso en Santo Domingo de Heredia. CRHoy documentó la participación de Rubén Rodríguez al tranquilizar al perro.",
    content: "<p>El 18 de junio de 2024, CRHoy informó que miembros de Rescatista Soy, la Fuerza Pública y la Federación Canina acudieron a un caso de maltrato en Santo Domingo de Heredia. Según el reporte, Rubén Rodríguez ayudó a tranquilizar al perro para que pudiera recibir atención.</p><p>El medio informó que el perro fue valorado por una veterinaria y que el OIJ abrió una investigación tras recibir una denuncia. No se atribuye a Rubén la dirección del operativo ni un resultado judicial no documentado.</p><p><a href=\"https://crhoy.com/nacionales/video-ya-esta-en-buenas-manos-rescatan-a-perrito-que-sufrio-maltrato-en-heredia/\" target=\"_blank\" rel=\"noopener noreferrer\">Consultar el reportaje y la fotografía original en CRHoy</a>.</p>",
    coverImage: "https://images.hoy.cr/cdn-cgi/image/width=1000,quality=85,format=auto/wp-content/uploads/2024/06/Perrito-rescatado-Heredia.jpg",
    imageCredit: "Fotografía: cortesía de Luis Diego Barrantes, publicada por CRHoy",
    sourceUrl: "https://crhoy.com/nacionales/video-ya-esta-en-buenas-manos-rescatan-a-perrito-que-sufrio-maltrato-en-heredia/",
    isPremium: false,
    author: "Fuente: CRHoy",
    category: "Rescate documentado",
    publishedAt: "2024-06-18T11:43:00-06:00",
    readTime: "2 min de lectura",
    keyFindings: [
      "El rescate ocurrió en Santo Domingo de Heredia con apoyo de la Fuerza Pública.",
      "CRHoy reportó que Rubén Rodríguez ayudó a tranquilizar al perro.",
      "El OIJ abrió una investigación tras recibir una denuncia.",
    ],
  },
];

export function getPublishedInvestigations(): Investigation[] { return VERIFIED_INVESTIGATIONS; }
export function getInvestigationBySlug(slug: string): Investigation | undefined {
  return VERIFIED_INVESTIGATIONS.find((inv) => inv.slug === slug);
}
