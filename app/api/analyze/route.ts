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
      'De website communiceert een duidelijke focus op persoonlijke service. Tegelijkertijd worden brancheclichés als "ontzorgen" en "maatwerk" gebruikt zonder ze concreet te maken.',
      'De doelgroep is te breed gedefinieerd. "Ondernemers en organisaties" zegt niets over wie je écht het beste helpt.',
      'Er ontbreken concrete voorbeelden of resultaten die de belofte onderbouwen.',
      'De tone of voice wisselt tussen formeel en informeel, wat het merk inconsistent maakt.'
    ],
    implicatie: 'Een merk dat klinkt als alle anderen trekt ook dezelfde klanten als alle anderen. Of geen.',
    superprompt: {
      wie_je_bent: `Je schrijft altijd namens ${companyName}, een bureau dat bedrijven helpt hun communicatie scherp te krijgen. Schrijf in de wij-vorm. Nooit in de ik-vorm. Wij leveren werkbare oplossingen, geen dikke rapporten.`,
      wat_jou_onderscheidt: [
        'Benoem altijd dat we beginnen bij het probleem, niet bij de oplossing. Koppel aan het resultaat dat de klant sneller weet waar die aan toe is. Nooit beloven dat we "alles kunnen".',
        'Benoem altijd het directe contact. Geen projectmanagers ertussen. Koppel aan het resultaat dat de klant praat met de mensen die het werk doen. Nooit abstracte termen als "korte lijnen".',
        'Benoem altijd dat we succes meten in resultaat voor de klant, niet in geleverde uren (aanvullen aanbevolen).'
      ],
      jouw_klant: `Je schrijft altijd voor ondernemers die weten dat ze professioneler moeten communiceren, maar vastlopen op de vraag: hoe dan? Gebruik hun taalgebruik. Spreek hun frustratie aan: ze hebben geen tijd voor merktrajecten van maanden, maar willen wel dat hun verhaal klopt. Schrijf nooit vanuit het bureau-perspectief.`,
      zo_klink_je: [
        'Schrijf direct en eerlijk. "Dit kunnen we, dit niet. En dit is waarom."',
        'Schrijf warm maar niet soft. "We denken met je mee, maar zeggen ook als iets niet werkt."',
        'Schrijf concreet. "Geen vage beloftes. Dit is wat je krijgt, en wanneer."',
        'Schrijf menselijk. "We schrijven zoals we praten. Geen jargon, geen afstandelijkheid."',
        'Toets elke zin die je schrijft aan deze regels voordat je hem plaatst.'
      ],
      dit_zeg_je_nooit: [
        'Gebruik nooit "ontzorgen", "uw partner in succes" of "totaaloplossing". Zeg in plaats daarvan concreet wat we doen en wat het oplevert.',
        'Gebruik nooit "de beste" of "uniek" zonder het waar te maken. Zeg in plaats daarvan wat het specifieke resultaat is.',
        'Schrijf nooit negatief over concurrenten. Laat ons eigen werk spreken.'
      ],
      jouw_verhaal: `Context: ${companyName} helpt bedrijven die goed werk leveren maar het niet goed weten te vertellen. Ze doen dat met heldere keuzes, niet met dikke merkboeken. Gebruik deze context alleen als het relevant is voor wat je schrijft. Schrijf er niet over tenzij ernaar gevraagd wordt.`
    }
  }
}
