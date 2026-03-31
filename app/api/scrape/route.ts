import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import FirecrawlApp from '@mendable/firecrawl-js'

export const maxDuration = 60

const MIN_WORDS = 200

interface ScrapedPage {
  url: string
  title: string
  content: string
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

const GATE_PATTERNS = [
  'ben je 18',
  '18 jaar',
  '18+',
  'ouder dan 18',
  'leeftijdsverificatie',
  'leeftijdscontrole',
  'geboortejaar',
  'geboortedatum',
  'age verification',
  'age gate',
  'verify your age',
  'are you 18',
  'are you of legal',
  'you must be',
  'over 18',
  'legal age',
  'date of birth',
  'year of birth',
  'enter your birth',
  'verantwoord drinken',
  'drink responsibly',
  'cookie-wall',
  'cookiewall',
  'accepteer cookies',
  'accept cookies',
]

function isGateContent(text: string): boolean {
  const lower = text.toLowerCase()
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount > 500) return false
  return GATE_PATTERNS.some(pattern => lower.includes(pattern))
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function hasEnoughContent(text: string): boolean {
  return countWords(text) >= MIN_WORDS && !isGateContent(text)
}

function isErrorPage(text: string): boolean {
  const words = countWords(text)
  if (words > 50) return false
  const lower = text.toLowerCase()
  return lower.includes('404') || lower.includes('not found') || lower.includes('page not found') ||
    lower.includes('redirect') || lower.includes('moved permanently')
}

function parseHtml(html: string, pageUrl: string): { title: string; content: string } | null {
  if (html.length < 500) return null
  if (html.length > 150000) {
    console.log(`[Scraper] HTML te groot (${Math.round(html.length / 1024)}KB), skip Cheerio voor: ${pageUrl}`)
    return null
  }

  const $ = cheerio.load(html)
  $('script, style, nav, footer, header, aside, .cookie-banner, .popup, .modal, .advertisement, .ads, iframe, noscript').remove()

  const title = $('title').text().trim() || $('h1').first().text().trim() || pageUrl

  let content = ''
  const mainSelectors = [
    'main', 'article', '[role="main"]', '.content', '#content',
    '.main-content', '#main-content', 'section', '.container', 'body'
  ]

  for (const selector of mainSelectors) {
    const element = $(selector).first()
    if (element.length && element.text().trim().length > 200) {
      const textElements = element.find('p, h1, h2, h3, h4, h5, h6, li')
      if (textElements.length > 0) {
        content = textElements.map((_, el) => $(el).text().trim()).get().join('\n\n')
      } else {
        content = element.text().trim()
      }
      break
    }
  }

  if (!content || content.length < 200) {
    content = $('p, h1, h2, h3, h4, h5, h6, li').map((_, el) => $(el).text().trim()).get().join('\n\n')
  }

  content = content.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim()

  if (content.length < 100) return null
  return { title, content }
}

async function fetchViaJina(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(pageUrl)}`, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      const text = await response.text()
      if (text && text.length > 200) return text
    }
  } catch {
    // Jina timeout or network error
  }
  return null
}

async function fetchDirectHtml(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const response = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok || response.status >= 400) return null

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return null

    return await response.text()
  } catch {
    return null
  }
}

async function fetchDirectPlain(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) return null

    const html = await response.text()
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000)

    return text
  } catch {
    return null
  }
}

async function fetchViaFirecrawl(pageUrl: string): Promise<string | null> {
  console.log('[FIRECRAWL] Wordt aangeroepen voor:', pageUrl)
  console.log('[FIRECRAWL] API key aanwezig:', !!process.env.FIRECRAWL_API_KEY)
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.log('[FIRECRAWL] STOP: geen API key in environment')
    return null
  }
  console.log('[FIRECRAWL] API key lengte:', apiKey.length)
  if (apiKey.length < 10) {
    console.log('[FIRECRAWL] STOP: API key te kort')
    return null
  }
  try {
    console.log('[FIRECRAWL] FirecrawlApp aanmaken en scrapeUrl starten...')
    const app = new FirecrawlApp({ apiKey })
    const result = await app.scrapeUrl(pageUrl, { formats: ['markdown'] })
    console.log('[FIRECRAWL] Response ontvangen:', result.success, result.markdown?.length || 0, 'tekens')
    if (!result.success) {
      console.log(`[FIRECRAWL] Niet succesvol - response: ${JSON.stringify(result).substring(0, 500)}`)
      return null
    }
    const text = result.markdown || ''
    const words = countWords(text)
    console.log(`[FIRECRAWL] Content: ${words} woorden, eerste 200 tekens: ${text.substring(0, 200)}`)
    if (words < 10) {
      console.log('[FIRECRAWL] Te weinig woorden (< 10), retourneert null')
      return null
    }
    return text
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    const status = (error as Record<string, unknown>)?.status || 'geen status'
    console.log('[FIRECRAWL] Error:', msg, status)
    return null
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  const scraperLog: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    scraperLog.push(msg)
  }

  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is verplicht' }, { status: 400 })
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 })
    }

    const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`
    const scrapedPages: ScrapedPage[] = []

