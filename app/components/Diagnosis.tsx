'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div>
      <h3 className="font-heading text-white mb-2" style={{ fontSize: '32px', textTransform: 'uppercase' as const }}>
        Onze analyse
      </h3>
      <p className="font-label text-accent mb-8" style={{ fontSize: '15px' }}>
        Wat vertelt jouw website over je merk?
      </p>
      <div className="space-y-4">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-accent" />
            </div>
            <p className="text-white font-body" style={{ fontSize: '17px' }}>{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
