'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, Download, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'
import SuperPrompt from './SuperPrompt'
import Diagnosis from './Diagnosis'

interface BrandAnalysisProps {
  result: {
    brandStructure: {
      wieZijnWe: string
      watMaaktOnderscheidend: string[]
      voorWieZijnWeEr: string
      zoKlinkenWe: string[]
      ditZeggenWeNooit: string[]
      onsVerhaal: string
      perKanaal: {
        linkedin: string
        offerte: string
        email: string
      }
    }
    superPrompt: string
    diagnose: {
      sterk: string
      mist: string
      implicatie: string
    }
    companyName: string
  }
  onReset: () => void
}

export default function BrandAnalysis({ result, onReset }: BrandAnalysisProps) {
  const [copied, setCopied] = useState(false)
  const [showCTA, setShowCTA] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCTA(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.superPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result.superPrompt], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.companyName.toLowerCase().replace(/\s+/g, '-')}-superprompt.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const { brandStructure, diagnose } = result

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-neutral-600" />
          <span className="text-sm text-neutral-600">Jouw merkstructuur</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">
          {result.companyName}
        </h2>

        <p className="text-neutral-500">
          Hier is je merk — scherper dan je het zelf had beschreven
        </p>
      </div>

      {/* Blok A — De merkstructuur */}
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Het verhaal (voor mensen)
          </h3>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* 1. Wie zijn we */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">1. Wie zijn we</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.wieZijnWe}</p>
          </section>

          {/* 2. Wat maakt ons onderscheidend */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">2. Wat maakt ons onderscheidend</h4>
            <ul className="space-y-2">
              {brandStructure.watMaaktOnderscheidend.map((punt, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-neutral-700">{punt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Voor wie zijn we er */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">3. Voor wie zijn we er</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.voorWieZijnWeEr}</p>
          </section>

          {/* 4. Zo klinken we */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">4. Zo klinken we</h4>
            <div className="space-y-3">
              {brandStructure.zoKlinkenWe.map((regel, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-neutral-700 italic">"{regel}"</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Dit zeggen we nooit */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              5. Dit zeggen we nooit
            </h4>
            <ul className="space-y-2">
              {brandStructure.ditZeggenWeNooit.map((punt, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">×</span>
                  <span className="text-neutral-700">{punt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Ons verhaal */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">6. Ons verhaal</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.onsVerhaal}</p>
          </section>

          {/* 7. Per kanaal */}
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">7. Per kanaal</h4>
            <div className="grid gap-4">
              <div className="p-4 border border-neutral-100 rounded-xl">
                <span className="text-sm font-medium text-neutral-400 uppercase">LinkedIn</span>
                <p className="text-neutral-700 mt-1">{brandStructure.perKanaal.linkedin}</p>
              </div>
              <div className="p-4 border border-neutral-100 rounded-xl">
                <span className="text-sm font-medium text-neutral-400 uppercase">Offerte</span>
                <p className="text-neutral-700 mt-1">{brandStructure.perKanaal.offerte}</p>
              </div>
              <div className="p-4 border border-neutral-100 rounded-xl">
                <span className="text-sm font-medium text-neutral-400 uppercase">Email</span>
                <p className="text-neutral-700 mt-1">{brandStructure.perKanaal.email}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Diagnose */}
      <Diagnosis diagnose={diagnose} />

      {/* Blok B — De superprompt */}
      <div className="bg-neutral-900 rounded-3xl overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            De superprompt (voor AI)
          </h3>
          <p className="text-neutral-300 mt-2">
            Kopieer dit en laad het in je AI. Vanaf nu communiceert je AI vanuit jouw merk.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <SuperPrompt content={result.superPrompt} />

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
            >
              {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopiëren</>}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 border border-neutral-700 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-4 h-4" /> Download als .md
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      {showCTA && (
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-8 md:p-12 text-center animate-fade-in border border-neutral-200">
          <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
            Wil je een sterkere superprompt?
          </h3>
          <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
            Één gebouwd op wat er écht in je merk zit, niet alleen wat er op je site staat.
          </p>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            Ja, ik wil meer →
          </a>
        </div>
      )}

      {/* Nieuwe analyse */}
      <div className="text-center mt-12">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Analyseer een andere website
        </button>
      </div>
    </div>
  )
}
