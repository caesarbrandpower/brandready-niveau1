'use client'

import { useState } from 'react'
import { Check, Copy, Download, RefreshCw, Sparkles, AlertCircle, Mail, ArrowRight } from 'lucide-react'
import SuperPrompt from './SuperPrompt'
import Diagnosis from './Diagnosis'

interface BrandAnalysisProps {
  result: {
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
  onReset: () => void
}

function buildSuperpromptText(companyName: string, sp: BrandAnalysisProps['result']['superprompt']): string {
  return `Je communiceert altijd vanuit het merk van ${companyName}. Dit betekent:

## 1. Wie je bent
${sp.wie_je_bent}

## 2. Wat jou onderscheidt
${sp.wat_jou_onderscheidt.map(p => `- ${p}`).join('\n')}

## 3. Jouw klant
${sp.jouw_klant}

## 4. Zo klink je
${sp.zo_klink_je.map(r => `- ${r}`).join('\n')}

## 5. Dit zeg je nooit
${sp.dit_zeg_je_nooit.map(g => `- ${g}`).join('\n')}

## 6. Jouw verhaal
${sp.jouw_verhaal}`
}

export default function BrandAnalysis({ result, onReset }: BrandAnalysisProps) {
  const [copied, setCopied] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const superpromptText = buildSuperpromptText(result.companyName, result.superprompt)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(superpromptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([superpromptText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.companyName.toLowerCase().replace(/\s+/g, '-')}-superprompt.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setEmailSubmitting(true)
    setEmailError(null)

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          superPrompt: superpromptText,
          companyName: result.companyName,
        }),
      })

      if (!response.ok) {
        throw new Error('Verzenden mislukt')
      }

      setEmailCaptured(true)
    } catch {
      setEmailError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  const { superprompt, diagnose } = result

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-neutral-600" />
          <span className="text-sm text-neutral-600">Brandprompt</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">
          {result.companyName}
        </h2>

        <p className="text-neutral-500">
          Hier is je merk — scherper dan je het zelf had beschreven
        </p>
      </div>

      {/* Sectie A — Diagnose (altijd zichtbaar) */}
      <Diagnosis diagnose={diagnose} />

      {/* Sectie B — Superprompt (leesbaar, kopieerknop gated) */}
      <div className="bg-neutral-900 rounded-3xl overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
              Jouw superprompt
            </h3>
            <p className="text-neutral-300 mt-2">
              Kopieer dit en laad het in je AI. Vanaf nu communiceert je AI vanuit jouw merk.
            </p>
          </div>

          <button
            onClick={emailCaptured ? handleCopy : undefined}
            disabled={!emailCaptured}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
              emailCaptured
                ? 'bg-white text-neutral-900 hover:bg-neutral-100 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> {emailCaptured ? 'Kopiëren' : 'Vul je e-mailadres in om te kopiëren'}</>}
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* 1. Wie je bent */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">1. Wie je bent</h4>
            <p className="text-neutral-200 leading-relaxed">{superprompt.wie_je_bent}</p>
          </section>

          {/* 2. Wat jou onderscheidt */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">2. Wat jou onderscheidt</h4>
            <ul className="space-y-2">
              {superprompt.wat_jou_onderscheidt.map((punt, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-neutral-400 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-neutral-200">{punt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Jouw klant */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">3. Jouw klant</h4>
            <p className="text-neutral-200 leading-relaxed">{superprompt.jouw_klant}</p>
          </section>

          {/* 4. Zo klink je */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">4. Zo klink je</h4>
            <div className="space-y-3">
              {superprompt.zo_klink_je.map((regel, index) => (
                <div key={index} className="p-4 bg-neutral-800 rounded-xl">
                  <p className="text-neutral-200 italic">&quot;{regel}&quot;</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Dit zeg je nooit */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              5. Dit zeg je nooit
            </h4>
            <ul className="space-y-2">
              {superprompt.dit_zeg_je_nooit.map((punt, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">×</span>
                  <span className="text-neutral-200">{punt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Jouw verhaal */}
          <section>
            <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">6. Jouw verhaal</h4>
            <p className="text-neutral-200 leading-relaxed">{superprompt.jouw_verhaal}</p>
          </section>
        </div>
      </div>

      {/* Email capture — onder superprompt */}
      <div className="mb-8">
        {emailCaptured ? (
          <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100 animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Verstuurd!</h3>
            <p className="text-neutral-600">
              Check je inbox — je superprompt en handleiding zijn onderweg.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopiëren</>}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Download als .md
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Ontvang je superprompt als bestand + handleiding</h3>
                <p className="text-sm text-neutral-500">
                  We sturen je de superprompt als .md bestand, plus een korte handleiding: zo gebruik je hem direct in ChatGPT, Claude en je andere AI-tools.
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@emailadres.nl"
                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                required
              />

              <button
                type="submit"
                disabled={!email.trim() || emailSubmitting}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {emailSubmitting ? 'Bezig...' : 'Ontvang je superprompt als bestand + handleiding →'}
              </button>
            </form>

            {emailError && (
              <p className="mt-3 text-sm text-red-500">{emailError}</p>
            )}
          </div>
        )}
      </div>

      {/* Sectie C — Upsell blok Newfound */}
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-8 md:p-12 border border-neutral-200 mb-8">
        <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
          Wil je weten wat er écht schuilt achter je merk?
        </h3>
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Deze superprompt is een begin — gebaseerd op wat je website vertelt. Bij Newfound gaan we verder.
          We scherpen je merkfundament aan, ontwikkelen een concept dat blijft hangen en zorgen dat je merk
          consistent werkt op elk moment dat het telt.
        </p>
        <a
          href="mailto:hello@newfound.agency"
          className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
        >
          Gesprek aanvragen <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Upsell blok — Niveau 2 */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 md:p-12 mb-8">
        <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
          Wil je een volledig beeld van je merk?
        </h3>
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Niveau 1 scant je website. Niveau 2 gaat verder. We analyseren alles wat jouw merk vertelt:
          je website, je LinkedIn, je offertes en bestaand materiaal. Meerdere bronnen, één compleet beeld.
          Het resultaat: een superprompt die niet gebaseerd is op wat er publiek staat, maar op wie je écht bent.
          Aangescherpt door Newfound.
        </p>

        <ul className="space-y-3 mb-6">
          {[
            'Scan van website (meerdere pagina\'s), LinkedIn, offertes en documenten',
            'Merkaudit: wat klopt, wat mist, wat inconsistent is',
            'Superprompt gebouwd op basis van alle bronnen',
            'Menselijke review door Newfound',
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600 mt-0.5">
                {index + 1}
              </span>
              <span className="text-neutral-700">{item}</span>
            </li>
          ))}
        </ul>

        <div className="bg-neutral-50 rounded-xl p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-neutral-400 uppercase">Van</span>
              <p className="text-neutral-700 mt-1">Automatische analyse op basis van één URL</p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-400 uppercase">Naar</span>
              <p className="text-neutral-700 mt-1">Een scherp merkfundament op basis van alles wat je hebt</p>
            </div>
          </div>
        </div>

        <p className="text-neutral-500 mb-6">
          Investering: <span className="font-semibold text-neutral-900">vanaf €1.500</span>
        </p>

        <a
          href="mailto:hello@newfound.agency"
          className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
        >
          Vertel me meer <ArrowRight className="w-4 h-4" />
        </a>
      </div>

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
