import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brandprompt. Maak van je merk een superprompt',
  description: 'Jouw AI klinkt niet als jij. Brandprompt maakt van je website in 60 seconden een superprompt, zodat ChatGPT, Claude en Gemini schrijven zoals jouw merk.',
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
