'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div className="bg-amber-50 rounded-3xl border border-amber-100 overflow-hidden mb-8">
      <div className="p-6 md:p-8 border-b border-amber-100">
        <h3 className="text-lg font-semibold text-neutral-900">
          Wat vertelt jouw website over je merk
        </h3>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-neutral-700">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
