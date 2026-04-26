import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/supabase/server';

export const maxDuration = 120;

interface QualifyRequest {
  candidate_id: string;
  qualified_by: string; // recruiter name
  // Discovery call data
  discovery_call_notes: string;
  confirmed_salary_min?: number;
  confirmed_salary_max?: number;
  confirmed_start_date?: string;
  notice_period_days?: number;
  confirmed_work_mode?: string;
  confirmed_location?: string;
  english_level?: string;
  french_level?: string;
  currently_employed?: boolean;
  actively_interviewing?: boolean;
  competing_offers?: string;
  recruiter_recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  recruiter_assessment?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body: QualifyRequest = await request.json();

    if (!body.candidate_id || !body.recruiter_recommendation) {
      return NextResponse.json(
        { error: 'candidate_id and recruiter_recommendation are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!supabaseUrl || !supabaseKey || !anthropicKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Get the candidate + mandate context
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*, mandates(*)')
      .eq('id', body.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const mandate = candidate.mandates;

    // If recommendation is 'no', mark as rejected and skip Claude formatting
    if (body.recruiter_recommendation === 'no') {
      const { error } = await supabase
        .from('candidates')
        .update({
          qualification_status: 'rejected_after_call',
          discovery_call_completed_at: new Date().toISOString(),
          discovery_call_notes: body.discovery_call_notes,
          qualified_by: body.qualified_by,
          recruiter_recommendation: body.recruiter_recommendation,
          recruiter_assessment: body.recruiter_assessment,
        })
        .eq('id', body.candidate_id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        status: 'rejected_after_call',
        message: 'Candidat marqué comme rejeté après discovery call',
      });
    }

    // Use Claude to generate a polished client-facing profile
    const systemPrompt = `Tu es un expert en recrutement chez Aimio Recrutement, une agence de chasse de tête haut de gamme.

Ton rôle : transformer les notes brutes du discovery call en un dossier client-facing professionnel, persuasif et honnête.

Le dossier doit :
- Être en français (sauf si le mandat est en anglais — dans ce cas en anglais)
- Mettre en valeur les forces RÉELLES du candidat (validées en call)
- Mentionner honnêtement les points d'attention (pas de bullshit)
- Articuler clairement la motivation à bouger
- Donner au client toute l'info nécessaire pour décider de l'interviewer

Format de réponse JSON :
{
  "client_facing_profile": "Texte de présentation polished, 200-400 mots, persuasif mais honnête",
  "client_facing_strengths": ["force 1", "force 2", "force 3", "force 4"],
  "client_facing_concerns": ["point d'attention 1", "point d'attention 2"],
  "client_facing_motivation": "Une phrase claire sur ce qui motive le candidat à bouger MAINTENANT"
}`;

    const userPrompt = `Voici le contexte pour générer le dossier client :

# MANDAT
- Poste : ${mandate?.title ?? 'N/A'}
- Entreprise cliente : à déterminer
- Salaire offert : $${mandate?.salary_min ?? '?'} - $${mandate?.salary_max ?? '?'}
- Localisation : ${mandate?.location ?? 'N/A'}
- Mode : ${mandate?.work_mode ?? 'N/A'}

# CANDIDAT
- Nom : ${candidate.name}
- Titre actuel : ${candidate.current_title}
- Entreprise actuelle : ${candidate.current_company ?? 'N/A'}
- Localisation : ${candidate.location ?? 'N/A'}
- Années d'expérience : ${candidate.experience_years ?? 'N/A'}
- Score IA initial : ${candidate.score ?? 'N/A'}/10

# DONNÉES VALIDÉES EN DISCOVERY CALL (${body.qualified_by})
- Salaire confirmé : $${body.confirmed_salary_min ?? '?'} - $${body.confirmed_salary_max ?? '?'}
- Date de début souhaitée : ${body.confirmed_start_date ?? 'N/A'}
- Délai de préavis : ${body.notice_period_days ?? '?'} jours
- Mode de travail souhaité : ${body.confirmed_work_mode ?? 'N/A'}
- Localisation confirmée : ${body.confirmed_location ?? 'N/A'}
- Niveau français : ${body.french_level ?? 'N/A'}
- Niveau anglais : ${body.english_level ?? 'N/A'}
- Actuellement en poste : ${body.currently_employed ? 'Oui' : 'Non'}
- Interviewe ailleurs : ${body.actively_interviewing ? 'Oui' : 'Non'}
- Offres compétitrices : ${body.competing_offers ?? 'Aucune mentionnée'}

# NOTES DU DISCOVERY CALL (recruteur Aimio)
${body.discovery_call_notes}

# ÉVALUATION DU RECRUTEUR
- Recommandation : ${body.recruiter_recommendation}
- Évaluation : ${body.recruiter_assessment ?? 'N/A'}

Génère le dossier client-facing en respectant strictement le format JSON demandé.`;

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText =
      completion.content[0].type === 'text' ? completion.content[0].text : '';

    // Extract JSON from Claude's response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON');
    }

    const formattedProfile = JSON.parse(jsonMatch[0]);

    // Save everything to Supabase
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        qualification_status: 'qualified',
        discovery_call_completed_at: new Date().toISOString(),
        discovery_call_notes: body.discovery_call_notes,
        qualified_by: body.qualified_by,
        confirmed_salary_min: body.confirmed_salary_min,
        confirmed_salary_max: body.confirmed_salary_max,
        confirmed_start_date: body.confirmed_start_date,
        notice_period_days: body.notice_period_days,
        confirmed_work_mode: body.confirmed_work_mode,
        confirmed_location: body.confirmed_location,
        english_level: body.english_level,
        french_level: body.french_level,
        currently_employed: body.currently_employed,
        actively_interviewing: body.actively_interviewing,
        competing_offers: body.competing_offers,
        recruiter_recommendation: body.recruiter_recommendation,
        recruiter_assessment: body.recruiter_assessment,
        // Claude-generated client-facing content
        client_facing_profile: formattedProfile.client_facing_profile,
        client_facing_strengths: formattedProfile.client_facing_strengths,
        client_facing_concerns: formattedProfile.client_facing_concerns,
        client_facing_motivation: formattedProfile.client_facing_motivation,
      })
      .eq('id', body.candidate_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      status: 'qualified',
      candidate_id: body.candidate_id,
      formatted_profile: formattedProfile,
      message:
        'Candidat qualifié avec succès. Dossier client-facing généré par Claude. Prêt à livrer au client.',
    });
  } catch (error) {
    console.error('Qualify candidate error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to qualify candidate',
      },
      { status: 500 }
    );
  }
}
