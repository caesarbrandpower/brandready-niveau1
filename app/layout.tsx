import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brandprompt. Maak van je merk een superprompt',
  description: 'Analyseer je website en krijg een superprompt voor AI. Brandprompt door Newfound.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased min-h-screen font-body">
        {children}
      </body>
    </html>
  )
}
