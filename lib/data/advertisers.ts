export interface Product {
  id: string;
  advertiserId: string;
  advertiserName: string;
  advertiserWhatsapp: string;
  name: string;
  description: string;
  category: string;
  priceCrc?: number;
  imageUrl: string;
  providerUrl?: string;
}

export interface Advertiser {
  id: string;
  businessName: string;
  slug: string;
  logoUrl?: string;
  description: string;
  category: string;
  whatsapp: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  province: string;
  canton: string;
  status: "pending" | "approved" | "rejected" | "paused";
  products: Product[];
}

export const VERIFIED_ADVERTISERS: Advertiser[] = [
  {
    id: "adv-001",
    businessName: "Hospital Veterinario San Francisco",
    slug: "hospital-veterinario-san-francisco",
    description:
      "Atención médica veterinaria ética, cirugías de alta complejidad, diagnóstico por imagen y laboratorio clínico con servicio de urgencias 24/7.",
    category: "Salud y Medicina Veterinaria",
    whatsapp: "50688880001",
    phone: "2289-5000",
    website: "https://vetsanfranciscocr.com",
    instagram: "https://instagram.com/vetsanfrancisco_cr",
    province: "San José",
    canton: "Escazú",
    status: "approved",
    products: [
      {
        id: "prod-001",
        advertiserId: "adv-001",
        advertiserName: "Hospital Veterinario San Francisco",
        advertiserWhatsapp: "50688880001",
        name: "Consulta Médica General y Diagnóstico",
        description:
          "Valoración física completa, evaluación de signos vitales, plan de salud preventivo y recomendaciones por médico veterinario incorporado al Colmevet.",
        category: "Medicina Veterinaria",
        priceCrc: 22000,
        imageUrl: "/media/investigacion-card-hd.png",
      },
      {
        id: "prod-002",
        advertiserId: "adv-001",
        advertiserName: "Hospital Veterinario San Francisco",
        advertiserWhatsapp: "50688880001",
        name: "Servicio de Urgencias y Hospitalización 24/7",
        description:
          "Monitoreo intensivo continuo, fluidoterapia, oxigenoterapia y soporte vital con equipo médico de guardia los 365 días del año.",
        category: "Urgencias",
        priceCrc: 45000,
        imageUrl: "/media/investigacion-hero-hd.png",
      },
      {
        id: "prod-003",
        advertiserId: "adv-001",
        advertiserName: "Hospital Veterinario San Francisco",
        advertiserWhatsapp: "50688880001",
        name: "Perfil Geriátrico Preventivo Completo",
        description:
          "Hemograma completo, química sanguínea renal y hepática, urianálisis y ecografía abdominal para caninos y felinos mayores a 7 años.",
        category: "Laboratorio y Diagnóstico",
        priceCrc: 58000,
        imageUrl: "/media/ruben-rodriguez-oficial.jpeg",
      },
    ],
  },
  {
    id: "adv-002",
    businessName: "Nutrición Natural Canina Costa Rica",
    slug: "nutricion-natural-canina-cr",
    description:
      "Formulación de dietas biológicamente apropiadas, alimentos crudos (BARF) y suplementos 100% naturales libres de preservantes químicos, harinas y subproductos.",
    category: "Alimentación y Nutrición",
    whatsapp: "50688880002",
    phone: "2272-9100",
    website: "https://nutricioncaninacr.com",
    province: "San José",
    canton: "Curridabat",
    status: "approved",
    products: [
      {
        id: "prod-004",
        advertiserId: "adv-002",
        advertiserName: "Nutrición Natural Canina Costa Rica",
        advertiserWhatsapp: "50688880002",
        name: "Dieta Natural BARF Premium (Paquete 10 kg)",
        description:
          "Proteína de res y pollo de grado consumo humano, vísceras, huesos carnosos triturados y vegetales frescos enriquecidos con algas marinas.",
        category: "Nutrición",
        priceCrc: 28500,
        imageUrl: "/media/investigacion-hero-hd.png",
      },
      {
        id: "prod-005",
        advertiserId: "adv-002",
        advertiserName: "Nutrición Natural Canina Costa Rica",
        advertiserWhatsapp: "50688880002",
        name: "Snacks Deshidratados 100% Carne Magra",
        description:
          "Premios libres de cereales y aditivos, deshidratados a baja temperatura para preservar nutrientes. Ideales para adiestramiento en positivo.",
        category: "Snacks y Premios",
        priceCrc: 6800,
        imageUrl: "/media/investigacion-card-hd.png",
      },
      {
        id: "prod-006",
        advertiserId: "adv-002",
        advertiserName: "Nutrición Natural Canina Costa Rica",
        advertiserWhatsapp: "50688880002",
        name: "Aceite de Salmón Silvestre Puro (500 ml)",
        description:
          "Rico en ácidos grasos Omega 3 (EPA y DHA). Mejora la barrera dérmica, brillo del pelaje y salud articular en caninos de todas las edades.",
        category: "Suplementos",
        priceCrc: 16500,
        imageUrl: "/media/ruben-retrato-principal.png",
      },
    ],
  },
  {
    id: "adv-003",
    businessName: "Adiestramiento Positivo y Etología CR",
    slug: "adiestramiento-positivo-etologia-cr",
    description:
      "Educación canina basada exclusivamente en ciencia del comportamiento, refuerzo positivo y bienestar emocional, sin collares de castigo ni violencia.",
    category: "Educación y Conducta Canina",
    whatsapp: "50688880003",
    phone: "2260-4400",
    website: "https://adiestramientopositivocr.com",
    province: "Heredia",
    canton: "Heredia",
    status: "approved",
    products: [
      {
        id: "prod-007",
        advertiserId: "adv-003",
        advertiserName: "Adiestramiento Positivo y Etología CR",
        advertiserWhatsapp: "50688880003",
        name: "Programa de Modificación de Reactividad y Miedos",
        description:
          "Sesiones a domicilio y entornos reales enfocadas en desensibilización sistemática, reducción del estrés y contracondicionamiento.",
        category: "Educación y Etología",
        priceCrc: 48000,
        imageUrl: "/media/investigacion-card-hd.png",
      },
      {
        id: "prod-008",
        advertiserId: "adv-003",
        advertiserName: "Adiestramiento Positivo y Etología CR",
        advertiserWhatsapp: "50688880003",
        name: "Escuela Temprana de Socialización para Cachorros",
        description:
          "Desarrollo de tolerancia a estímulos urbanos, comunicación canina adecuada y prevención de problemas de conducta en cachorros de 2 a 5 meses.",
        category: "Educación y Etología",
        priceCrc: 32000,
        imageUrl: "/media/ruben-rodriguez-oficial.jpeg",
      },
    ],
  },
  {
    id: "adv-004",
    businessName: "EcoPet CR · Accesorios Éticos y Placas QR",
    slug: "ecopet-cr-accesorios-eticos",
    description:
      "Accesorios ergonómicos de alta resistencia diseñados para el confort y la seguridad de mascotas rescatadas. Fabricación local y materiales reciclados.",
    category: "Accesorios y Seguridad",
    whatsapp: "50688880004",
    phone: "2440-1200",
    website: "https://ecopetcr.com",
    province: "Alajuela",
    canton: "Alajuela",
    status: "approved",
    products: [
      {
        id: "prod-009",
        advertiserId: "adv-004",
        advertiserName: "EcoPet CR · Accesorios Éticos y Placas QR",
        advertiserWhatsapp: "50688880004",
        name: "Placa Inteligente de Identificación con Código QR",
        description:
          "Perfil digital seguro con foto del animal, teléfono de contacto y registro médico accesible de inmediato al escanear desde cualquier smartphone.",
        category: "Seguridad e Identificación",
        priceCrc: 7900,
        imageUrl: "/media/investigacion-hero-hd.png",
      },
      {
        id: "prod-010",
        advertiserId: "adv-004",
        advertiserName: "EcoPet CR · Accesorios Éticos y Placas QR",
        advertiserWhatsapp: "50688880004",
        name: "Arnés Ergonómico en Y Antitirones Acolchado",
        description:
          "Diseño biomecánicamente seguro que protege la tráquea, esternón y hombros. Confeccionado con reata de alta densidad y reflectivos 3M.",
        category: "Accesorios",
        priceCrc: 19500,
        imageUrl: "/media/ruben-retrato-principal.png",
      },
    ],
  },
];

export function getApprovedAdvertisers(): Advertiser[] {
  return VERIFIED_ADVERTISERS.filter((adv) => adv.status === "approved");
}

export function getApprovedProducts(): Product[] {
  return VERIFIED_ADVERTISERS.filter((adv) => adv.status === "approved").flatMap(
    (adv) => adv.products,
  );
}

export function getAdvertiserBySlug(slug: string): Advertiser | undefined {
  return VERIFIED_ADVERTISERS.find((adv) => adv.slug === slug);
}
