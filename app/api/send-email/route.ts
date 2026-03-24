import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, superprompt } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
    }

    // 1. Opslaan in Airtable
    const airtableBaseId = process.env.AIRTABLE_BASE_ID
    const airtableApiKey = process.env.AIRTABLE_API_KEY

    if (airtableBaseId && airtableApiKey) {
      try {
        await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Brandprompt%20Leads`, {
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
      } catch (airtableError) {
        console.error('Airtable error:', airtableError)
      }
    } else {
      console.log('Airtable niet geconfigureerd, lead opgeslagen in logs:', email)
    }

    // 2. Verstuur email via Nodemailer
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: 'mail.mijndomein.nl',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      const emailBody = `Hoi,

Hier is jouw superprompt. Kopieer hem in ChatGPT of Claude om direct on-brand te schrijven.

${superprompt}

Groetjes,
Caesar van Newfound
www.newfound.agency
+31 6 27 52 56 35`

      await transporter.sendMail({
        from: 'hello@newfound.agency',
        to: email,
        bcc: 'hello@newfound.agency',
        subject: 'Jouw superprompt van Brandprompt',
        text: emailBody,
      })
    } else {
      console.log('SMTP niet geconfigureerd, email niet verstuurd naar:', email)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send-email API error:', error)
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwerken' },
      { status: 500 }
    )
  }
}
