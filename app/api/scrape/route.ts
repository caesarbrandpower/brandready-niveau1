import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import FirecrawlApp from '@mendable/firecrawl-js'

export const maxDuration = 60

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

function hasEnoughContent(pages: ScrapedPage[]): boolean {
  if (pages.length === 0) return false
  const totalWords = pages.reduce((sum, p) => sum + p.content.split(/\s+/).length, 0)
  return totalWords >= 100
}

function parseHtml(html: string, pageUrl: string): { title: string; content: string } | null {
  // Skip te grote HTML bestanden die Cheerio doen hangen (client-side rendered)
  if (html.length > 150000) {
    console.log('parseHtml: HTML te groot voor Cheerio (' + html.length + ' bytes), skip')
    return null
  }
  if (html.length < 500) return null

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
  } catch (error) {
    console.error('Jina failed for', pageUrl, error)
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
    if (text.split(/\s+/).length < 200) return null

    return text
  } catch {
    return null
  }
}

async function fetchViaFirecrawl(pageUrl: string): Promise<string | null> {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('Firecrawl: geen API key gevonden in env')
    return null
  }
  try {
    console.log('Firecrawl: start scrape voor', pageUrl)
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
    const result = await app.scrapeUrl(pageUrl, { formats: ['markdown'] })
    if (!result.success) {
      console.log('Firecrawl: niet succesvol -', (result as { error?: string }).error || 'onbekende fout')
      return null
    }
    const text = result.markdown || ''
    const wordCount = text.split(/\s+/).length
    console.log('Firecrawl: ontvangen', wordCount, 'woorden')
    if (wordCount < 100) return null
    return text
  } catch (error) {
    console.error('Firecrawl error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
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
    let scrapedPages: ScrapedPage[] = []

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

    // 1. Try Jina AI first (primary) with 15s hard limit
    console.log('[Scraper 1/4] Jina AI voor:', url)
    const jinaUrls = pagesToScrape.slice(0, 4)
    try {
      const jinaResults = await Promise.race([
        Promise.all(jinaUrls.map(async (pageUrl) => {
          const text = await fetchViaJina(pageUrl)
          return { pageUrl, text }
        })),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Jina phase timeout')), 15000)),
      ])

      for (const { pageUrl, text } of jinaResults) {
        if (text && text.split(/\s+/).length >= 200) {
          const title = text.split('\n')[0]?.replace(/^#\s*/, '').trim() || pageUrl
          scrapedPages.push({ url: pageUrl, title, content: text })
        }
        if (scrapedPages.length >= 4) break
      }
    } catch {
      console.log('[Scraper 1/4] Jina timeout')
    }
    console.log(`[Scraper 1/4] Jina resultaat: ${scrapedPages.length} pagina's, bruikbaar: ${hasEnoughContent(scrapedPages)}`)

    // 2. Fallback: direct fetch with cheerio (met 10s timeout op parsing)
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[Scraper 2/4] Cheerio fallback voor:', url)
      scrapedPages = []
      try {
        const cheerioResults = await Promise.race([
          Promise.all(
            pagesToScrape.slice(0, 6).map(async (pageUrl) => {
              const html = await fetchDirectHtml(pageUrl)
              if (!html) return null
              const parsed = parseHtml(html, pageUrl)
              return parsed ? { url: pageUrl, ...parsed } : null
            })
          ),
          new Promise<null[]>((resolve) => setTimeout(() => {
            console.log('[Scraper 2/4] Cheerio phase timeout (10s)')
            resolve([])
          }, 10000)),
        ])

        for (const result of cheerioResults) {
          if (result) scrapedPages.push(result)
          if (scrapedPages.length >= 4) break
        }
      } catch (e) {
        console.log('[Scraper 2/4] Cheerio error:', e)
      }
      console.log(`[Scraper 2/4] Cheerio resultaat: ${scrapedPages.length} pagina's, bruikbaar: ${hasEnoughContent(scrapedPages)}`)
    }

    // 3. Fallback: Googlebot plain text fetch
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[Scraper 3/4] Googlebot fallback voor:', url)
      scrapedPages = []
      const text = await fetchDirectPlain(url)
      if (text) {
        scrapedPages.push({ url, title: url, content: text })
      }
      console.log(`[Scraper 3/4] Googlebot resultaat: ${scrapedPages.length} pagina's, bruikbaar: ${hasEnoughContent(scrapedPages)}`)
    }

    // 4. Fallback: Firecrawl (headless browser, voor JS-rendered en beveiligde sites)
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[Scraper 4/4] Firecrawl fallback voor:', url)
      scrapedPages = []
      const text = await fetchViaFirecrawl(url)
      if (text) {
        const title = text.split('\n')[0]?.replace(/^#\s*/, '').trim() || url
        scrapedPages.push({ url, title, content: text })
      }
      console.log(`[Scraper 4/4] Firecrawl resultaat: ${scrapedPages.length} pagina's, bruikbaar: ${hasEnoughContent(scrapedPages)}`)
    }

    // 5. Nothing worked
    if (scrapedPages.length === 0) {
      console.log('[Scraper] Alle scrapers gefaald voor:', url)
      return NextResponse.json({
        error: 'Deze website laadt te langzaam of staat automatische analyse niet toe. Probeer het opnieuw of gebruik een andere URL.',
        wordCount: 0,
        content: ''
      }, { status: 200 })
    }

    const combinedContent = scrapedPages.map(p =>
      `=== ${p.title} (${p.url}) ===\n${p.content}`
    ).join('\n\n')

    const wordCount = combinedContent.split(/\s+/).length
    console.log(`[Scraper] Succes: ${wordCount} woorden van ${scrapedPages.length} pagina's`)

    return NextResponse.json({
      content: combinedContent,
      wordCount,
      pages: scrapedPages.map(p => ({ url: p.url, title: p.title }))
    })

  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({
      error: 'We konden deze website helaas niet lezen. Sommige websites staan automatische analyse niet toe. Probeer een andere URL of neem contact op via hello@newfound.agency',
      wordCount: 0,
      content: ''
    }, { status: 200 })
  }
}
