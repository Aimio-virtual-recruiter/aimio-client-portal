import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { candidate_id, subject, html_body, to_email } = body

    // Send email via Resend
    const { data, error: sendError } = await resend.emails.send({
      from: 'Marc-Antoine Cote <marcantoine@send.aimiorecrutement.com>',
      to: [to_email],
      subject: subject,
      html: html_body,
      replyTo: 'marcantoine.cote@aimiorecrutement.com',
    })

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 })
    }

    // Log the outreach in Supabase
    await supabase.from('outreach_emails').insert({
      candidate_id,
      to_email,
      subject,
      body: html_body,
      resend_id: data?.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sequence_step: 1,
    })

    return NextResponse.json({ success: true, email_id: data?.id })

  } catch (error) {
    console.error('Send outreach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
