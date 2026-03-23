'use client'

interface LoadingStateProps {
  steps: string[]
  currentStep: number
}

export default function LoadingState({ steps, currentStep }: LoadingStateProps) {
  return (
    <div className="text-center max-w-sm">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 mb-12">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-700
                ${index < currentStep ? 'bg-primary scale-100' : ''}
                ${index === currentStep ? 'bg-primary scale-125 progress-dot' : ''}
                ${index > currentStep ? 'bg-[#e0e0e0] scale-100' : ''}
              `}
            />
            {index < steps.length - 1 && (
              <div
                className={`
                  w-12 h-px transition-all duration-700
                  ${index < currentStep ? 'bg-primary' : 'bg-[#e0e0e0]'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current step text */}
      <div className="relative h-16">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`
              absolute inset-0 flex items-center justify-center
              transition-all duration-500
              ${index === currentStep ? 'opacity-100 transform translate-y-0' : ''}
              ${index < currentStep ? 'opacity-0 transform -translate-y-4' : ''}
              ${index > currentStep ? 'opacity-0 transform translate-y-4' : ''}
            `}
          >
            <p className="text-xl font-body text-primary" style={{ fontWeight: 400 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* Step counter */}
      <p className="mt-10 text-sm text-secondary/50 font-body" style={{ fontWeight: 300 }}>
        Stap {currentStep + 1} van {steps.length}
      </p>
    </div>
  )
}
