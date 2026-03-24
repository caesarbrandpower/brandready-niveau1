'use client'

import { useState } from 'react'
import { Check, Copy, Download, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'
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
      {/* Company name */}
      <section className="bg-dark" style={{ paddingTop: '80px', paddingBottom: '24px' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <h1 className="font-heading text-white" style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>
            {result.companyName}
          </h1>
        </div>
      </section>

      {/* Label + Copy button */}
      <section className="bg-dark" style={{ paddingBottom: '64px' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <h2 className="font-heading text-white mb-8" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }}>
            Jouw merk als superprompt
          </h2>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all text-lg"
          >
            {copied ? <><Check className="w-5 h-5" /> Gekopieerd!</> : <><Copy className="w-5 h-5" /> Kopieer superprompt</>}
          </button>
        </div>
      </section>

      {/* Superprompt content — section titles: Satoshi 1.4rem white, body: pure white */}
      <section className="bg-dark" style={{ padding: '0 0 80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <div className="space-y-12">
            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>1. Wie je bent</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.wie_je_bent}</p>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>2. Wat jou onderscheidt</h4>
              <ul className="space-y-3">
                {superprompt.wat_jou_onderscheidt.map((punt, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 border border-accent/40 rounded-btn flex items-center justify-center text-sm font-body text-accent mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-white font-body">{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>3. Jouw klant</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.jouw_klant}</p>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>4. Zo klink je</h4>
              <div className="space-y-3">
                {superprompt.zo_klink_je.map((regel, index) => (
                  <div key={index} className="p-4 border border-white/10 rounded-btn bg-dark-light/50">
                    <p className="text-white italic font-body">&quot;{regel}&quot;</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body flex items-center gap-2" style={{ fontSize: '1.4rem', fontWeight: 500 }}>
                <AlertCircle className="w-5 h-5 text-accent-pink" />
                5. Dit zeg je nooit
              </h4>
              <ul className="space-y-2">
                {superprompt.dit_zeg_je_nooit.map((punt, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent-pink mt-1">×</span>
                    <span className="text-white font-body">{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>6. Jouw verhaal</h4>
              <p className="text-white leading-relaxed font-body">{superprompt.jouw_verhaal}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.03)' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <Diagnosis diagnose={diagnose.slice(0, 3)} />
        </div>
      </section>

      {/* Email lead sectie — gradient lines top/bottom, distinct bg */}
      <div className="gradient-line" />
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.04)' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          {emailCaptured ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading text-white mb-2" style={{ fontSize: 'clamp(24px, 3vw, 36px)', textTransform: 'uppercase' as const }}>Verstuurd!</h3>
              <p className="text-white font-body mb-6">
                Check je inbox. Je superprompt en handleiding zijn onderweg.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all"
                >
                  {copied ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopiëren</>}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white rounded-btn font-body font-medium hover:bg-white/5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download als .md
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="font-label text-white mb-4" style={{ fontSize: '1.8rem' }}>
                Ontvang jouw superprompt op mail
              </h3>
              <p className="text-white font-body mb-8 leading-relaxed" style={{ maxWidth: '560px', margin: '0 auto 32px' }}>
                Kopieer hem in ChatGPT, Claude of een andere AI. Vanaf nu klinkt jouw AI alsof jij het zelf schrijft. We sturen ook een stap-voor-stap handleiding mee zodat je binnen twee minuten aan de slag kunt, ook als je nog nooit met AI hebt gewerkt.
              </p>

              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white font-body">Je superprompt, klaar om te gebruiken</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white font-body">Stap-voor-stap handleiding voor ChatGPT én Claude</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white font-body">Gratis. Alleen je e-mailadres, we sturen het gelijk op</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@emailadres.nl"
                  className="flex-1 px-4 py-3.5 border border-white/30 rounded-btn focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-white/60 transition-all font-body text-white placeholder:text-white/50"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  required
                />

                <button
                  type="submit"
                  disabled={!email.trim() || emailSubmitting}
                  className="px-6 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  {emailSubmitting ? 'Bezig...' : 'Stuur me de superprompt'}
                  {!emailSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {emailError && (
                <p className="mt-3 text-sm text-accent-pink font-body">{emailError}</p>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="gradient-line" />

      {/* Upsell — Brandprompt Plus */}
      <section className="bg-dark" style={{ padding: '96px 0' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <p className="label-style text-accent mb-6">Brandprompt Plus</p>
          <h3 className="font-heading text-white mb-3" style={{ fontSize: 'clamp(28px, 4vw, 48px)', textTransform: 'uppercase' as const, lineHeight: 1.05 }}>
            Jouw AI kent je merk van binnen en buiten.
          </h3>
          <p className="text-white font-body mb-10" style={{ fontSize: '1.1rem' }}>
            Alles wat je schrijft, klinkt zoals jij.
          </p>

          {/* Van/Naar */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <span className="label-style text-accent">Van</span>
              <p className="text-white mt-2 font-body" style={{ fontSize: '1.1rem' }}>Automatische analyse op basis van één URL</p>
            </div>
            <div>
              <span className="label-style text-accent">Naar</span>
              <p className="text-white mt-2 font-body" style={{ fontSize: '1.1rem' }}>Een AI die jouw merk van binnen kent. Op basis van alles wat je hebt, aangescherpt door een merkexpert</p>
            </div>
          </div>

          {/* Stappenlijst — purple numbers, white text */}
          <div className="bg-dark-light rounded-btn p-6 md:p-8 mb-10 border border-white/5">
            <ul className="space-y-4">
              {[
                'Scan van website, LinkedIn, presentaties en merkdocumenten',
                'Merkaudit: wat klopt, wat mist, wat inconsistent is',
                'Superprompt gebouwd op basis van alle bronnen',
                'Intake gesprek vooraf: stuur je materiaal op, wij kijken er kritisch naar',
                'Menselijke review door Newfound',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center text-sm text-accent mt-0.5 font-body">
                    {index + 1}
                  </span>
                  <span className="text-white font-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Wat je ontvangt */}
          <div className="mb-10">
            <p className="label-style text-accent mb-4">Wat je ontvangt</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span className="text-white font-body">Jouw Merk AI-paspoort. Volledig uitgewerkt document, klaar om te laden in elk AI-systeem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span className="text-white font-body">Handleiding voor ChatGPT en Claude</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span className="text-white font-body">Gemaakt op basis van website, LinkedIn, presentaties en merkdocumenten. Aangescherpt door een merkexpert</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <a
              href="mailto:hello@newfound.agency"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all duration-200"
            >
              Kom in contact <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-white font-body" style={{ fontSize: '1.1rem' }}>
              Investering: <span className="font-medium" style={{ fontWeight: 700 }}>vanaf €1.500</span>
            </span>
          </div>
        </div>
      </section>

      {/* Nieuwe analyse */}
      <section className="bg-dark py-16 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-white/50 hover:text-accent transition-colors font-body"
        >
          <RefreshCw className="w-4 h-4" />
          Analyseer een andere website
        </button>
      </section>
    </div>
  )
}
