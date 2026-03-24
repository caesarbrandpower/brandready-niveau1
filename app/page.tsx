'use client'

import { useState, useRef, useEffect } from 'react'
import UrlInput from './components/UrlInput'
import LoadingState from './components/LoadingState'
import BrandAnalysis from './components/BrandAnalysis'

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
    <main className="min-h-screen bg-dark">
      {/* Navbar with gradient background — full bleed */}
      <nav className="gradient-navbar" style={{ height: '72px', paddingLeft: '24px', paddingRight: '24px' }}>
        <a href="https://newfound.agency" target="_blank">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg" height={18} alt="Newfound" style={{ height: '18px' }} />
        </a>
      </nav>

      {/* Hero sectie */}
      {!result && !isLoading && (!error || showManualInput) && (
        <div className="flex flex-col items-center min-h-[calc(100vh-72px)]">
          <div className="flex-1 flex flex-col justify-center w-full mx-auto text-center px-4" style={{ maxWidth: '680px' }}>
            <p className="label-style text-accent mb-6 animate-hero-title">Brandprompt</p>

            <h1 className="font-heading text-white mb-5 animate-hero-title">
              Maak van je merk<br />een superprompt.
            </h1>

            <h2 className="text-white mb-3 animate-hero-subtitle">
              Jouw AI klinkt niet als jij. Verander dat in 60 seconden.
            </h2>

            <p className="text-white/60 mb-16 font-body animate-hero-body" style={{ fontWeight: 300 }}>
              Scherper dan je het zelf had beschreven.
            </p>

            <div className="animate-hero-cta">
              <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
            </div>

            {showManualInput && (
              <div className="mt-10 p-6 bg-dark-light border border-white/10 rounded-btn animate-fade-in text-left">
                <p className="text-white mb-4">{error}</p>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Beschrijf je bedrijf: wat doe je, voor wie, en wat maakt jullie uniek?"
                  className="w-full p-4 bg-dark border border-white/20 rounded-btn resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-body text-white placeholder:text-white/50"
                  rows={5}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || isLoading}
                  className="mt-4 w-full py-3 px-6 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Analyseer mijn merk
                </button>
              </div>
            )}
          </div>

          <div className="pb-8 text-sm text-white/50 animate-hero-footer">
            Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-accent transition-colors">Newfound</a>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !result && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <LoadingState steps={loadingSteps} currentStep={loadingStep} />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && !result && !showManualInput && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-accent">!</span>
            </div>
            <h3 className="font-body text-xl font-normal text-white mb-3">{error}</h3>
            <button
              onClick={() => {
                setError(null)
                setUrl('')
                setShowManualInput(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )}

      {/* Resultaat */}
      {result && (
        <div ref={resultRef}>
          <BrandAnalysis
            result={result}
            onReset={() => {
              setResult(null)
              setUrl('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* Footer */}
      {result && (
        <footer className="py-12 text-center text-sm text-white/50 bg-dark">
          Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-accent transition-colors">Newfound</a>
        </footer>
      )}
    </main>
  )
}
