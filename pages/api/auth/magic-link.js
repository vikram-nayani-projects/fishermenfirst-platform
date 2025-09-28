import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  try {
    // Generate magic link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fishermenfirst-platform-a8flp9p6i.vercel.app'}/auth/confirm`
      }
    })

    if (error) {
      console.error('Magic link generation error:', error)
      return res.status(400).json({ error: error.message })
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Fishermen First Platform <noreply@resend.dev>',
        to: [email],
        subject: 'Sign in to Fishermen First Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Sign in to Fishermen First Platform</h1>
            <p>Click the button below to sign in to your account:</p>
            <a href="${data.properties.action_link}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
               Sign In
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${data.properties.action_link}</p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          </div>
        `
      })
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text()
      console.error('Resend error:', resendError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    res.status(200).json({ message: 'Magic link sent successfully' })

  } catch (error) {
    console.error('Magic link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}