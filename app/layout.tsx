import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'RicciFinance',
  description: 'Controle financeiro para personal trainer autônomo',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RicciFinance' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f1117',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" defer />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ minHeight: '100vh', background: 'var(--bg)', overscrollBehavior: 'none' }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 72 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
