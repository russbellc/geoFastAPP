import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoIntel — Intelligence Core",
  description: "Plataforma de inteligencia de mercado geoespacial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-body selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
