import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rubenweb-cr.royaldoor1.chatgpt.site"),
  title: {
    default: "RubénWeb | Información con propósito",
    template: "%s | RubénWeb",
  },
  description:
    "Plataforma editorial de Rubén Rodríguez para información, investigación y participación ciudadana en Costa Rica.",
  keywords: [
    "Rubén Rodríguez",
    "Costa Rica",
    "investigación ciudadana",
    "investigación",
    "participación ciudadana",
  ],
  openGraph: {
    title: "RubénWeb | Información con propósito",
    description:
      "Contenido, investigaciones y participación ciudadana en Costa Rica.",
    locale: "es_CR",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
