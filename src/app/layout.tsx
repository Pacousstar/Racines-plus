import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Racines+ | L'histoire continue avec toi",
  description: "La plateforme généalogique intelligente et souveraine pour préserver la mémoire familiale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={`antialiased text-foreground bg-background`}
      >
        {children}
      </body>
    </html>
  );
}
