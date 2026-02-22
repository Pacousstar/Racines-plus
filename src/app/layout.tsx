import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Racines+ | L'histoire continue avec toi",
  description: "La plateforme généalogique intelligente et souveraine pour préserver la mémoire familiale africaine.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Racines+",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Racines+ | L'histoire continue avec toi",
    description: "Forteresse numérique souveraine pour votre lignée africaine.",
    siteName: "Racines+",
    locale: "fr_CI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6600",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="apple-touch-icon" href="/LOGO_Racines.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Racines+" />
      </head>
      <body className="antialiased text-foreground bg-background">
        {children}
      </body>
    </html>
  );
}
