'use client'

interface LoadingStateProps {
  steps: string[]
  currentStep: number
}

export default function LoadingState({ steps, currentStep }: LoadingStateProps) {
  return (
    <div className="text-center max-w-md">
      <div className="mb-8">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-neutral-100 rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-neutral-900 rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`
              transition-all duration-500
              ${index === currentStep ? 'opacity-100 transform translate-y-0' : ''}
              ${index < currentStep ? 'opacity-40 transform -translate-y-1' : ''}
              ${index > currentStep ? 'opacity-0 transform translate-y-2 absolute' : ''}
            `}
          >
            <p className="text-lg font-medium text-neutral-900">{step}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-neutral-400">
        Dit duurt ongeveer 30 seconden
      </p>
    </div>
  )
}
