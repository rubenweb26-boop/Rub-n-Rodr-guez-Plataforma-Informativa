import type { Metadata } from "next";
import { CookieBanner } from "@/components/cookie-banner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rubenweb-cr.royaldoor1.chatgpt.site"),
  title: {
    default: "Rubén Rodríguez – Plataforma Informativa",
    template: "%s | Rubén Rodríguez – Plataforma Informativa",
  },
  description:
    "Plataforma oficial de Rubén Rodríguez para denuncias ciudadanas, investigaciones, información pública y participación en Costa Rica.",
  keywords: [
    "Rubén Rodríguez",
    "Costa Rica",
    "denuncias ciudadanas",
    "investigación ciudadana",
    "participación ciudadana",
    "plataforma informativa",
    "bienestar animal",
    "fiscalización",
  ],
  openGraph: {
    title: "Rubén Rodríguez – Plataforma Informativa",
    description:
      "Plataforma oficial de denuncia ciudadana, investigaciones e información pública en Costa Rica.",
    locale: "es_CR",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <CookieBanner />
        <PwaRegister />
      </body>
    </html>
  );
}
