import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://racines-plus.com"),
  title: {
    template: "%s | Racines+",
    default: "Racines+ | L'histoire continue avec toi",
  },
  description: "La première plateforme généalogique intelligente, interactive et souveraine pour préserver la mémoire de la famille et de la diaspora africaine.",
  keywords: ["généalogie", "famille", "diaspora africaine", "arbre généalogique", "réseau familial", "Toa-Zéo", "Racines+"],
  authors: [{ name: "Racines+" }],
  creator: "GSN Expertises",
  publisher: "Racines+",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Racines+",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Racines+ | L'histoire et le patrimoine familial de la diaspora",
    description: "Forteresse numérique souveraine pour votre lignée. Découvrez votre arbre généalogique interactif, la localisation de votre diaspora et vos archives familiales sécurisées.",
    siteName: "Racines+",
    locale: "fr_CI",
    type: "website",
    url: "https://racines-plus.com",
    images: [
      {
        url: "/LOGO_Racines.png", // Idéalement, uploader une image _og.png (1200x630)
        width: 800,
        height: 600,
        alt: "Logo Racines+",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Racines+ | Le futur de la généalogie familiale",
    description: "Cartographie de la diaspora africaine et préservation de la mémoire.",
  }
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
