'use client'

import { useState } from 'react'
import { Check, Copy, Download, RefreshCw, AlertCircle, Mail, ArrowRight } from 'lucide-react'
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
      {/* Sectie 1: Header — wit */}
      <section className="bg-white" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <div className="text-center">
            <p className="label-style text-secondary mb-6">Brandprompt</p>

            <h1 className="font-heading text-primary mb-3">
              {result.companyName}
            </h1>

            <p className="text-secondary font-body" style={{ fontWeight: 300 }}>
              Hier is je merk, scherper dan je het zelf had beschreven
            </p>
          </div>
        </div>
      </section>

      {/* Sectie 2: Diagnose — wit */}
      <section className="bg-white" style={{ paddingBottom: '80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <Diagnosis diagnose={diagnose} />
        </div>
      </section>

      {/* Sectie 3: Superprompt — donker */}
      <section className="bg-[#202020] text-white" style={{ padding: '80px 0' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <div className="border-b border-white/10 pb-6 mb-8 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="label-style text-white/70">
                Jouw superprompt
              </h3>
              <p className="text-white/70 mt-2 font-body">
                Kopieer dit en laad het in je AI. Vanaf nu communiceert je AI vanuit jouw merk.
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-btn font-body font-medium hover:bg-neutral-100 transition-colors"
            >
              {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopiëren</>}
            </button>
          </div>

          <div className="space-y-10">
            <div>
              <h4 className="label-style text-white/70 mb-3">1. Wie je bent</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.wie_je_bent}</p>
            </div>

            <div>
              <h4 className="label-style text-white/70 mb-3">2. Wat jou onderscheidt</h4>
              <ul className="space-y-2">
                {superprompt.wat_jou_onderscheidt.map((punt, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 border border-white/20 rounded-btn flex items-center justify-center text-sm font-body text-white/70 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-white font-body">{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="label-style text-white/70 mb-3">3. Jouw klant</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.jouw_klant}</p>
            </div>

            <div>
              <h4 className="label-style text-white/70 mb-3">4. Zo klink je</h4>
              <div className="space-y-3">
                {superprompt.zo_klink_je.map((regel, index) => (
                  <div key={index} className="p-4 border border-white/10 rounded-btn">
                    <p className="text-white italic font-body">&quot;{regel}&quot;</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="label-style text-white/70 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                5. Dit zeg je nooit
              </h4>
              <ul className="space-y-2">
                {superprompt.dit_zeg_je_nooit.map((punt, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">×</span>
                    <span className="text-white font-body">{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="label-style text-white/70 mb-3">6. Jouw verhaal</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.jouw_verhaal}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sectie 4: Email capture — wit */}
      <section className="bg-white" style={{ padding: '80px 0' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          {emailCaptured ? (
            <div className="border border-[#e0e0e0] rounded-btn p-8 text-center animate-fade-in">
              <div className="w-12 h-12 border border-[#e0e0e0] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-label text-lg text-primary mb-2">Verstuurd!</h3>
              <p className="text-secondary font-body">
                Check je inbox. Je superprompt en handleiding zijn onderweg.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-btn font-body font-medium hover:bg-[#333333] transition-colors"
                >
                  {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopiëren</>}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 border border-[#e0e0e0] text-primary rounded-btn font-body font-medium hover:bg-neutral-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download als .md
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#e0e0e0] rounded-btn p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 border border-[#e0e0e0] rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-label text-primary mb-1">Ontvang je superprompt + handleiding</h3>
                  <p className="text-sm text-secondary font-body">
                    Sla je superprompt op en gebruik hem direct. We sturen je een handleiding hoe je hem in twee minuten instelt in ChatGPT of Claude. Zodat je AI vanaf nu altijd klinkt als jij.
                  </p>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@emailadres.nl"
                  className="flex-1 px-4 py-3 border border-[#e0e0e0] rounded-btn focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-body"
                  required
                />

                <button
                  type="submit"
                  disabled={!email.trim() || emailSubmitting}
                  className="px-6 py-3 bg-black text-white rounded-btn font-body font-medium hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {emailSubmitting ? 'Bezig...' : 'Ontvang mijn superprompt + handleiding'}
                </button>
              </form>

              {emailError && (
                <p className="mt-3 text-sm text-red-600 font-body">{emailError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sectie 5: Upsell gesprek — donker */}
      <section className="bg-[#202020] text-white" style={{ padding: '80px 0' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h3 className="font-label text-2xl text-white mb-4">
            Jouw merk verdient meer dan een websitescan.
          </h3>
          <p className="text-white font-body mb-8 leading-relaxed" style={{ opacity: 0.7 }}>
            Deze superprompt is gebaseerd op wat je website vertelt. Maar sterke merkcommunicatie gaat verder
            dan één pagina. Bij Newfound kijken we naar het hele plaatje zodat alles wat je zegt, schrijft
            en uitstraalt op elkaar aansluit.
          </p>
          <a
            href="mailto:hello@newfound.agency"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-btn font-body font-medium hover:bg-neutral-100 transition-colors"
          >
            Plan een gesprek van 15 minuten <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Sectie 6: Upsell volledig beeld — wit */}
      <section className="bg-white" style={{ padding: '80px 0' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h3 className="font-label text-2xl text-primary mb-4">
            Wil je het volledige beeld?
          </h3>
          <p className="text-secondary mb-8 leading-relaxed font-body">
            Een URL vertelt één kant van je verhaal. Wij analyseren je website, LinkedIn, offertes en bestaand
            merkmateriaal. Alles wat jouw merk vertelt op één plek. Het resultaat: een superprompt die niet
            gebaseerd is op wat er publiek staat, maar op wie je écht bent. Aangescherpt door een merkexpert.
          </p>

          <ul className="space-y-3 mb-8">
            {[
              'Scan van website, LinkedIn, offertes en merkdocumenten',
              'Merkaudit: wat klopt, wat mist, wat inconsistent is',
              'Superprompt gebouwd op basis van alle bronnen',
              'Intake gesprek vooraf: stuur je materiaal op, wij kijken er kritisch naar',
              'Menselijke review door Newfound',
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 border border-[#e0e0e0] rounded-btn flex items-center justify-center text-sm text-secondary mt-0.5 font-body">
                  {index + 1}
                </span>
                <span className="text-primary/80 font-body">{item}</span>
              </li>
            ))}
          </ul>

          <div className="border border-[#e0e0e0] rounded-btn p-5 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="label-style text-secondary">Van</span>
                <p className="text-primary/80 mt-1 font-body">Automatische analyse op basis van één URL</p>
              </div>
              <div>
                <span className="label-style text-secondary">Naar</span>
                <p className="text-primary/80 mt-1 font-body">Een scherp merkfundament op basis van alles wat je hebt</p>
              </div>
            </div>
          </div>

          <p className="text-secondary mb-8 font-body">
            Investering: <span className="font-body font-medium text-primary">vanaf €1.500</span>
          </p>

          <a
            href="mailto:hello@newfound.agency"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-btn font-body font-medium hover:bg-[#333333] transition-colors"
          >
            Vertel me hoe het werkt <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Nieuwe analyse */}
      <section className="bg-white py-16 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-body"
        >
          <RefreshCw className="w-4 h-4" />
          Analyseer een andere website
        </button>
      </section>
    </div>
  )
}
