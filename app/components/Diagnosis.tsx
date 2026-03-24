'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div>
      <h3 className="font-heading text-white mb-6" style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', textTransform: 'uppercase' as const }}>
        Wat vertelt jouw website over je merk
      </h3>
      <div className="space-y-4">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-accent" />
            </div>
            <p className="text-white font-body">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
