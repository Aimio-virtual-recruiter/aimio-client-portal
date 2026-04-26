import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'

export const maxDuration = 300

const resend = new Resend(process.env.RESEND_API_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// This API is called by a cron job (Vercel Cron or external) every day
// It checks for candidates who haven't responded and sends follow-ups

export async function GET(request: Request) {
  try {
    // AUTH: accept Vercel Cron secret OR admin user
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isCron) {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Auth required (admin or cron secret)' }, { status: 401 })
      }
    }

    // Get all sent emails that haven't received a reply (cap at 500 per run to avoid timeout)
    const { data: pendingEmails } = await supabase
      .from('outreach_emails')
      .select('*, candidates(*)')
      .eq('status', 'sent')
      .is('replied_at', null)
      .limit(500)

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No follow-ups needed', count: 0 })
    }

    const now = new Date()
    let followUpsSent = 0

    for (const email of pendingEmails) {
      const sentAt = new Date(email.sent_at)
      const daysSinceSent = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24))

      // Follow-up 1: Day 3, Step 2
      if (daysSinceSent >= 3 && email.sequence_step === 1) {
        await sendFollowUp(email, 2)
        followUpsSent++
      }
      // Follow-up 2: Day 7, Step 3 (final)
      else if (daysSinceSent >= 7 && email.sequence_step === 2) {
        await sendFollowUp(email, 3)
        followUpsSent++
      }
    }

    return NextResponse.json({ success: true, followUpsSent })

  } catch (error) {
    console.error('Auto followup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendFollowUp(originalEmail: Record<string, unknown>, step: number) {
  const candidate = originalEmail.candidates as Record<string, unknown>
  if (!candidate) return

  // Generate follow-up with Claude
  const prompt = step === 2
    ? `Write a brief, professional follow-up email (step 2 of 3) to a candidate named ${candidate.name} who we contacted about a ${candidate.current_title} opportunity but hasn't responded. Keep it short (3-4 sentences), friendly, and mention one compelling reason to reply. Don't be pushy. In English. Reply ONLY with the email body text, no subject line, no greeting or signature — just the body.`
    : `Write a final, brief follow-up email (step 3 of 3, last attempt) to a candidate named ${candidate.name} who hasn't responded to 2 previous messages about a ${candidate.current_title} opportunity. Keep it very short (2-3 sentences), respectful, and make it clear this is the last follow-up. In English. Reply ONLY with the email body text, no subject line, no greeting or signature — just the body.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const bodyText = message.content[0].type === 'text' ? message.content[0].text : ''

  const subjects: Record<number, string> = {
    2: `Quick follow-up — ${candidate.current_title} opportunity`,
    3: `Last note — ${candidate.current_title} role`,
  }

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
      <p>Hi ${(candidate.name as string).split(' ')[0]},</p>
      ${bodyText.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
      <p>Best regards,<br/>Marc-Antoine Côté<br/>President, Aimio Recrutement<br/>marcantoine.cote@aimiorecrutement.com</p>
    </div>
  `

  // Send via Resend
  const { data } = await resend.emails.send({
    from: 'Marc-Antoine Cote <marcantoine@send.aimiorecrutement.com>',
    to: [originalEmail.to_email as string],
    subject: subjects[step],
    html: htmlBody,
    replyTo: 'marcantoine.cote@aimiorecrutement.com',
  })

  // Update the original email step
  await supabase
    .from('outreach_emails')
    .update({ sequence_step: step })
    .eq('id', originalEmail.id)

  // Log the follow-up
  await supabase.from('outreach_emails').insert({
    candidate_id: originalEmail.candidate_id,
    to_email: originalEmail.to_email,
    subject: subjects[step],
    body: htmlBody,
    resend_id: data?.id,
    status: 'sent',
    sent_at: new Date().toISOString(),
    sequence_step: step,
  })
}
