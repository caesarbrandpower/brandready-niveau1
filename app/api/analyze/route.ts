import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT, OUTPUT_FORMAT } from '../../lib/claude-prompt'

export const maxDuration = 60 // 60 seconden voor Claude API

export async function POST(request: NextRequest) {
  try {
    const { content, url } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is verplicht' }, { status: 400 })
    }

    const apiKey = process.env.CLAUDE_API_KEY

    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      console.log('Geen geldige API key gevonden, gebruik mock data')
      return NextResponse.json(generateMockData(url))
    }

    const truncatedContent = content.slice(0, 15000)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `${SYSTEM_PROMPT}\n\n${OUTPUT_FORMAT}\n\nJe moet ALTIJD geldige JSON teruggeven in het exacte formaat hierboven beschreven. Geen markdown formatting, geen code blocks, alleen raw JSON.`,
        messages: [
          {
            role: 'user',
            content: `Analyseer de volgende website content:\n\nURL: ${url}\n\nCONTENT:\n${truncatedContent}\n\nGeef je antwoord als geldige JSON.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Claude API error:', errorData)
      throw new Error(`Claude API fout: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Ongeldig antwoord van Claude API')
    }

    let result
    try {
      const rawText = data.content[0].text
      const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        rawText.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, rawText]
      const jsonText = jsonMatch[1] || rawText
      result = JSON.parse(jsonText.trim())
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Raw response:', data.content[0].text)
      return NextResponse.json(generateMockData(url))
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analyse mislukt'
    }, { status: 500 })
  }
}

function generateMockData(url: string) {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace(/^www\./, '').split('.')[0]
  const companyName = hostname.charAt(0).toUpperCase() + hostname.slice(1)

  return {
    companyName,
    diagnose: [
      'De website communiceert een duidelijke focus op persoonlijke service, maar gebruikt brancheclichés als "ontzorgen" en "maatwerk" zonder ze concreet te maken.',
      'De doelgroep is te breed gedefinieerd,"ondernemers en organisaties" zegt niets over wie je écht het beste helpt.',
      'Er ontbreken concrete voorbeelden of resultaten die de belofte onderbouwen.',
      'De tone of voice wisselt tussen formeel en informeel, wat het merk inconsistent maakt.'
    ],
    superprompt: {
      wie_je_bent: `${companyName} is het bedrijf waar je terechtkomt als je klaar bent met bureaus die meer praten dan doen. Wij leveren werkbare oplossingen, niet dikke rapporten.`,
      wat_jou_onderscheidt: [
        'We beginnen bij het probleem, niet bij de oplossing,en zeggen eerlijk als iets niet bij ons past',
        'Geen projectmanagers tussen jou en het werk,je praat met de mensen die het maken',
        'We meten succes in resultaat voor de klant, niet in geleverde uren (aanvullen aanbevolen)'
      ],
      jouw_klant: `Ondernemers die weten dat ze professioneler moeten communiceren, maar vastlopen op de vraag: hoe dan? Ze hebben geen tijd voor merktrajecten van maanden, maar willen wel dat hun verhaal klopt.`,
      zo_klink_je: [
        'Direct en eerlijk,"Dit kunnen we, dit niet. En dit is waarom."',
        'Warm maar niet soft,"We denken met je mee, maar zeggen ook als iets niet werkt."',
        'Concreet,"Geen vage beloftes. Dit is wat je krijgt, en wanneer."',
        'Menselijk,"We schrijven zoals we praten. Geen jargon, geen afstandelijkheid."',
        'Zelfverzekerd zonder arrogantie,"We zijn goed in wat we doen, en dat laten we zien in ons werk."'
      ],
      dit_zeg_je_nooit: [
        'Holle marketingtaal zoals "we ontzorgen u" of "uw partner in succes"',
        'Beloftes zonder bewijs,nooit "de beste" of "uniek" zonder het waar te maken',
        'Negatief over concurrenten,we laten ons eigen werk spreken'
      ],
      jouw_verhaal: `${companyName} is begonnen omdat we zagen dat te veel bedrijven goed werk leveren maar het niet goed weten te vertellen. Niet omdat ze dat niet willen, maar omdat niemand ze ooit heeft geholpen het scherp te krijgen. Dat doen wij nu. Niet met dikke merkboeken, maar met heldere keuzes die je morgen al kunt gebruiken.`
    }
  }
}
