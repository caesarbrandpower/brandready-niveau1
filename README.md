# BrandReady Niveau 1

Een Next.js applicatie die van elke website een complete merkstructuur maakt — inclusief een kant-en-klare superprompt voor AI.

## Wat het doet

1. Gebruiker voert een website-URL in
2. Tool scrapet maximaal 4 pagina's (homepage, about, +2 subpagina's)
3. Claude API analyseert de content
4. Output: 7-delige merkstructuur + superprompt + diagnose
5. Lead capture via email voor download

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Scraper:** Cheerio + fetch (Vercel-compatibel)
- **AI:** Claude API (claude-sonnet-4-20250514)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Lokale installatie

```bash
# Dependencies installeren
npm install

# Environment variables
cp .env.example .env.local
# Vul je CLAUDE_API_KEY in (van https://console.anthropic.com/)

# Dev server starten
npm run dev
```
