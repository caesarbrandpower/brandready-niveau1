import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'brandprompt-handleiding.pdf')

const COLORS = {
  bg: '#111114',
  white: '#FFFFFF',
  body: '#B8B8C0',
  accent: '#C4A0FF',
  muted: '#888890',
  gradStart: '#E040A0',
  gradEnd: '#6040E0',
  rule: '#333340',
}

const W = 595.28, H = 841.89 // A4
const ML = 60, MR = 60, MT = 56, MB = 50
const CW = W - ML - MR
const BOTTOM = H - MB

let pageNum = 0
let curY = MT

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,
})
const stream = fs.createWriteStream(outputPath)
doc.pipe(stream)

// ─── Low-level page chrome (no doc.text — uses only graphics + positioned text) ───

function newPage() {
  pageNum++
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } })

  // Dark bg
  doc.rect(0, 0, W, H).fill(COLORS.bg)

  // Gradient bar
  const grad = doc.linearGradient(0, 0, W, 0)
  grad.stop(0, COLORS.gradStart).stop(1, COLORS.gradEnd)
  doc.rect(0, 0, W, 36).fill(grad)

  // Brand dots + text in bar
  doc.circle(14, 14, 1.8).fill(COLORS.white)
  doc.circle(14, 20, 1.8).fill(COLORS.white)
  doc.circle(20, 17, 1.8).fill(COLORS.white)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
  doc.text('NEWFOUND', 28, 12, { lineBreak: false })

  // Footer (absolute position, lineBreak false to prevent pagination)
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
  doc.text('Een product van Newfound  |  newfound.agency  |  hello@newfound.agency  |  +31 6 27 52 56 35',
    ML, H - 30, { lineBreak: false })
  doc.text(String(pageNum), W - MR - 10, H - 30, { lineBreak: false })

  curY = MT
}

// ─── Content helpers ───

function space(n) { curY += n }

function checkSpace(needed) {
  if (curY + needed > BOTTOM) {
    newPage()
  }
}

function textBlock(text, opts = {}) {
  const {
    font = 'Helvetica',
    size = 9.5,
    color = COLORS.body,
    lineGap = 3,
    afterGap = 4,
    width = CW,
    x = ML,
  } = opts

  checkSpace(size + 10)
  doc.font(font).fontSize(size).fillColor(color)

  // Measure height first
  const height = doc.heightOfString(text, { width, lineGap })

  // Check if full block fits, if not, page break
  if (curY + height > BOTTOM) {
    newPage()
  }

  doc.text(text, x, curY, { width, lineGap, lineBreak: true })
  curY += height + afterGap
}

function drawRule() {
  checkSpace(28)
  curY += 10
  doc.moveTo(ML, curY).lineTo(W - MR, curY).lineWidth(0.5).strokeColor(COLORS.rule).stroke()
  curY += 14
}

function writeLabel(text) {
  checkSpace(30)
  textBlock(text, { font: 'Helvetica-Oblique', size: 10, color: COLORS.accent, afterGap: 3 })
}

function writeHeading(text) {
  checkSpace(40)
  textBlock(text.toUpperCase(), { font: 'Helvetica-Bold', size: 17, color: COLORS.white, lineGap: 2, afterGap: 6 })
}

function writeSubheading(text) {
  checkSpace(30)
  textBlock(text, { font: 'Helvetica-Bold', size: 12, color: COLORS.white, afterGap: 4 })
}

function writeBody(text) {
  textBlock(text, { font: 'Helvetica', size: 9.5, color: COLORS.body, lineGap: 3, afterGap: 4 })
}

function writeTip(text) {
  textBlock(text, { font: 'Helvetica-BoldOblique', size: 9.5, color: COLORS.accent, lineGap: 2, afterGap: 6 })
}

function writeQuote(text) {
  checkSpace(40)
  const qx = ML + 14
  const startY = curY
  doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COLORS.body)
  const h = doc.heightOfString(text, { width: CW - 18, lineGap: 2 })
  if (curY + h > BOTTOM) newPage()
  const drawY = curY
  doc.text(text, qx, curY, { width: CW - 18, lineGap: 2, lineBreak: true })
  curY += h + 6
  // Quote bar
  doc.moveTo(ML + 4, drawY - 2).lineTo(ML + 4, drawY + h + 2).lineWidth(2).strokeColor(COLORS.accent).stroke()
}

function writeBullet(text) {
  checkSpace(18)
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.accent)
  doc.text('\u2022', ML, curY, { lineBreak: false })
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body)
  const h = doc.heightOfString(text, { width: CW - 14, lineGap: 2 })
  doc.text(text, ML + 14, curY, { width: CW - 14, lineGap: 2, lineBreak: true })
  curY += h + 3
}

