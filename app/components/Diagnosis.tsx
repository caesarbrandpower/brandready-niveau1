'use client'

import { Check, X } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
  implicatie?: string
}

export default function Diagnosis({ diagnose, implicatie }: DiagnosisProps) {
  const sterke = diagnose.slice(0, 2)
  const verbeter = diagnose.slice(2, 4)

  return (
    <div>
      <h3 className="font-heading text-white mb-2" style={{ fontSize: '32px', textTransform: 'uppercase' as const }}>
        Onze analyse
      </h3>
      <p className="font-label text-accent mb-8" style={{ fontSize: '15px' }}>
        Wat vertelt jouw website over je merk?
      </p>

      <div className="space-y-4 mb-6">
        {sterke.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5 text-accent" />
            </div>
            <p className="text-white font-body" style={{ fontSize: '17px' }}>{bullet}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        {verbeter.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <X className="w-5 h-5 text-accent-pink" />
            </div>
            <p className="text-white font-body" style={{ fontSize: '17px' }}>{bullet}</p>
          </div>
        ))}
      </div>

      {implicatie && (
        <div className="mb-10 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
          <p className="text-white font-body italic" style={{ fontSize: '15px' }}>
            {implicatie}
          </p>
        </div>
      )}

      <p className="text-white font-body" style={{ fontSize: '16px' }}>
        Samen scherper naar je merk kijken? We helpen je graag. <a href="mailto:hello@newfound.agency" className="underline hover:opacity-80 transition-opacity" style={{ color: '#8463ff' }}>Mail ons</a>.
      </p>
    </div>
  )
}
