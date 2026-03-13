'use client'

interface SuperPromptProps {
  content: string
}

export default function SuperPrompt({ content }: SuperPromptProps) {
  // Split de content in regels voor betere weergave
  const lines = content.split('\n')

  return (
    <div className="bg-neutral-950 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
        </div>
        <span className="ml-3 text-xs text-neutral-500 font-mono">superprompt.md</span>
      </div>

      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">
          {lines.map((line, index) => {
            // Highlight headers
            if (line.startsWith('#')) {
              return (
                <span key={index} className="text-neutral-100 font-semibold">
                  {line}
                  {'\n'}
                </span>
              )
            }
            // Highlight bullet points
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              return (
                <span key={index} className="text-neutral-400">
                  {line}
                  {'\n'}
                </span>
              )
            }
            // Highlight numbered lists
            if (/^\d+\./.test(line.trim())) {
              return (
                <span key={index} className="text-neutral-400">
                  {line}
                  {'\n'}
                </span>
              )
            }
            return (
              <span key={index}>
                {line}
                {'\n'}
              </span>
            )
          })}
        </pre>
      </div>
    </div>
  )
}
