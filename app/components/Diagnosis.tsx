'use client'

import { Check, AlertTriangle, Lightbulb } from 'lucide-react'

interface DiagnosisProps {
  diagnose: {
    sterk: string
    mist: string
    implicatie: string
  }
}

export default function Diagnosis({ diagnose }: DiagnosisProps) {
  return (
    <div className="bg-amber-50 rounded-3xl border border-amber-100 overflow-hidden mb-8">
      <div className="p-6 md:p-8 border-b border-amber-100">
        <h3 className="text-sm font-medium text-amber-600 uppercase tracking-wider">
          Diagnose
        </h3>
      </div>

      <div className="p-6 md:p-8 space-y-6">

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 mb-1">Wat er sterk is</h4>
            <p className="text-neutral-700">{diagnose.sterk}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 mb-1">Wat ontbreekt</h4>
            <p className="text-neutral-700">{diagnose.mist}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 mb-1">Wat dit betekent</h4>
            <p className="text-neutral-700">{diagnose.implicatie}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
