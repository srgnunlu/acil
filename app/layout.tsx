import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import Script from 'next/script'

export const metadata: Metadata = {
  title: {
    default: 'ACIL - AI Destekli Hasta Takip Sistemi',
    template: '%s | ACIL',
  },
  description:
    'Acil tıp uzmanları için yapay zeka destekli hasta yönetim ve takip platformu. Multi-tenant hastane ve servis yönetimi.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ACIL',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px)',
      },
      {
        url: '/icons/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px)',
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
      {
        url: '/icons/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px)',
      },
      {
        url: '/icons/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px)',
      },
    ],
  },
  applicationName: 'ACIL',
  keywords: [
    'acil tıp',
    'hasta takip',
    'AI',
    'yapay zeka',
    'hastane yönetimi',
    'servis yönetimi',
    'sağlık',
  ],
  authors: [{ name: 'ACIL Team' }],
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'ACIL',
    title: 'ACIL - AI Destekli Hasta Takip Sistemi',
    description: 'Acil tıp uzmanları için yapay zeka destekli hasta yönetim ve takip platformu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ACIL - AI Destekli Hasta Takip Sistemi',
    description: 'Acil tıp uzmanları için yapay zeka destekli hasta yönetim ve takip platformu',
  },
  icons: {
    icon: [
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-touch-icon-76x76.png', sizes: '76x76', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ACIL" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <QueryProvider>
          <Providers>
            <PWAProvider>{children}</PWAProvider>
          </Providers>
        </QueryProvider>

        {/* Service Worker Registration Script */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('[PWA] Service Worker registered:', registration.scope);
                  },
                  function(error) {
                    console.error('[PWA] Service Worker registration failed:', error);
                  }
                );
              });
            }
          `}
        </Script>

        {/* Web Vitals */}
        <Script
          id="web-vitals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      console.log('[Perf]', entry.name, entry.value);
                    }
                  });
                  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
                } catch (e) {
                  console.error('[Perf] Observer error:', e);
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
