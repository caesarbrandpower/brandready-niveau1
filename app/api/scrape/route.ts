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

const MIN_WORDS = 200

function hasEnoughContent(pages: ScrapedPage[]): boolean {
  if (pages.length === 0) return false
  const totalWords = pages.reduce((sum, p) => sum + p.content.split(/\s+/).length, 0)
  return totalWords >= MIN_WORDS
}

function parseHtml(html: string, pageUrl: string): { title: string; content: string } | null {
  if (html.length > 150000) {
    console.log('parseHtml: HTML te groot (' + html.length + ' bytes), skip')
    return null
  }
  if (html.length < 500) return null
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header, aside, .cookie-banner, .popup, .modal, .advertisement, .ads, iframe, noscript').remove()
  const title = $('title').text().trim() || $('h1').first().text().trim() || pageUrl
  let content = ''
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main-content', '#main-content', 'section', '.container', 'body']
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
    const response = await fetch(pageUrl, { headers: BROWSER_HEADERS, signal: controller.signal })
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return null
    const html = await response.text()
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 10000)
    if (text.split(/\s+/).length < MIN_WORDS) return null
    return text
  } catch {
    return null
  }
}

async function fetchViaFirecrawl(pageUrl: string): Promise<string | null> {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('Firecrawl: geen API key in env')
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
    if (wordCount < MIN_WORDS) return null
    return text
  } catch (error) {
    console.error('Firecrawl error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL is verplicht' }, { status: 400 })
    let targetUrl: URL
    try { targetUrl = new URL(url) } catch { return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 }) }
    const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`
    let scrapedPages: ScrapedPage[] = []
    const pagesToScrape = [url, `${baseUrl}/over-ons`, `${baseUrl}/over`, `${baseUrl}/overons`, `${baseUrl}/about`, `${baseUrl}/about-us`, `${baseUrl}/diensten`, `${baseUrl}/services`, `${baseUrl}/wat-we-doen`, `${baseUrl}/aanpak`, `${baseUrl}/werkwijze`, `${baseUrl}/contact`]

    // 1. Jina AI met 15s hard limit
    console.log('[1/4] Jina voor:', url)
    try {
      const jinaResults = await Promise.race([
        Promise.all(pagesToScrape.slice(0, 4).map(async (pu) => ({ pageUrl: pu, text: await fetchViaJina(pu) }))),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ])
      for (const { pageUrl, text } of jinaResults) {
        if (text && text.split(/\s+/).length >= MIN_WORDS) {
          scrapedPages.push({ url: pageUrl, title: text.split('\n')[0]?.replace(/^#\s*/, '').trim() || pageUrl, content: text })
        }
        if (scrapedPages.length >= 4) break
      }
    } catch { console.log('[1/4] Jina timeout') }
    console.log(`[1/4] Jina: ${scrapedPages.length} pag, ${scrapedPages.reduce((s, p) => s + p.content.split(/\s+/).length, 0)} woorden`)

    // 2. Cheerio met 10s timeout
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[2/4] Cheerio voor:', url)
      scrapedPages = []
      try {
        const results = await Promise.race([
          Promise.all(pagesToScrape.slice(0, 6).map(async (pu) => { const html = await fetchDirectHtml(pu); if (!html) return null; const parsed = parseHtml(html, pu); return parsed ? { url: pu, ...parsed } : null })),
          new Promise<null[]>((resolve) => setTimeout(() => { console.log('[2/4] Cheerio timeout'); resolve([]) }, 10000)),
        ])
        for (const r of results) { if (r) scrapedPages.push(r); if (scrapedPages.length >= 4) break }
      } catch (e) { console.log('[2/4] Cheerio error:', e) }
      console.log(`[2/4] Cheerio: ${scrapedPages.length} pag, ${scrapedPages.reduce((s, p) => s + p.content.split(/\s+/).length, 0)} woorden`)
    }

    // 3. Googlebot
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[3/4] Googlebot voor:', url)
      scrapedPages = []
      const text = await fetchDirectPlain(url)
      if (text) scrapedPages.push({ url, title: url, content: text })
      console.log(`[3/4] Googlebot: ${scrapedPages.length} pag`)
    }

    // 4. Firecrawl (headless browser)
    if (!hasEnoughContent(scrapedPages)) {
      console.log('[4/4] Firecrawl voor:', url)
      scrapedPages = []
      const text = await fetchViaFirecrawl(url)
      if (text) scrapedPages.push({ url, title: text.split('\n')[0]?.replace(/^#\s*/, '').trim() || url, content: text })
      console.log(`[4/4] Firecrawl: ${scrapedPages.length} pag`)
    }

    if (!hasEnoughContent(scrapedPages)) {
      console.log('[Scraper] Alle 4 gefaald voor:', url)
      return NextResponse.json({ error: 'Deze website blokkeert automatische toegang. Probeer het opnieuw of gebruik een andere URL.', wordCount: 0, content: '' }, { status: 200 })
    }

    const combinedContent = scrapedPages.map(p => `=== ${p.title} (${p.url}) ===\n${p.content}`).join('\n\n')
    const wordCount = combinedContent.split(/\s+/).length
    console.log(`[Scraper] OK: ${wordCount} woorden, ${scrapedPages.length} pag`)
    return NextResponse.json({ content: combinedContent, wordCount, pages: scrapedPages.map(p => ({ url: p.url, title: p.title })) })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: 'We konden deze website helaas niet lezen. Probeer een andere URL of neem contact op via hello@newfound.agency', wordCount: 0, content: '' }, { status: 200 })
  }
}
