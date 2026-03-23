'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div>
      <h4 className="label-style text-white/40 mb-4">Wat vertelt jouw website over je merk</h4>
      <div className="space-y-3">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-accent/50" />
            </div>
            <p className="text-white/50 font-body text-sm">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
