'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div className="rounded-btn overflow-hidden bg-dark-light border border-white/5">
      <div className="p-6 md:p-8 border-b border-white/10">
        <h3 className="font-label text-lg text-white">
          Wat vertelt jouw website over je merk
        </h3>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-accent" />
            </div>
            <p className="text-white/70 font-body">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
