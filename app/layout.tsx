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
        <header className="fixed top-0 left-0 right-0 z-50 bg-white">
          <div className="pl-8 pt-8">
            <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg"
                alt="Newfound"
                style={{ height: '28px' }}
              />
            </a>
          </div>
        </header>
        <div className="pt-24">
          {children}
        </div>
      </body>
    </html>
  )
}