    const pagesToScrape = [
      url,
      `${baseUrl}/over-ons`,
      `${baseUrl}/over`,
      `${baseUrl}/overons`,
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/diensten`,
      `${baseUrl}/services`,
      `${baseUrl}/wat-we-doen`,
      `${baseUrl}/aanpak`,
      `${baseUrl}/werkwijze`,
      `${baseUrl}/contact`,
    ]

    // 1. Jina AI
    log(`[1/4] Jina: start voor ${url}`)
    const jinaUrls = pagesToScrape.slice(0, 4)
    try {
      const jinaResults = await Promise.race([
        Promise.all(jinaUrls.map(async (pageUrl) => {
          const text = await fetchViaJina(pageUrl)
          return { pageUrl, text }
        })),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ])

      for (const { pageUrl, text } of jinaResults) {
        if (!text) continue
        const words = countWords(text)
        const gate = isGateContent(text)
        if (gate) {
          log(`[1/4] Jina: gate content voor ${pageUrl} (${words} woorden), skip`)
        } else if (words >= MIN_WORDS) {
          const title = text.split('\n')[0]?.replace(/^#\s*/, '').trim() || pageUrl
          scrapedPages.push({ url: pageUrl, title, content: text })
          log(`[1/4] Jina: OK voor ${pageUrl} (${words} woorden)`)
        } else {
          log(`[1/4] Jina: te weinig content voor ${pageUrl} (${words} woorden)`)
        }
        if (scrapedPages.length >= 4) break
      }
    } catch {
      log('[1/4] Jina: fase timeout (15s)')
    }

    // 2. Cheerio (10s timeout op fase)
    if (scrapedPages.length === 0) {
      await delay(500)
      log(`[2/4] Cheerio: start voor ${url}`)
      try {
        const htmlResults = await Promise.race([
          Promise.all(
            pagesToScrape.slice(0, 6).map(async (pageUrl) => {
              const html = await fetchDirectHtml(pageUrl)
              if (!html) return null
              const parsed = parseHtml(html, pageUrl)
              return parsed ? { url: pageUrl, ...parsed } : null
            })
          ),
          new Promise<null[]>((resolve) => setTimeout(() => resolve([]), 10000)),
        ])

        for (const result of htmlResults) {
          if (!result) continue
          const words = countWords(result.content)
          const gate = isGateContent(result.content)
          const error = isErrorPage(result.content)
          if (gate) {
            log(`[2/4] Cheerio: gate content voor ${result.url} (${words} woorden), skip`)
          } else if (error) {
            log(`[2/4] Cheerio: error page voor ${result.url}, skip`)
          } else if (words >= MIN_WORDS) {
            scrapedPages.push(result)
            log(`[2/4] Cheerio: OK voor ${result.url} (${words} woorden)`)
          } else {
            log(`[2/4] Cheerio: te weinig content voor ${result.url} (${words} woorden)`)
          }
          if (scrapedPages.length >= 4) break
        }
      } catch {
        log('[2/4] Cheerio: fase timeout (10s)')
      }
    }

    // 3. Googlebot
    if (scrapedPages.length === 0) {
      await delay(500)
      log(`[3/4] Googlebot: start voor ${url}`)
      const text = await fetchDirectPlain(url)
      if (!text) {
        log('[3/4] Googlebot: geen response')
      } else {
        const words = countWords(text)
        const gate = isGateContent(text)
        const error = isErrorPage(text)
        if (gate) {
          log(`[3/4] Googlebot: gate content (${words} woorden), skip`)
        } else if (error) {
          log('[3/4] Googlebot: error page, skip')
        } else if (words >= MIN_WORDS) {
          scrapedPages.push({ url, title: url, content: text })
          log(`[3/4] Googlebot: OK (${words} woorden)`)
        } else {
          log(`[3/4] Googlebot: te weinig content (${words} woorden)`)
        }
      }
    }

    // 4. Firecrawl (headless browser, voor age gates en JS-sites)
    if (scrapedPages.length === 0) {
      await delay(500)
      log(`[4/4] Firecrawl: start voor ${url}`)
      const text = await fetchViaFirecrawl(url)
      if (!text) {
        log('[4/4] Firecrawl: geen bruikbare content')
      } else {
        const words = countWords(text)
        const gate = isGateContent(text)
        if (gate) {
          log(`[4/4] Firecrawl: gate content (${words} woorden), skip`)
        } else if (words >= MIN_WORDS) {
          const title = text.split('\n')[0]?.replace(/^#\s*/, '').trim() || url
          scrapedPages.push({ url, title, content: text })
          log(`[4/4] Firecrawl: OK (${words} woorden)`)
        } else {
          log(`[4/4] Firecrawl: te weinig content (${words} woorden)`)
        }
      }
    }

    // 5. Resultaat
    if (scrapedPages.length === 0) {
      log(`[Scraper] Alle 4 lagen gefaald voor ${url}`)
      return NextResponse.json({
        error: 'Deze website laadt te langzaam of staat automatische analyse niet toe. Probeer het opnieuw of gebruik een andere URL.',
        wordCount: 0,
        content: '',
        debug: scraperLog,
      }, { status: 200 })
    }

    const combinedContent = scrapedPages.map(p =>
      `=== ${p.title} (${p.url}) ===\n${p.content}`
    ).join('\n\n')

    const wordCount = combinedContent.split(/\s+/).length
    log(`[Scraper] Succes: ${wordCount} woorden van ${scrapedPages.length} pagina's`)

    return NextResponse.json({
      content: combinedContent,
      wordCount,
      pages: scrapedPages.map(p => ({ url: p.url, title: p.title }))
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[Scraper] Onverwachte error: ${msg}`)
    return NextResponse.json({
      error: 'We konden deze website helaas niet lezen. Sommige websites staan automatische analyse niet toe. Probeer een andere URL of neem contact op via hello@newfound.agency',
      wordCount: 0,
      content: ''
    }, { status: 200 })
  }
}
