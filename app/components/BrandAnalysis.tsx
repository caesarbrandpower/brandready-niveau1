'use client'

import { useState } from 'react'
import { Check, Copy, Download, RefreshCw, Sparkles, AlertCircle, Mail, ArrowRight } from 'lucide-react'
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
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

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
          superPrompt: result.superPrompt,
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
          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">1. Wie zijn we</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.wieZijnWe}</p>
          </section>

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

          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">3. Voor wie zijn we er</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.voorWieZijnWeEr}</p>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">4. Zo klinken we</h4>
            <div className="space-y-3">
              {brandStructure.zoKlinkenWe.map((regel, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-neutral-700 italic">&quot;{regel}&quot;</p>
                </div>
              ))}
            </div>
          </section>

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

          <section>
            <h4 className="text-lg font-semibold text-neutral-900 mb-3">6. Ons verhaal</h4>
            <p className="text-neutral-700 leading-relaxed">{brandStructure.onsVerhaal}</p>
          </section>

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
              onClick={emailCaptured ? handleDownload : undefined}
              disabled={!emailCaptured}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-lg font-medium transition-colors ${
                emailCaptured
                  ? 'border-neutral-700 text-white hover:bg-neutral-800 cursor-pointer'
                  : 'border-neutral-700 text-neutral-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Download className="w-4 h-4" />
              {emailCaptured ? 'Download als .md' : 'Vul je e-mailadres in om te downloaden'}
            </button>
          </div>
        </div>
      </div>

      {/* Email capture */}
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
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Ontvang je superprompt + handleiding</h3>
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
                {emailSubmitting ? 'Bezig...' : 'Stuur me de handleiding →'}
              </button>
            </form>

            {emailError && (
              <p className="mt-3 text-sm text-red-500">{emailError}</p>
            )}
          </div>
        )}
      </div>

      {/* Upsell blok — Newfound */}
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
