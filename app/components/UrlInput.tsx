'use client'

import { useState } from 'react'
import { ArrowRight, Globe } from 'lucide-react'

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    onSubmit(normalizedUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative flex items-center bg-white rounded-2xl border transition-all duration-200
          ${isFocused ? 'border-neutral-900 ring-2 ring-neutral-100' : 'border-neutral-200'}
        `}
      >
        <div className="pl-5">
          <Globe className="w-5 h-5 text-neutral-400" />
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Voer je website-URL in"
          className="flex-1 py-5 px-4 text-lg bg-transparent border-none outline-none placeholder:text-neutral-400"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="mr-2 py-3 px-6 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? 'Bezig...' : 'Analyseer mijn merk'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <p className="mt-3 text-sm text-neutral-400">
        Bijvoorbeeld: newfound.agency of www.jouwsite.nl
      </p>
    </form>
  )
}
