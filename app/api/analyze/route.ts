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
      // Fallback: return mock data voor testdoeleinden
      console.log('Geen geldige API key gevonden, gebruik mock data')
      return NextResponse.json(generateMockData(content, url))
    }

    // Detecteer taal
    const isDutch = !/[\u0400-\u04FF]/.test(content) &&
                   (content.toLowerCase().includes(' de ') ||
                    content.toLowerCase().includes(' het ') ||
                    content.toLowerCase().includes(' een ') ||
                    content.toLowerCase().includes(' en ') ||
                    content.toLowerCase().includes(' van '))

    // Beperk content lengte (Claude heeft limieten)
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
            content: `Analyseer de volgende website content en genereer een merkstructuur:\n\nURL: ${url}\n\nCONTENT:\n${truncatedContent}\n\nGeef je antwoord in het ${isDutch ? 'Nederlands' : 'Engels'} als geldige JSON.`
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

    // Parse de JSON response
    let result
    try {
      const rawText = data.content[0].text
      // Probeer JSON te vinden in de response (soms zit het in een code block)
      const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        rawText.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, rawText]
      const jsonText = jsonMatch[1] || rawText
      result = JSON.parse(jsonText.trim())
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Raw response:', data.content[0].text)

      // Fallback: probeer het als platte tekst te verwerken
      return NextResponse.json(generateMockData(content, url))
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analyse mislukt'
    }, { status: 500 })
  }
}

// Mock data generator voor testdoeleinden (wanneer geen API key)
function generateMockData(content: string, url: string) {
  // Probeer bedrijfsnaam te extraheren uit URL of content
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace(/^www\./, '').split('.')[0]
  const companyName = hostname.charAt(0).toUpperCase() + hostname.slice(1)

  return {
    companyName,
    brandStructure: {
      wieZijnWe: `${companyName} is een innovatief bedrijf dat zich richt op het leveren van kwalitatieve oplossingen. Met een frisse aanpak en oog voor detail maken wij het verschil voor onze klanten.`,
      watMaaktOnderscheidend: [
        'Persoonlijke aanpak - elk project krijgt de aandacht die het verdient',
        'Praktische oplossingen - geen theorie, maar werkbare resultaten',
        'Jarenlange ervaring in de branche met bewezen resultaten'
      ],
      voorWieZijnWeEr: 'Ondernemers en organisaties die op zoek zijn naar een betrouwbare partner die meedenkt en resultaat levert, zonder de gebruikelijke bureaucratie.',
      zoKlinkenWe: [
        'Direct en eerlijk - "Dit kunnen we wel, dit niet"',
        'Warm en toegankelijk - "Laten we samen kijken wat er mogelijk is"',
        'Professioneel maar niet stijf - "We regelen het voor je"',
        'Oplossingsgericht - "Hier is wat wij ervan denken"',
        'Authentiek - geen vakjargon, gewoon duidelijk'
      ],
      ditZeggenWeNooit: [
        'Oneliners zonder inhoud zoals "denk out of the box"',
        'Beloftes die we niet waar kunnen maken',
        'Negatief over concurrenten of anderen in de branche'
      ],
      onsVerhaal: `${companyName} is ontstaan uit de frustratie dat zaken ingewikkelder worden gemaakt dan nodig. Wij geloven in een andere aanpak: eerlijk, direct en altijd met het oog op het beste resultaat. Niet voor onszelf, maar voor de klanten die op ons rekenen. Dat is waar wij elke dag voor werken.`,
      perKanaal: {
        linkedin: 'Delen van inzichten en ervaringen, met oprechte verhalen over wat we doen en waarom het werkt.',
        offerte: 'Duidelijke taal, concrete prijzen, heldere voorwaarden - geen kleine lettertjes.',
        email: 'Persoonlijk en direct, alsof we elkaar al kennen. Geen standaard templates.'
      }
    },
    superPrompt: `Je communiceert altijd vanuit het merk van ${companyName}. Dit betekent:

## 1. Wie we zijn
Je vertegenwoordigt ${companyName}: een innovatief bedrijf dat kwalitatieve oplossingen levert met een frisse aanpak en oog voor detail.

## 2. Wat ons onderscheidt
- Benadruk altijd de persoonlijke aanpak
- Focus op praktische, werkbare oplossingen
- Verwijs waar relevant naar de ervaring en expertise

## 3. Voor wie we er zijn
Richt je op ondernemers die op zoek zijn naar een betrouwbare partner zonder bureaucratie. Spreek hun taal.

## 4. Hoe we klinken
- Direct en eerlijk
- Warm en toegankelijk
- Professioneel maar niet stijf
- Oplossingsgericht
- Authentiek, geen jargon

## 5. Wat we nooit zeggen
- Vermijd holle marketingtaal
- Geen onrealistische beloftes
- Geen negativiteit over anderen

## 6. Ons verhaal
${companyName} staat voor: eenvoud in plaats van complexiteit, eerlijkheid in plaats van mooie praatjes.

## 7. Per kanaal
- LinkedIn: inzichten en verhalen delen
- Offerte: duidelijk en concreet
- Email: persoonlijk en direct`,
    diagnose: {
      sterk: 'De website communiceert een duidelijke focus op persoonlijke service en praktische oplossingen.',
      mist: 'Specifieke voorbeelden of cases ontbreken, waardoor de belofte minder concreet wordt.',
      implicatie: 'Potentiële klanten missen de bewijskracht die hen over de streep zou trekken om contact op te nemen.'
    }
  }
}
