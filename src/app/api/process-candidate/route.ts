import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

/*
  PIPELINE COMPLET — Quand le gestionnaire entre un candidat :

  1. Sauvegarde le candidat dans Supabase (draft)
  2. Claude score automatiquement sur 10 critères
  3. Claude génère le message d'approche email
  4. Claude génère le message LinkedIn InMail
  5. Resend envoie l'email automatiquement
  6. Le InMail est retourné pour copier-coller
  7. Notification au gestionnaire

  Le gestionnaire n'a qu'à entrer les infos — tout le reste est automatique.
*/

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { mandate_id, candidate, to_email } = body

    // 1. Get mandate details
    const { data: mandate } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', mandate_id)
      .single()

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    // 2. Score with Claude
    const scoringPrompt = `You are an expert recruiter. Analyze this candidate for the following role and provide detailed scoring.

ROLE:
- Title: ${mandate.title}
- Department: ${mandate.department || 'N/A'}
- Salary: $${mandate.salary_min}-${mandate.salary_max}
- Location: ${mandate.location}
- Work mode: ${mandate.work_mode}

CANDIDATE:
- Name: ${candidate.name}
- Current role: ${candidate.current_title} at ${candidate.current_company}
- Experience: ${candidate.experience_years} years
- Location: ${candidate.location}
- Education: ${candidate.education}
- Languages: ${candidate.languages?.join(', ')}
- Salary expectations: ${candidate.salary_expectations}
- Availability: ${candidate.availability}
- Career history: ${JSON.stringify(candidate.career_history)}
- Notes: ${candidate.notes || 'None'}

Respond ONLY in valid JSON:
{
  "score": <number 1-10 with 1 decimal>,
  "score_details": [
    {"criteria": "Relevant experience", "score": <1-10>, "weight": 20},
    {"criteria": "Technical skills", "score": <1-10>, "weight": 15},
    {"criteria": "Bilingualism", "score": <1-10>, "weight": 10},
    {"criteria": "Professional stability", "score": <1-10>, "weight": 10},
    {"criteria": "Location", "score": <1-10>, "weight": 10},
    {"criteria": "Education", "score": <1-10>, "weight": 10},
    {"criteria": "Career progression", "score": <1-10>, "weight": 10},
    {"criteria": "Availability", "score": <1-10>, "weight": 5},
    {"criteria": "Cultural fit", "score": <1-10>, "weight": 5},
    {"criteria": "Salary fit", "score": <1-10>, "weight": 5}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "motivation_assessment": "<2-3 sentence assessment>",
  "recommendation": "<approve, review, or reject>",
  "email_subject": "<compelling email subject line>",
  "email_body": "<professional outreach email body, 4-6 sentences, do NOT reveal client name, mention the role and key selling points>",
  "linkedin_message": "<short LinkedIn InMail, max 300 characters, direct and compelling>"
}`

    const scoringResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: scoringPrompt }],
    })

    const responseText = scoringResponse.content[0].type === 'text' ? scoringResponse.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const aiResult = JSON.parse(jsonMatch[0])

    // 3. Save candidate to Supabase
    const { data: savedCandidate, error: saveError } = await supabase
      .from('candidates')
      .insert({
        mandate_id,
        company_id: mandate.company_id,
        name: candidate.name,
        current_title: candidate.current_title,
        current_company: candidate.current_company,
        location: candidate.location,
        experience_years: candidate.experience_years,
        education: candidate.education,
        languages: candidate.languages || [],
        career_history: candidate.career_history || [],
        salary_expectations: candidate.salary_expectations,
        availability: candidate.availability,
        score: aiResult.score,
        score_details: aiResult.score_details,
        strengths: aiResult.strengths,
        concerns: aiResult.concerns,
        motivation: aiResult.motivation_assessment,
        internal_status: 'draft',
        internal_notes: aiResult.recommendation,
        status: 'new',
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    // 4. Send email automatically if we have the email
    let emailSent = false
    let emailId = null

    if (to_email) {
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px;">
          <p>Hi ${candidate.name.split(' ')[0]},</p>
          ${aiResult.email_body.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
          <p style="margin-top: 24px;">Best regards,<br/>
          <strong>Marc-Antoine Côté</strong><br/>
          President, Aimio Recrutement<br/>
          <a href="https://aimiorecrutement.com" style="color: #6C2BD9;">aimiorecrutement.com</a></p>
        </div>
      `

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Marc-Antoine Cote <marcantoine@send.aimiorecrutement.com>',
        to: [to_email],
        subject: aiResult.email_subject,
        html: htmlBody,
        replyTo: 'marcantoine.cote@aimiorecrutement.com',
      })

      if (!emailError && emailData) {
        emailSent = true
        emailId = emailData.id

        // Log the email
        await supabase.from('outreach_emails').insert({
          candidate_id: savedCandidate.id,
          to_email,
          subject: aiResult.email_subject,
          body: htmlBody,
          resend_id: emailData.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sequence_step: 1,
        })
      }
    }

    // 5. Return everything
    return NextResponse.json({
      success: true,
      candidate: savedCandidate,
      scoring: {
        score: aiResult.score,
        score_details: aiResult.score_details,
        strengths: aiResult.strengths,
        concerns: aiResult.concerns,
        recommendation: aiResult.recommendation,
      },
      outreach: {
        email_sent: emailSent,
        email_id: emailId,
        email_subject: aiResult.email_subject,
        email_body: aiResult.email_body,
        linkedin_message: aiResult.linkedin_message,
      },
    })

  } catch (error) {
    console.error('Process candidate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
