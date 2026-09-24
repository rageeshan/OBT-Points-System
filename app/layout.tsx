import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Mission Control — OBT Points System',
  description: 'Outbound Training 2026 — Live Mission Ranking and Points Management System',
  keywords: ['OBT', 'Outbound Training', 'Mission Control', 'Points System'],
  authors: [{ name: 'Mission Control HQ' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="scanline" aria-hidden="true" />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'toast-mission',
            duration: 4000,
            style: {
              background: 'rgba(13, 13, 26, 0.98)',
              color: '#f8f8ff',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '6px',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
