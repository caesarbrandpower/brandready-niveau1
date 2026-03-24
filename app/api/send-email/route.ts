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

    // 1. Opslaan in Airtable
    const airtableBaseId = process.env.AIRTABLE_BASE_ID
    const airtableApiKey = process.env.AIRTABLE_API_KEY
    debugLog.push(`Airtable configured: ${!!(airtableBaseId && airtableApiKey)}`)

    if (airtableBaseId && airtableApiKey) {
      try {
        const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/Brandprompt%20Leads`
        debugLog.push(`Airtable URL: ${airtableUrl}`)

        const airtableRes = await fetch(airtableUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Email: email,
                  Superprompt: (superprompt || '').substring(0, 500),
                  Datum: new Date().toISOString().split('T')[0],
                },
              },
            ],
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
    }

    // 2. Verstuur email via Nodemailer
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    debugLog.push(`SMTP configured: ${!!(smtpUser && smtpPass)}`)
    debugLog.push(`SMTP_USER: ${smtpUser ? smtpUser.substring(0, 3) + '***' : 'NOT SET'}`)

    if (smtpUser && smtpPass) {
      try {
        debugLog.push('Creating SMTP transporter...')
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

        debugLog.push('Verifying SMTP connection...')
        await transporter.verify()
        debugLog.push('SMTP connection verified OK')

        const emailBody = `Hoi,

Hier is jouw superprompt. Kopieer hem in ChatGPT of Claude om direct on-brand te schrijven.

${superprompt}

Groetjes,
Caesar van Newfound
www.newfound.agency
+31 6 27 52 56 35`

        debugLog.push('Sending email...')
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
        // Don't throw — return the debug info
        return NextResponse.json({
          error: `SMTP fout: ${msg}`,
          debug: debugLog,
        }, { status: 500 })
      }
    } else {
      debugLog.push('SMTP niet geconfigureerd, email niet verstuurd')
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