// ─── Build document ───

newPage()

// Title
doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.white)
const titleH = doc.heightOfString('ZO GEBRUIK JE JE\nSUPERPROMPT', { width: CW })
doc.text('ZO GEBRUIK JE JE\nSUPERPROMPT', ML, curY, { width: CW })
curY += titleH + 6

doc.font('Helvetica-Oblique').fontSize(13).fillColor(COLORS.accent)
doc.text('Handleiding BrandReady Niveau 1', ML, curY, { width: CW, lineBreak: true })
curY += 26

writeBody('Je hebt zojuist je superprompt gegenereerd. Je merk is nu beschreven in taal die een AI begrijpt.')
writeBody('Maar wat doe je er nu mee? En hoe zorg je dat je er het meeste uit haalt?')
writeBody('Deze handleiding geeft je alles wat je nodig hebt om consistent te communiceren vanuit je merk \u2014 met of zonder AI.')

drawRule()

// DEEL 1
writeLabel('Deel 1')
writeHeading('Je superprompt in gebruik nemen')
space(2)

writeSubheading('1. Zet hem in ChatGPT als vaste instructie')
writeBody('Open ChatGPT en ga naar Mijn GPT\u2019s of gebruik de knop Aanpassen in een nieuw gesprek. Plak je superprompt in het veld Instructies.')
writeBody('Vanaf nu schrijft ChatGPT altijd vanuit jouw merk. Vraag hem een LinkedIn post te schrijven, een offerte-intro te formuleren of een mail te beantwoorden \u2014 het klinkt als jij.')
space(2)

writeSubheading('2. Gebruik hem in Claude')
writeBody('Open claude.ai en maak een nieuw Project aan. Ga naar Projectinstructies en plak je superprompt erin.')
writeBody('Elk gesprek in dat project start nu met jouw merkcontext. Claude kent je toon, je doelgroep en wat je nooit zegt.')
space(2)

writeSubheading('3. Plak hem boven elke losse AI-vraag')
writeBody('Heb je geen account of wil je hem gewoon snel gebruiken? Plak je superprompt bovenaan je bericht in elke AI-tool, gevolgd door je vraag.')
writeQuote('[superprompt]\n\nSchrijf een LinkedIn post over onze nieuwe dienst.')
writeBody('Direct resultaat, geen uitleg nodig.')
space(2)

writeSubheading('4. Gebruik hem als briefing voor teksten en content')
writeBody('Stuur je superprompt mee als je een tekstschrijver, marketeer of VA briefed. Zij hoeven niet meer te raden hoe jij klinkt \u2014 het staat er gewoon in.')
space(2)

writeSubheading('5. Gebruik hem als spiegel')
writeBody('Lees je superprompt terug. Klopt het? Is dit wie je bent?')
writeBody('Als er iets niet klopt, is dat waardevolle informatie. Het betekent dat je website iets anders uitstraalt dan jij bedoelt. Precies dat verschil is waar merkwerk over gaat.')

drawRule()

// DEEL 2
writeLabel('Deel 2')
writeHeading('Zo haal je het beste uit AI voor je merk')
writeBody('Je superprompt is het fundament. Maar hoe je AI aanstuurt bepaalt de kwaliteit van het resultaat. Hier zijn vijf tips die direct het verschil maken.')
space(2)

writeSubheading('1. Geef AI context, niet alleen een opdracht')
writeBody('De meeste mensen geven AI een korte opdracht en zijn teleurgesteld over het resultaat. Dat is logisch \u2014 AI weet niets over jou, je klant of je situatie tenzij je het vertelt.')
writeBody('Zeg niet: \u201CSchrijf een LinkedIn post.\u201D')
writeBody('Zeg: \u201CSchrijf een LinkedIn post voor mensen die net een nieuw bedrijf zijn gestart en worstelen met hun eerste klanten. Schrijf in een toegankelijke toon, zonder vakjargon, en sluit af met een vraag.\u201D')
writeBody('Hoe meer context je geeft, hoe beter het resultaat. Je superprompt doet een groot deel van dit werk al automatisch voor je.')
space(2)

writeSubheading('2. Vertel wat je niet wil')
writeBody('AI kiest altijd voor het gemiddelde. Het schrijft formeel tenzij je zegt dat het informeel moet. Het gebruikt opsommingen tenzij je zegt dat het dat niet moet doen. Het begint met een clich\u00E9 opening tenzij je er expliciet voor zorgt dat dat niet gebeurt.')
writeBody('Grenzen zijn minstens zo waardevol als beschrijvingen. Voeg altijd een paar \u201Cniet dit\u201D instructies toe:')
writeBullet('\u201CGeen opsommingen.\u201D')
writeBullet('\u201CNiet beginnen met \u2018In de wereld van...\u2019 of vergelijkbare openingszinnen.\u201D')
writeBullet('\u201CGeen formele afsluiting zoals \u2018Met vriendelijke groet\u2019.\u201D')
writeBody('Je zult zien dat de output direct persoonlijker en herkenbaar wordt.')
space(2)

