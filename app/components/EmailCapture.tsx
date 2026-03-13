'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'

interface EmailCaptureProps {
  onSubmit: (email: string) => void
}

export default function EmailCapture({ onSubmit }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    onSubmit(email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100 animate-fade-in">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Opgeslagen!</h3>
        <p className="text-neutral-600">
          Je ontvangt je superprompt binnen enkele minuten in je inbox.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 mb-1">Stuur me de superprompt ook per mail</h3>
          <p className="text-sm text-neutral-500">Dan heb ik hem altijd bij de hand.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jouw@email.nl"
          className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
          required
        />

        <button
          type="submit"
          disabled={!email.trim()}
          className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Versturen
        </button>
      </form>
    </div>
  )
}
