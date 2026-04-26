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
    const { mandate_id, week, stats } = body

    // Get mandate + candidates data
    const { data: mandate } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', mandate_id)
      .single()

    const { data: candidates } = await supabase
      .from('candidates')
      .select('*')
      .eq('mandate_id', mandate_id)
      .eq('internal_status', 'approved')

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    const prompt = `Tu es un expert en recrutement. Genere un rapport hebdomadaire pour un client.

POSTE: ${mandate.title}
SALAIRE OFFERT: ${mandate.salary_min}-${mandate.salary_max}$
LOCALISATION: ${mandate.location}

STATS DE LA SEMAINE:
- Profils sources: ${stats.profiles_sourced}
- Candidats approches: ${stats.candidates_approached}
- Reponses recues: ${stats.responses_received}
- Candidats qualifies: ${stats.candidates_qualified}
- Candidats livres: ${stats.candidates_delivered}

CANDIDATS LIVRES CETTE SEMAINE:
${candidates?.map(c => `- ${c.name}: ${c.current_title} chez ${c.current_company}, ${c.experience_years} ans, score ${c.score}/10, attentes ${c.salary_expectations}`).join('\n') || 'Aucun'}

INSTRUCTIONS:
Analyse les donnees et genere:
1. Le salaire median observe sur le marche pour ce poste
2. Une analyse de la disponibilite du marche (1-2 phrases)
3. 3 recommandations concretes et actionnables pour le client

Reponds UNIQUEMENT en JSON:
{
  "market_salary_median": <number>,
  "market_availability": "<analyse du marche>",
  "recommendations": ["<recommandation 1>", "<recommandation 2>", "<recommandation 3>"]
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

    const reportData = JSON.parse(jsonMatch[0])

    // Save report to Supabase
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        company_id: mandate.company_id,
        mandate_id,
        week,
        profiles_sourced: stats.profiles_sourced,
        candidates_approached: stats.candidates_approached,
        responses_received: stats.responses_received,
        candidates_qualified: stats.candidates_qualified,
        candidates_delivered: stats.candidates_delivered,
        market_salary_median: reportData.market_salary_median,
        market_availability: reportData.market_availability,
        recommendations: reportData.recommendations,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })

  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
