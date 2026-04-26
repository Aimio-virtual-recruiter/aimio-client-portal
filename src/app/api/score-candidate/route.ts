import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'

export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { mandate_id, candidate } = body

    // Get mandate details for scoring context
    const { data: mandate } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', mandate_id)
      .single()

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    // Claude scores the candidate
    const prompt = `Tu es un expert en recrutement. Analyse ce candidat pour le poste suivant et donne un scoring detaille.

POSTE:
- Titre: ${mandate.title}
- Departement: ${mandate.department || 'N/A'}
- Salaire: ${mandate.salary_min}-${mandate.salary_max}$
- Localisation: ${mandate.location}
- Mode de travail: ${mandate.work_mode}
- Description: ${mandate.description || 'N/A'}

CANDIDAT:
- Nom: ${candidate.name}
- Poste actuel: ${candidate.current_title} chez ${candidate.current_company}
- Experience: ${candidate.experience_years} ans
- Localisation: ${candidate.location}
- Formation: ${candidate.education}
- Langues: ${candidate.languages?.join(', ')}
- Attentes salariales: ${candidate.salary_expectations}
- Disponibilite: ${candidate.availability}
- Parcours: ${JSON.stringify(candidate.career_history)}
- Notes additionnelles: ${candidate.notes || 'Aucune'}

INSTRUCTIONS:
Reponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "score": <number 1-10 avec 1 decimale>,
  "score_details": [
    {"criteria": "Experience pertinente", "score": <1-10>, "weight": 20},
    {"criteria": "Competences techniques", "score": <1-10>, "weight": 15},
    {"criteria": "Bilinguisme", "score": <1-10>, "weight": 10},
    {"criteria": "Stabilite professionnelle", "score": <1-10>, "weight": 10},
    {"criteria": "Localisation", "score": <1-10>, "weight": 10},
    {"criteria": "Formation", "score": <1-10>, "weight": 10},
    {"criteria": "Progression de carriere", "score": <1-10>, "weight": 10},
    {"criteria": "Disponibilite", "score": <1-10>, "weight": 5},
    {"criteria": "Adequation culturelle", "score": <1-10>, "weight": 5},
    {"criteria": "Salaire compatible", "score": <1-10>, "weight": 5}
  ],
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "concerns": ["<point attention 1>", "<point attention 2>"],
  "motivation_assessment": "<analyse de la motivation probable du candidat en 2-3 phrases>",
  "recommendation": "<recommandation pour le gestionnaire: approuver, revoir, ou rejeter>"
}

Sois precis, honnete et base-toi sur les faits. Ne surestime pas.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const scoring = JSON.parse(jsonMatch[0])

    // Save to Supabase
    const { data: savedCandidate, error } = await supabase
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
        languages: candidate.languages,
        career_history: candidate.career_history,
        salary_expectations: candidate.salary_expectations,
        availability: candidate.availability,
        score: scoring.score,
        score_details: scoring.score_details,
        strengths: scoring.strengths,
        concerns: scoring.concerns,
        motivation: scoring.motivation_assessment,
        internal_status: 'draft',
        internal_notes: scoring.recommendation,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      candidate: savedCandidate,
      scoring,
    })

  } catch (error) {
    console.error('Score candidate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
