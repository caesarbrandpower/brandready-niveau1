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
    if (!emailCaptured) return
    await navigator.clipboard.writeText(superpromptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!emailCaptured) return
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setEmailError('Vul een geldig e-mailadres in')
      return
    }

    setEmailSubmitting(true)
    setEmailError(null)

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          superprompt: superpromptText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = data?.error || 'Verzenden mislukt'
        console.error('send-email debug:', data?.debug)
        throw new Error(detail)
      }

      if (data?.debug) {
        console.log('send-email debug:', data.debug)
      }

      setEmailCaptured(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Er ging iets mis'
      setEmailError(`${msg}. Probeer het opnieuw.`)
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
          <h2 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }}>
            Jouw merk als superprompt
          </h2>
          <p className="text-white font-body" style={{ fontSize: '15px', opacity: 0.7, maxWidth: '520px', margin: '0 auto' }}>
            Jouw superprompt staat hieronder. Laat je e-mailadres achter om hem te kopiëren of te downloaden.
          </p>
        </div>
      </section>

      {/* Superprompt content */}
      <section className="bg-dark" style={{ padding: '0 0 80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px', userSelect: emailCaptured ? 'auto' : 'none', WebkitUserSelect: emailCaptured ? 'auto' : 'none' }}>
          <div className="space-y-12">
            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>1. Wie je bent</h4>
              <p className="text-white leading-relaxed font-body" style={{ fontSize: '17px' }}>{superprompt.wie_je_bent}</p>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>2. Wat jou onderscheidt</h4>
              <ul className="space-y-3">
                {superprompt.wat_jou_onderscheidt.map((punt, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 border border-accent/40 rounded-btn flex items-center justify-center font-body text-accent mt-0.5" style={{ fontSize: '14px' }}>
                      {index + 1}
                    </span>
                    <span className="text-white font-body" style={{ fontSize: '17px' }}>{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>3. Jouw klant</h4>
              <p className="text-white leading-relaxed font-body" style={{ fontSize: '17px' }}>{superprompt.jouw_klant}</p>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>4. Zo klink je</h4>
              <div className="space-y-3">
                {superprompt.zo_klink_je.map((regel, index) => (
                  <div key={index} className="p-4 border border-white/10 rounded-btn bg-dark-light/50">
                    <p className="text-white italic font-body" style={{ fontSize: '17px' }}>&quot;{regel}&quot;</p>
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
                    <span className="text-white font-body" style={{ fontSize: '17px' }}>{punt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-3 font-body" style={{ fontSize: '1.4rem', fontWeight: 500 }}>6. Jouw verhaal</h4>
              <p className="text-white leading-relaxed font-body" style={{ fontSize: '17px' }}>{superprompt.jouw_verhaal}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis — card-like rapport block */}
      <section className="bg-dark" style={{ padding: '48px 0 80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '48px 40px' }}>
            <Diagnosis diagnose={diagnose.slice(0, 4)} />
          </div>
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
              <p className="text-white font-body mb-6" style={{ fontSize: '17px' }}>
                Je superprompt is onderweg! Check je inbox.
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
                <a
                  href="/brandprompt-handleiding.pdf"
                  download="brandprompt-handleiding.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 border border-white/40 text-white rounded-btn font-body font-medium hover:bg-white/5 transition-colors"
                >
                  Download handleiding <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="font-label text-white mb-4" style={{ fontSize: '2.2rem' }}>
                Ontvang jouw superprompt + handleiding
              </h3>
              <p className="text-white font-body mb-8 leading-relaxed" style={{ maxWidth: '560px', margin: '0 auto 32px', fontSize: '17px' }}>
                Kopieer hem in ChatGPT, Claude of een andere AI. Vanaf nu klinkt jouw AI alsof jij het zelf schrijft. We sturen ook een stap-voor-stap handleiding mee zodat je binnen twee minuten aan de slag kunt.
              </p>

              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                  <span className="text-white font-body" style={{ fontSize: '17px' }}>Je superprompt, klaar om te gebruiken</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                  <span className="text-white font-body" style={{ fontSize: '17px' }}>Je superprompt als .md bestand, direct klaar voor gebruik in ChatGPT, Claude of elk ander AI-systeem</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                  <span className="text-white font-body" style={{ fontSize: '17px' }}>Stap-voor-stap handleiding, ook als je nog nooit met AI hebt gewerkt</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                  <span className="text-white font-body" style={{ fontSize: '17px' }}>Gratis, we sturen het gelijk op</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@emailadres.nl"
                  className="w-full sm:flex-1 px-4 py-3.5 border border-white/30 rounded-btn focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-white/60 transition-all font-body text-white placeholder:text-white/50"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  required
                />

                <button
                  type="submit"
                  disabled={!email.trim() || emailSubmitting}
                  className="w-full sm:w-auto px-6 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
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
          <p className="font-label text-accent mb-6" style={{ fontSize: '1rem' }}>
            Brandprompt Plus
          </p>
          <h3 className="font-heading text-white mb-6" style={{ fontSize: 'clamp(28px, 4vw, 48px)', textTransform: 'uppercase' as const, lineHeight: 1.05 }}>
            Jouw Merk AI-Paspoort.
          </h3>
          <p className="text-white font-body mb-10" style={{ fontSize: '17px' }}>
            Wil je nog scherpere resultaten? Met Brandprompt Plus maken we jouw Merk AI-Paspoort. Niet op basis van één URL, maar op basis van alles wat jouw merk vertelt.
          </p>

          {/* Van/Naar in kader */}
          <div className="grid grid-cols-2 gap-8 mb-10" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '24px' }}>
            <div>
              <span className="label-style text-accent">Van</span>
              <p className="text-white mt-2 font-body" style={{ fontSize: '1.1rem' }}>Automatische analyse op basis van één URL</p>
            </div>
            <div>
              <span className="label-style text-accent">Naar</span>
              <p className="text-white mt-2 font-body" style={{ fontSize: '1.1rem' }}>Een AI die jouw merk van binnen kent. Op basis van alles wat je hebt, aangescherpt door een merkexpert</p>
            </div>
          </div>

          {/* Wat je ontvangt */}
          <h4 className="font-heading text-white mb-4" style={{ fontSize: '1rem', textTransform: 'uppercase' as const }}>
            Wat je ontvangt
          </h4>
          <ul className="space-y-3 mb-10">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span className="text-white font-body" style={{ fontSize: '17px' }}>Jouw Merk AI-paspoort. Volledig uitgewerkt document, klaar om te laden in elk AI-systeem</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span className="text-white font-body" style={{ fontSize: '17px' }}>Gemaakt op basis van website, LinkedIn, presentaties en merkdocumenten</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span className="text-white font-body" style={{ fontSize: '17px' }}>Aangescherpt door een merkexpert</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
              <span className="text-white font-body" style={{ fontSize: '17px' }}>Handleiding om het in ChatGPT en Claude in te stellen</span>
            </li>
          </ul>

          {/* Stappenlijst */}
          <div className="bg-dark-light rounded-btn p-6 md:p-8 mb-10 border border-white/5">
            <ul className="space-y-4">
              {[
                'Scan van website, LinkedIn, presentaties en merkdocumenten',
                'Merkaudit: wat klopt, wat mist, wat inconsistent is',
                'Superprompt gebouwd op basis van alle bronnen',
                'Intake gesprek vooraf: stuur je materiaal op, wij kijken er kritisch naar',
                'Menselijke review door merkexpert',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center text-accent mt-0.5 font-body" style={{ fontSize: '14px' }}>
                    {index + 1}
                  </span>
                  <span className="text-white font-body" style={{ fontSize: '17px' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <a
              href="mailto:hello@newfound.agency"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all duration-200"
            >
              Stuur me meer info <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-white font-body" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Vanaf €1.500
            </span>
          </div>
        </div>
      </section>

      {/* Newfound afsluitsectie */}
      <section style={{ padding: '60px 0', background: 'rgba(255,255,255,0.04)' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '540px' }}>
          <p className="text-white font-body leading-relaxed mb-8" style={{ fontSize: '17px' }}>
            Gemaakt door Newfound. Het branding bureau voor groei. Strategie, creatie en slimme AI-tools die jouw merk elke dag laten werken. Meer weten? Bel of mail ons gerust.
          </p>
          <a
            href="https://newfound.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-white text-white rounded-btn font-body hover:bg-white/5 transition-colors mb-4"
          >
            Bekijk wat we doen <ArrowRight className="w-4 h-4" />
          </a>
          <p>
            <a
              href="tel:+31627525635"
              className="text-white font-body hover:text-white/80 transition-colors"
              style={{ fontSize: '15px', opacity: 0.6 }}
            >
              Of bel direct: +31 6 27 52 56 35
            </a>
          </p>
        </div>
      </section>

      {/* Nieuwe superprompt */}
      <section className="bg-dark py-16 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-white/50 hover:text-accent transition-colors font-body"
        >
          Analyseer een nieuw merk <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  )
}
