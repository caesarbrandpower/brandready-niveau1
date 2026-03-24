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
    debugLog.push(`Airtable API key set: ${!!airtableApiKey}`)

    if (airtableApiKey) {
      try {
        const airtableUrl = 'https://api.airtable.com/v0/appQ8PADMp8Sc7mXT/Brandprompt%20Leads'

        const airtableRes = await fetch(airtableUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              Email: email,
              Superprompt: (superprompt || '').slice(0, 500),
              Datum: new Date().toISOString().split('T')[0],
            },
          }),
        })

        const airtableBody = await airtableRes.text()
        debugLog.push(`Airtable status: ${airtableRes.status}`)
        debugLog.push(`Airtable response: ${airtableBody.substring(0, 500)}`)

        if (!airtableRes.ok) {
          console.error('Airtable error response:', airtableBody)
        }
      } catch (airtableError) {
        const msg = airtableError instanceof Error ? airtableError.message : String(airtableError)
        debugLog.push(`Airtable exception: ${msg}`)
        console.error('Airtable error:', airtableError)
      }
    } else {
      debugLog.push('Airtable API key niet geconfigureerd')
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
