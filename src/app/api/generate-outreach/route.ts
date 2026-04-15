import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mandate_id, candidate_name, channel } = body

    // Get mandate details
    const { data: mandate } = await supabase
      .from('mandates')
      .select('*, companies(*)')
      .eq('id', mandate_id)
      .single()

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    const prompt = `Tu es un recruteur expert. Redige un message d'approche personnalise pour contacter un candidat passif.

POSTE:
- Titre: ${mandate.title}
- Entreprise: ${mandate.companies?.name || 'Notre client'}
- Industrie: ${mandate.companies?.industry || 'N/A'}
- Salaire: ${mandate.salary_min}-${mandate.salary_max}$
- Localisation: ${mandate.location}
- Mode: ${mandate.work_mode}

CANDIDAT: ${candidate_name}
CANAL: ${channel === 'linkedin' ? 'LinkedIn InMail (max 300 caracteres)' : 'Email (max 150 mots)'}

REGLES:
- Ton professionnel mais chaleureux
- Mentionne specifiquement pourquoi ce candidat est pertinent
- Ne revele PAS le nom de l'entreprise cliente (dis "un client etabli" ou "une entreprise reconnue")
- Inclus le salaire et le mode de travail
- Termine par une question ouverte
- En francais quebecois professionnel
- NE METS PAS de guillemets autour du message

${channel === 'linkedin' ? 'Format: Un seul paragraphe court et direct.' : 'Format: Objet + corps du message. Signe "Marc-Antoine Cote, Aimio Recrutement".'}

Reponds UNIQUEMENT en JSON:
${channel === 'linkedin' ?
  '{"message": "<le message LinkedIn>"}' :
  '{"subject": "<objet du courriel>", "body": "<corps du courriel>"}'
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const outreach = JSON.parse(jsonMatch[0])

    return NextResponse.json({ success: true, outreach, channel })

  } catch (error) {
    console.error('Generate outreach error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
