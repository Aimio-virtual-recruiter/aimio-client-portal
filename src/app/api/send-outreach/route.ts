import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'
import { sendCompliantEmail } from '@/lib/email-utils'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { candidate_id, subject, html_body, to_email } = body

    // Send via compliant wrapper: adds CAN-SPAM footer (physical address + unsubscribe),
    // List-Unsubscribe headers, and checks the opt-out suppression list before sending.
    const result = await sendCompliantEmail({
      to: to_email,
      subject,
      html: html_body,
      from: 'Marc-Antoine Cote <marcantoine@send.aimiorecrutement.com>',
      replyTo: 'marcantoine.cote@aimiorecrutement.com',
    })

    if (!result.sent) {
      if (result.reason === 'opted_out') {
        return NextResponse.json({ success: false, skipped: 'opted_out' }, { status: 200 })
      }
      return NextResponse.json({ error: result.error || 'Send failed' }, { status: 500 })
    }

    // Log the outreach in Supabase
    await supabase.from('outreach_emails').insert({
      candidate_id,
      to_email,
      subject,
      body: html_body,
      resend_id: result.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sequence_step: 1,
    })

    return NextResponse.json({ success: true, email_id: result.id })

  } catch (error) {
    console.error('Send outreach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
