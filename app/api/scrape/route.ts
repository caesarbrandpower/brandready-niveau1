import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

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

function parseHtml(html: string, pageUrl: string): { title: string; content: string } | null {
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

async function fetchViaJina(pageUrl: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`https://r.jina.ai/${encodeURIComponent(pageUrl)}`, {
        headers: { 'Accept': 'text/plain' },
        signal: AbortSignal.timeout(20000),
      })

      if (response.ok) {
        const text = await response.text()
        if (text && text.length > 200) return text
      }
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Jina failed after retries:', error)
        return null
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
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

    // 1. Try Jina AI first (primary)
    console.log('Trying Jina AI for:', url)
    for (const pageUrl of pagesToScrape.slice(0, 6)) {
      const text = await fetchViaJina(pageUrl)
      if (text && text.split(/\s+/).length >= 200) {
        const title = text.split('\n')[0]?.replace(/^#\s*/, '').trim() || pageUrl
        scrapedPages.push({ url: pageUrl, title, content: text })
      }
      if (scrapedPages.length >= 4) break
    }

    // 2. Fallback: direct fetch with cheerio parsing
    if (scrapedPages.length === 0) {
      console.log('Jina failed, trying direct HTML fetch for:', url)
      for (const pageUrl of pagesToScrape.slice(0, 6)) {
        const html = await fetchDirectHtml(pageUrl)
        if (!html) continue

        const parsed = parseHtml(html, pageUrl)
        if (parsed) {
          scrapedPages.push({ url: pageUrl, ...parsed })
        }

        if (scrapedPages.length >= 4) break
      }
    }

    // 3. Fallback: Googlebot plain text fetch
    if (scrapedPages.length === 0) {
      console.log('Direct HTML failed, trying Googlebot fetch for:', url)
      const text = await fetchDirectPlain(url)
      if (text) {
        scrapedPages.push({ url, title: url, content: text })
      }
    }

    // 3. Nothing worked — return error so frontend shows manual input
    if (scrapedPages.length === 0) {
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
