import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACIL - AI Destekli Hasta Takip Sistemi",
  description: "Acil tıp uzmanları için yapay zeka destekli hasta yönetim ve takip platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
