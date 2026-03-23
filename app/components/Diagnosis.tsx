'use client'

import { AlertCircle } from 'lucide-react'

interface DiagnosisProps {
  diagnose: string[]
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div className="rounded-btn overflow-hidden bg-[#f5f5f3]">
      <div className="p-6 md:p-8 border-b border-[#e0e0e0]">
        <h3 className="font-label text-lg text-primary">
          Wat vertelt jouw website over je merk
        </h3>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {diagnose.map((bullet, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-primary/80 font-body">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
