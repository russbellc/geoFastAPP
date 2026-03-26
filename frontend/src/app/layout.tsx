import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoIntel — Business Intelligence Platform",
  description: "Plataforma de inteligencia de mercado geoespacial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-950 text-white">{children}</body>
    </html>
  );
}