writeSubheading('3. Geef een voorbeeld mee')
writeBody('De snelste manier om AI jouw stijl te laten begrijpen is een eigen tekst meesturen die goed voelt. Plak een LinkedIn post, een stuk van je website of een mail die je eerder hebt geschreven erbij, en zeg: \u201CSchrijf in deze stijl.\u201D')
writeBody('\u00C9\u00E9n goed voorbeeld is meer waard dan tien uitleg. AI is heel goed in patronen herkennen en vertalen naar nieuwe content.')
space(2)

writeSubheading('4. Wees specifiek over je doelgroep')
writeBody('\u201CSchrijf voor mijn klant\u201D is te vaag. AI heeft geen idee wie jouw klant is tenzij je het beschrijft.')
writeBody('Hoe beter je beschrijft voor wie je schrijft \u2014 wat ze doen, waar ze tegenaan lopen, wat ze al weten en wat niet \u2014 hoe beter AI de toon en inhoud afstemt op de juiste persoon.')
writeBody('Je superprompt bevat al een beschrijving van jouw doelgroep. Gebruik die actief in elke opdracht die je geeft.')
space(2)

writeSubheading('5. Gebruik AI ook als spiegel')
writeBody('AI kan niet alleen content maken \u2014 het kan ook toetsen. Laat AI je eigen tekst reviewen: \u201CPast dit bij een merk dat [jouw merkbelofte]? Wat klopt er niet?\u201D')
writeBody('Dit is een van de krachtigste toepassingen die de meeste mensen overslaan. AI kan zijn eigen output \u2014 en die van jou \u2014 vergelijken met je merkidentiteit en aangeven waar je afwijkt. Gebruik dat als kwaliteitscheck voordat je iets publiceert.')

drawRule()

// DEEL 3
writeLabel('Deel 3')
writeHeading('Veelgemaakte fouten')
space(2)

writeSubheading('Fout 1: Je superprompt \u00E9\u00E9n keer gebruiken en vergeten')
writeBody('Je superprompt is geen document dat je opslaat en nooit meer opent. Hij werkt het best als je hem consequent inzet bij elke AI-taak die met je merk te maken heeft. Voeg hem toe aan je werkwijze, niet aan je archief.')
space(2)

writeSubheading('Fout 2: Tevreden zijn met de eerste versie')
writeBody('AI geeft je altijd een eerste versie. Dat is zelden de beste versie. Vraag altijd om alternatieven, geef feedback en verfijn. \u201CGoed maar iets korter\u201D of \u201CKlopt, maar minder formeel\u201D zijn perfecte instructies voor een tweede ronde.')
space(2)

writeSubheading('Fout 3: Vergeten dat AI generaliseert')
writeBody('Je superprompt beschrijft jouw merk zoals het nu op je website staat. Dat is een startpunt, geen eindpunt. Als je merk evolueert, als je een nieuwe doelgroep aanspreekt of als je aanbod verandert \u2014 update dan ook je superprompt. Gebruik Brandprompt opnieuw als vertrekpunt.')
space(2)

writeSubheading('Fout 4: AI alles laten schrijven')
writeBody('De krachtigste toepassing van AI is niet dat het alles voor je schrijft \u2014 het is dat je sneller en consistenter je eigen idee\u00EBn kunt uitwerken. Gebruik AI als versneller van jouw denken, niet als vervanger ervan. De beste content heeft altijd jouw handschrift.')

drawRule()

// WAT NU?
writeLabel('Wat nu?')
writeHeading('Ga verder met je merk')
writeBody('Deze superprompt is niveau 1 \u2014 een eerste schets op basis van wat je website vertelt.')
writeBody('Bij Newfound gaan we verder. We scherpen je merkfundament aan, ontwikkelen een concept dat blijft hangen en zorgen dat je merk consistent werkt op elk moment dat het telt.')
space(4)
writeTip('Benieuwd? Stuur een mail naar hello@newfound.agency of ga naar newfound.agency.')
space(10)

checkSpace(30)
doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLORS.muted)
doc.text('Dit is een product van Newfound \u2014 strategisch branding bureau voor MKB.', ML, curY, { width: CW, lineBreak: false })
curY += 12
doc.text('newfound.agency', ML, curY, { width: CW, lineBreak: false })

doc.end()

stream.on('finish', () => {
  console.log(`PDF generated: ${outputPath} (${pageNum} pages)`)
})
