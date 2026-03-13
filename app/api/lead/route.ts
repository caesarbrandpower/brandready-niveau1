import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, superPrompt, companyName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
    }

    // 1. Opslaan in Airtable
    const airtableBaseId = process.env.AIRTABLE_BASE_ID
    const airtableApiKey = process.env.AIRTABLE_API_KEY

    if (airtableBaseId && airtableApiKey) {
      try {
        await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Leads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  email,
                  bericht: 'Superprompt tool gebruiker',
                  status: 'Nieuw',
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

      const emailBody = `Hoi!

Hier is je superprompt voor ${companyName}. Kopieer het onderstaande en plak het als systeeminstructie in ChatGPT, Claude of een andere AI-tool.

---

${superPrompt}

---

Handleiding: zo gebruik je je superprompt
https://www.notion.so/3228e9f175cb817e9bc8d6750b4f58aa

Groetjes,
Caesar — newfound.agency`

      await transporter.sendMail({
        from: smtpUser,
        to: email,
        subject: 'Je superprompt + hoe je hem gebruikt',
        text: emailBody,
      })
    } else {
      console.log('SMTP niet geconfigureerd, email niet verstuurd naar:', email)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead API error:', error)
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwerken' },
      { status: 500 }
    )
  }
}
