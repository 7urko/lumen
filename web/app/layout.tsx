import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Background } from "@/components/Background";
import { Shell } from "@/components/Shell";
import { WalletProvider } from "@/components/WalletProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  applicationName: "Lumen",
  title: { default: "Lumen — Wallet", template: "%s · Lumen" },
  description: "Lumen — a non-custodial crypto wallet (UI demo).",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Lumen" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06060c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Background />
        <WalletProvider>
          <Shell>{children}</Shell>
        </WalletProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
