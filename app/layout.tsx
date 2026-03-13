import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BrandReady — Van website naar merkstructuur in 3 minuten',
  description: 'Analyseer je website en krijg een complete merkstructuur + superprompt voor AI. Niveau 1 van BrandReady door Newfound.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  )
}
