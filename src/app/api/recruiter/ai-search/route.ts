import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";

export const maxDuration = 30;

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

/**
 * POST /api/recruiter/ai-search
 *
 * Takes a natural language query and converts it to a structured filter
 * that the client applies to its loaded candidate list.
 *
 * Examples:
 *  - "candidats CPA bilingues à Montréal" → { skills: ["CPA"], languages: ["Français","Anglais"], locations: ["Montréal"] }
 *  - "top 10 scores du mois pour Test Inc" → { sort: "score_desc", limit: 10, client_company: "Test Inc", date_range: ... }
 *  - "ceux qui ont répondu mais pas qualifié" → { status: ["replied_interested"] }
 *  - "à recontacter pour la prochaine campagne" → { status: ["replied_not_interested"], min_age_days: 90 }
 */

interface AISearchFilter {
  // Score
  min_score?: number;
  max_score?: number;
  verdicts?: string[]; // STRONG_MATCH, GOOD_MATCH, BORDERLINE, NOT_MATCH
  // Status
  statuses?: string[];
  // Identity
  name_contains?: string;
  // Career
  current_companies?: string[]; // partial match
  past_companies?: string[];
  current_titles?: string[];
  // Location
  cities?: string[];
  countries?: string[];
  // Skills / qualifications
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  schools?: string[];
  // Tags
  tags?: string[];
  has_tags_any?: string[];
  // Contact info
  has_email?: boolean;
  has_phone?: boolean;
  has_linkedin?: boolean;
  email_verified_only?: boolean;
  // Source
  sources?: string[]; // apify_linkedin, apollo, internal_db, manual_recruiter
  // Client/mandate
  client_company_contains?: string;
  mandate_title_contains?: string;
  // Time
  created_after_days_ago?: number; // e.g. 7 = last week
  created_before_days_ago?: number; // e.g. 90 = older than 3 months
  // Sort + limit
  sort?: "score_desc" | "score_asc" | "recent" | "oldest";
  limit?: number;
}

interface AIResponse {
  filter: AISearchFilter;
  summary: string; // human-readable explanation of what was filtered
  suggestions?: string[]; // alternative queries to try
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "recruiter") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const query: string = (body.query || "").trim();
    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const prompt = `Tu es un assistant de recherche pour un CRM de recrutement. Convertis cette question en français en filtre JSON structuré.

QUESTION : "${query}"

CHAMPS DISPONIBLES (utilise SEULEMENT ceux-ci, omet les autres) :
- min_score, max_score : nombres 0-100
- verdicts : ["STRONG_MATCH","GOOD_MATCH","BORDERLINE","NOT_MATCH"]
- statuses : ["new","kept","rejected","outreach_ready","outreached","replied_interested","replied_not_interested","qualifying","qualified","delivered","client_interested","client_not_interested","hired"]
- name_contains : string
- current_companies, past_companies : array de noms d'entreprises (partial match insensitive)
- current_titles : array de titres
- cities, countries : array de lieux
- skills : array (ex: ["CPA","Excel","SAP"])
- certifications : array (ex: ["PMP","CPA"])
- languages : array (ex: ["Français","Anglais"])
- schools : array (ex: ["HEC","McGill"])
- tags : array (tags du recruteur)
- has_email, has_phone, has_linkedin, email_verified_only : booléens
- sources : ["apify_linkedin","apollo","internal_db","manual_recruiter"]
- client_company_contains : string (nom du client)
- mandate_title_contains : string (titre du mandat)
- created_after_days_ago : nombre (ex: 7 = créés dans les 7 derniers jours)
- created_before_days_ago : nombre (ex: 90 = créés il y a plus de 90 jours)
- sort : "score_desc" | "score_asc" | "recent" | "oldest"
- limit : nombre

EXEMPLES :
Q: "candidats CPA bilingues à Montréal"
R: {"filter":{"certifications":["CPA"],"languages":["Français","Anglais"],"cities":["Montréal"]},"summary":"Candidats CPA, bilingues FR/EN, à Montréal"}

Q: "top 10 scores pour Test Inc"
R: {"filter":{"client_company_contains":"Test Inc","sort":"score_desc","limit":10},"summary":"Top 10 candidats par score pour Test Inc"}

Q: "à recontacter dans 3 mois"
R: {"filter":{"statuses":["replied_not_interested"],"created_before_days_ago":90},"summary":"Candidats qui ont décliné il y a 90+ jours — re-engageables"}

Q: "tous mes hot-leads de la semaine"
R: {"filter":{"tags":["hot-lead"],"created_after_days_ago":7},"summary":"Hot leads ajoutés cette semaine"}

Q: "candidats sans email"
R: {"filter":{"has_email":false},"summary":"Candidats sans email — à enrichir"}

Q: "embauchés cette année"
R: {"filter":{"statuses":["hired"],"created_after_days_ago":365},"summary":"Embauches confirmées cette année"}

Q: "ceux qu'on a livrés mais pas eu de retour client"
R: {"filter":{"statuses":["delivered"]},"summary":"Livrés au client, en attente de feedback"}

RÉPONDS SEULEMENT en JSON valide avec cette structure (PAS de texte autour) :
{
  "filter": { ...champs filtrés... },
  "summary": "explication courte 1 phrase de ce qui est filtré",
  "suggestions": ["question alternative 1", "question alternative 2"]
}

Si la question est ambiguë, fais ton meilleur guess + ajoute 2-3 suggestions plus précises.`;

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Claude n'a pas retourné de JSON valide" },
        { status: 500 }
      );
    }

    const parsed: AIResponse = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[ai-search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
