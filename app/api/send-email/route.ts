import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const debugLog: string[] = []

  try {
    const body = await request.json()
    const { email, superprompt } = body
    debugLog.push(`Received request for: ${email}`)
    debugLog.push(`Superprompt length: ${(superprompt || '').length}`)

    if (!email) {
      return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
    }

    // 1. Verstuur email via Nodemailer (primair)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    debugLog.push(`SMTP configured: ${!!(smtpUser && smtpPass)}`)

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'mail.mijndomein.nl',
          port: 465,
          secure: true,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 10000,
          socketTimeout: 10000,
        })

        await transporter.verify()
        debugLog.push('SMTP connection verified OK')

        const emailBody = `Hoi,

Hier is jouw superprompt. Kopieer hem in ChatGPT of Claude om direct on-brand te schrijven.

${superprompt}

---

Stap-voor-stap handleiding om je superprompt in 2 minuten in te stellen in ChatGPT of Claude, ook als je nog nooit met AI hebt gewerkt:

https://brandprompt.newfound.agency/brandprompt-handleiding.pdf

---

Groetjes,
Caesar van Newfound
www.newfound.agency
+31 6 27 52 56 35`

        const info = await transporter.sendMail({
          from: `"Newfound" <${smtpUser}>`,
          to: email,
          bcc: 'hello@newfound.agency',
          subject: 'Jouw superprompt van Brandprompt',
          text: emailBody,
        })
        debugLog.push(`Email sent: ${info.messageId}`)
      } catch (smtpError) {
        const msg = smtpError instanceof Error ? smtpError.message : String(smtpError)
        debugLog.push(`SMTP error: ${msg}`)
        console.error('SMTP full error:', smtpError)
        return NextResponse.json({
          error: `SMTP fout: ${msg}`,
          debug: debugLog,
        }, { status: 500 })
      }
    } else {
      debugLog.push('SMTP niet geconfigureerd, email niet verstuurd')
    }

    // 2. Opslaan in Airtable (secundair — mag niet falen voor de gebruiker)
    const airtableApiKey = process.env.AIRTABLE_API_KEY
    console.log('[AIRTABLE] API key aanwezig:', airtableApiKey ? 'ja' : 'ONTBREEKT')
    console.log('[AIRTABLE] API key length:', airtableApiKey?.length ?? 0)
    console.log('[AIRTABLE] API key prefix:', airtableApiKey?.substring(0, 6) ?? 'n/a')
    debugLog.push(`Airtable API key: ${airtableApiKey ? 'aanwezig (' + airtableApiKey.length + ' chars)' : 'ONTBREEKT'}`)

    if (airtableApiKey) {
      try {
        const airtableUrl = 'https://api.airtable.com/v0/appQ8PADMp8Sc7mXT/Brandprompt%20Leads'
        const airtablePayload = {
          fields: {
            Email: email,
            Superprompt: (superprompt || '').slice(0, 500),
            Datum: new Date().toISOString().split('T')[0],
          },
        }

        console.log('[AIRTABLE] URL:', airtableUrl)
        console.log('[AIRTABLE] Payload:', JSON.stringify(airtablePayload))

        const airtableRes = await fetch(airtableUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(airtablePayload),
        })

        const airtableBody = await airtableRes.text()
        console.log('[AIRTABLE] Status:', airtableRes.status)
        console.log('[AIRTABLE] Response:', airtableBody)
        debugLog.push(`Airtable status: ${airtableRes.status}`)
        debugLog.push(`Airtable response: ${airtableBody.substring(0, 500)}`)
      } catch (airtableError) {
        const msg = airtableError instanceof Error ? airtableError.message : String(airtableError)
        console.error('[AIRTABLE] Exception:', msg)
        debugLog.push(`Airtable exception: ${msg}`)
      }
    } else {
      console.log('[AIRTABLE] Overgeslagen — API key ontbreekt in environment variables')
      debugLog.push('Airtable API key ONTBREEKT in env vars')
    }

    console.log('send-email debug:', debugLog)
    return NextResponse.json({ success: true, debug: debugLog })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    debugLog.push(`Top-level error: ${msg}`)
    console.error('Send-email API error:', error)
    return NextResponse.json({
      error: `Fout: ${msg}`,
      debug: debugLog,
    }, { status: 500 })
  }
}
