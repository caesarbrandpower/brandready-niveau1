'use client'

import { useState, useRef, useEffect } from 'react'
import UrlInput from './components/UrlInput'
import LoadingState from './components/LoadingState'
import BrandAnalysis from './components/BrandAnalysis'
import { Sparkles } from 'lucide-react'

type AnalysisResult = {
  companyName: string
  diagnose: string[]
  superprompt: {
    wie_je_bent: string
    wat_jou_onderscheidt: string[]
    jouw_klant: string
    zo_klink_je: string[]
    dit_zeg_je_nooit: string[]
    jouw_verhaal: string
  }
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadingSteps = [
    'Je website wordt gelezen...',
    'Je merk wordt geanalyseerd...',
    'Je superprompt wordt opgebouwd...',
  ]

  useEffect(() => {
    if (isLoading && loadingStep < loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        setLoadingStep((prev) => prev + 1)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, loadingStep])

  const handleUrlSubmit = async (submittedUrl: string) => {
    setUrl(submittedUrl)
    setIsLoading(true)
    setLoadingStep(0)
    setError(null)
    setResult(null)
    setShowManualInput(false)

    try {
      // Scrape met 15s timeout
      const scrapeController = new AbortController()
      const scrapeTimeout = setTimeout(() => scrapeController.abort(), 15000)

      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl }),
        signal: scrapeController.signal,
      })

      clearTimeout(scrapeTimeout)

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        throw new Error(errorData.error || 'Scrapen mislukt')
      }

      const scrapeData = await scrapeResponse.json()

      if (scrapeData.wordCount < 200) {
        setIsLoading(false)
        setShowManualInput(true)
        setError('Jouw website blokkeert automatische toegang waarschijnlijk door een beveiligingslaag. Beschrijf je merk kort, dan analyseren we alsnog.')
        return
      }

      // Analyze met 45s timeout
      const analyzeController = new AbortController()
      const analyzeTimeout = setTimeout(() => analyzeController.abort(), 45000)

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: scrapeData.content,
          url: submittedUrl
        }),
        signal: analyzeController.signal,
      })

      clearTimeout(analyzeTimeout)

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || 'Analyse mislukt')
      }

      const analysisData = await analyzeResponse.json()
      setResult(analysisData)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('De analyse duurde te lang. Probeer het opnieuw met een andere URL.')
      } else {
        setError(err instanceof Error ? err.message : 'Er ging iets mis')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return

    setIsLoading(true)
    setLoadingStep(1)
    setError(null)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 45000)

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: manualInput,
          url: url
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || 'Analyse mislukt')
      }

      const analysisData = await analyzeResponse.json()
      setResult(analysisData)
      setShowManualInput(false)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('De analyse duurde te lang. Probeer het opnieuw met een andere URL.')
      } else {
        setError(err instanceof Error ? err.message : 'Er ging iets mis')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero sectie */}
      {!result && !isLoading && (!error || showManualInput) && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-neutral-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-neutral-600" />
              <span className="text-sm text-neutral-600">Brandprompt</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-2 tracking-tight">
              Maak van je merk een superprompt.
            </h1>

            <h2 className="text-2xl md:text-3xl font-medium text-neutral-700 mb-4">
              Jouw AI klinkt niet als jij. Verander dat in 60 seconden.
            </h2>

            <p className="text-lg text-neutral-500 mb-12">
              Scherper dan je het zelf had beschreven.
            </p>

            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />

            {showManualInput && (
              <div className="mt-8 p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm animate-fade-in">
                <p className="text-neutral-700 mb-4">{error}</p>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Beschrijf je bedrijf: wat doe je, voor wie, en wat maakt jullie uniek?"
                  className="w-full p-4 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  rows={5}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || isLoading}
                  className="mt-4 w-full py-3 px-6 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Analyseer mijn merk
                </button>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 text-sm text-neutral-400">
            Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">Newfound</a>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !result && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <LoadingState steps={loadingSteps} currentStep={loadingStep} />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && !result && !showManualInput && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">{error}</h3>
            <button
              onClick={() => {
                setError(null)
                setUrl('')
                setShowManualInput(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Probeer opnieuw →
            </button>
          </div>
        </div>
      )}

      {/* Resultaat */}
      {result && (
        <div ref={resultRef} className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <BrandAnalysis
              result={result}
              onReset={() => {
                setResult(null)
                setUrl('')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      )}
    </main>
  )
}
