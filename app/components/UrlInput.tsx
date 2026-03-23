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
          relative flex items-center bg-white rounded-btn border transition-all duration-300
          ${isFocused
            ? 'border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.08)]'
            : 'border-[#e0e0e0] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          }
        `}
      >
        <div className="pl-5">
          <Globe className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-secondary'}`} />
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Voer je website-URL in"
          className="flex-1 py-5 px-4 text-lg bg-transparent border-none outline-none placeholder:text-secondary/40 font-body"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="mr-2.5 py-3.5 px-7 bg-primary text-white rounded-btn font-body font-medium hover:bg-[#333333] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          {isLoading ? 'Bezig...' : 'Analyseer mijn merk'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <p className="mt-4 text-sm text-secondary/60 font-body" style={{ fontWeight: 300 }}>
        Bijvoorbeeld: newfound.agency of www.jouwsite.nl
      </p>
    </form>
  )
}
