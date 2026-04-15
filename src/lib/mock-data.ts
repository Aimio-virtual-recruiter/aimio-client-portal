import { Company, Mandate, Candidate, Report } from './supabase'

export const mockCompany: Company = {
  id: '1',
  name: 'Construction Lemieux Inc.',
  industry: 'Construction',
  plan: 'pro',
  mrr: 2999,
  created_at: '2026-04-01'
}

export const mockMandates: Mandate[] = [
  {
    id: '1',
    company_id: '1',
    title: 'Estimateur senior',
    department: 'Estimation',
    salary_min: 85000,
    salary_max: 100000,
    location: 'Montréal, QC',
    work_mode: 'Hybride (3 jours)',
    status: 'active',
    candidates_delivered: 12,
    created_at: '2026-04-01'
  },
  {
    id: '2',
    company_id: '1',
    title: 'Chargé de projet',
    department: 'Opérations',
    salary_min: 90000,
    salary_max: 110000,
    location: 'Laval, QC',
    work_mode: 'Présentiel',
    status: 'active',
    candidates_delivered: 8,
    created_at: '2026-04-03'
  },
  {
    id: '3',
    company_id: '1',
    title: 'Contrôleur financier',
    department: 'Finance',
    salary_min: 95000,
    salary_max: 115000,
    location: 'Montréal, QC',
    work_mode: 'Hybride (2 jours)',
    status: 'active',
    candidates_delivered: 5,
    created_at: '2026-04-05'
  }
]

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    mandate_id: '1',
    name: 'Jean-François Tremblay',
    current_title: 'Estimateur senior',
    current_company: 'Construction ABC',
    location: 'Laval, QC',
    experience_years: 8,
    score: 8.7,
    score_details: [
      { criteria: 'Expérience pertinente', score: 9, weight: 20 },
      { criteria: 'Compétences techniques', score: 8, weight: 15 },
      { criteria: 'Bilinguisme', score: 10, weight: 10 },
      { criteria: 'Stabilité professionnelle', score: 8, weight: 10 },
      { criteria: 'Localisation', score: 9, weight: 10 },
      { criteria: 'Formation', score: 7, weight: 10 },
      { criteria: 'Progression de carrière', score: 8, weight: 10 },
      { criteria: 'Disponibilité', score: 9, weight: 5 },
      { criteria: 'Adéquation culturelle', score: 8, weight: 5 },
      { criteria: 'Salaire compatible', score: 7, weight: 5 }
    ],
    strengths: [
      '8 ans d\'expérience en estimation résidentielle et commerciale',
      'Maîtrise AutoCAD, Planswift, Excel avancé et BIM',
      'Bilingue parfait — gère des projets avec des clients anglophones'
    ],
    concerns: [
      'Cherche minimum 95K$ (client offre 85-100K$)',
      'Préfère 2 jours au bureau maximum (client veut 3)'
    ],
    motivation: 'Cherche un environnement plus familial et moins corporate. Intéressé par la croissance de l\'entreprise et la possibilité de gérer une équipe d\'estimation à moyen terme.',
    availability: 'Disponible dans 3-4 semaines (préavis à donner)',
    salary_expectations: '95,000$ - 105,000$',
    languages: ['Français', 'Anglais'],
    education: 'DEC Génie civil — Polytechnique Montréal',
    career_history: [
      { title: 'Estimateur senior', company: 'Construction ABC', period: '2021 - Présent' },
      { title: 'Estimateur', company: 'Groupe XYZ', period: '2018 - 2021' },
      { title: 'Technicien en estimation', company: 'Entreprise DEF', period: '2016 - 2018' }
    ],
    status: 'new',
    delivered_at: '2026-04-10'
  },
  {
    id: '2',
    mandate_id: '1',
    name: 'Marie-Claude Gagnon',
    current_title: 'Estimatrice principale',
    current_company: 'Pomerleau',
    location: 'Montréal, QC',
    experience_years: 12,
    score: 9.2,
    score_details: [
      { criteria: 'Expérience pertinente', score: 10, weight: 20 },
      { criteria: 'Compétences techniques', score: 9, weight: 15 },
      { criteria: 'Bilinguisme', score: 9, weight: 10 },
      { criteria: 'Stabilité professionnelle', score: 9, weight: 10 },
      { criteria: 'Localisation', score: 10, weight: 10 },
      { criteria: 'Formation', score: 9, weight: 10 },
      { criteria: 'Progression de carrière', score: 9, weight: 10 },
      { criteria: 'Disponibilité', score: 8, weight: 5 },
      { criteria: 'Adéquation culturelle', score: 9, weight: 5 },
      { criteria: 'Salaire compatible', score: 8, weight: 5 }
    ],
    strengths: [
      '12 ans chez Pomerleau — connaissance approfondie du marché québécois',
      'Gère actuellement une équipe de 3 estimateurs',
      'Expérience en résidentiel ET commercial de grande envergure'
    ],
    concerns: [
      'Salaire actuel estimé à 105K$ — pourrait demander 110K$+',
      'Habituée aux grandes structures, adaptation PME à valider'
    ],
    motivation: 'Veut plus d\'autonomie et de responsabilités. Fatiguée de la bureaucratie chez Pomerleau. Cherche un rôle où elle peut avoir un impact direct.',
    availability: 'Disponible dans 4-6 semaines',
    salary_expectations: '105,000$ - 115,000$',
    languages: ['Français', 'Anglais'],
    education: 'BAC Génie de la construction — ÉTS',
    career_history: [
      { title: 'Estimatrice principale', company: 'Pomerleau', period: '2019 - Présent' },
      { title: 'Estimatrice senior', company: 'Pomerleau', period: '2016 - 2019' },
      { title: 'Estimatrice', company: 'SNC-Lavalin', period: '2014 - 2016' }
    ],
    status: 'new',
    delivered_at: '2026-04-10'
  },
  {
    id: '3',
    mandate_id: '1',
    name: 'Patrick Bergeron',
    current_title: 'Estimateur',
    current_company: 'Devimco',
    location: 'Brossard, QC',
    experience_years: 5,
    score: 7.4,
    score_details: [
      { criteria: 'Expérience pertinente', score: 7, weight: 20 },
      { criteria: 'Compétences techniques', score: 7, weight: 15 },
      { criteria: 'Bilinguisme', score: 8, weight: 10 },
      { criteria: 'Stabilité professionnelle', score: 6, weight: 10 },
      { criteria: 'Localisation', score: 8, weight: 10 },
      { criteria: 'Formation', score: 8, weight: 10 },
      { criteria: 'Progression de carrière', score: 7, weight: 10 },
      { criteria: 'Disponibilité', score: 10, weight: 5 },
      { criteria: 'Adéquation culturelle', score: 7, weight: 5 },
      { criteria: 'Salaire compatible', score: 9, weight: 5 }
    ],
    strengths: [
      'Disponible immédiatement — en fin de contrat',
      'Certification PMP en cours',
      'Attentes salariales dans le budget du client'
    ],
    concerns: [
      'Seulement 5 ans d\'expérience (le client veut senior)',
      '3 emplois en 5 ans — stabilité à valider'
    ],
    motivation: 'Cherche un poste permanent stable après 2 contrats consécutifs. Prêt à s\'investir à long terme.',
    availability: 'Disponible immédiatement',
    salary_expectations: '82,000$ - 90,000$',
    languages: ['Français', 'Anglais'],
    education: 'BAC Génie civil — Concordia',
    career_history: [
      { title: 'Estimateur', company: 'Devimco', period: '2024 - 2026 (contrat)' },
      { title: 'Estimateur junior', company: 'EBC Inc.', period: '2022 - 2024' },
      { title: 'Technicien', company: 'Magil Construction', period: '2021 - 2022' }
    ],
    status: 'new',
    delivered_at: '2026-04-10'
  },
  {
    id: '4',
    mandate_id: '1',
    name: 'Sophie Lavoie',
    current_title: 'Directrice estimation',
    current_company: 'Groupe Deschênes Construction',
    location: 'Longueuil, QC',
    experience_years: 15,
    score: 9.5,
    score_details: [
      { criteria: 'Expérience pertinente', score: 10, weight: 20 },
      { criteria: 'Compétences techniques', score: 10, weight: 15 },
      { criteria: 'Bilinguisme', score: 9, weight: 10 },
      { criteria: 'Stabilité professionnelle', score: 10, weight: 10 },
      { criteria: 'Localisation', score: 9, weight: 10 },
      { criteria: 'Formation', score: 9, weight: 10 },
      { criteria: 'Progression de carrière', score: 10, weight: 10 },
      { criteria: 'Disponibilité', score: 7, weight: 5 },
      { criteria: 'Adéquation culturelle', score: 10, weight: 5 },
      { criteria: 'Salaire compatible', score: 6, weight: 5 }
    ],
    strengths: [
      '15 ans d\'expérience — a vu tous les types de projets',
      'Actuellement directrice — leadership prouvé',
      'Connue dans l\'industrie — excellent réseau'
    ],
    concerns: [
      'Salaire actuel estimé à 130K$ — bien au-dessus du budget',
      'Pourrait être surqualifiée pour le poste'
    ],
    motivation: 'Son entreprise a été vendue récemment. La nouvelle direction ne lui plaît pas. Ouverte à un poste senior dans une PME en croissance même si c\'est un step back en titre.',
    availability: 'Disponible dans 6-8 semaines',
    salary_expectations: '115,000$ - 130,000$',
    languages: ['Français', 'Anglais', 'Espagnol'],
    education: 'MBA — HEC Montréal + BAC Génie civil — Poly',
    career_history: [
      { title: 'Directrice estimation', company: 'Groupe Deschênes', period: '2020 - Présent' },
      { title: 'Chef estimation', company: 'Broccolini', period: '2016 - 2020' },
      { title: 'Estimatrice senior', company: 'EllisDon', period: '2011 - 2016' }
    ],
    status: 'interested',
    delivered_at: '2026-04-08'
  },
  {
    id: '5',
    mandate_id: '1',
    name: 'Alexandre Dubois',
    current_title: 'Estimateur senior',
    current_company: 'Bâtiment Vert Construction',
    location: 'Montréal, QC',
    experience_years: 7,
    score: 8.1,
    score_details: [
      { criteria: 'Expérience pertinente', score: 8, weight: 20 },
      { criteria: 'Compétences techniques', score: 8, weight: 15 },
      { criteria: 'Bilinguisme', score: 9, weight: 10 },
      { criteria: 'Stabilité professionnelle', score: 8, weight: 10 },
      { criteria: 'Localisation', score: 10, weight: 10 },
      { criteria: 'Formation', score: 7, weight: 10 },
      { criteria: 'Progression de carrière', score: 8, weight: 10 },
      { criteria: 'Disponibilité', score: 8, weight: 5 },
      { criteria: 'Adéquation culturelle', score: 9, weight: 5 },
      { criteria: 'Salaire compatible', score: 8, weight: 5 }
    ],
    strengths: [
      'Spécialisé en construction durable et LEED',
      'Maîtrise des logiciels modernes (BIM 360, Procore)',
      'Excellent communicateur — apprécié des clients'
    ],
    concerns: [
      'Moins d\'expérience en résidentiel (plus commercial)',
      'N\'a jamais géré d\'équipe'
    ],
    motivation: 'Passionné par la construction verte. Cherche une entreprise qui partage ses valeurs environnementales et qui lui donnerait l\'opportunité de grandir vers un rôle de gestion.',
    availability: 'Disponible dans 4 semaines',
    salary_expectations: '90,000$ - 100,000$',
    languages: ['Français', 'Anglais'],
    education: 'BAC Génie du bâtiment — ÉTS + Certification LEED AP',
    career_history: [
      { title: 'Estimateur senior', company: 'Bâtiment Vert Construction', period: '2022 - Présent' },
      { title: 'Estimateur', company: 'Lemay Construction', period: '2019 - 2022' },
      { title: 'Technicien estimation', company: 'WSP', period: '2017 - 2019' }
    ],
    status: 'new',
    delivered_at: '2026-04-11'
  }
]

export const mockReports: Report[] = [
  {
    id: '1',
    company_id: '1',
    mandate_id: '1',
    week: '7-11 avril 2026',
    profiles_sourced: 247,
    candidates_approached: 48,
    responses_received: 16,
    candidates_qualified: 8,
    candidates_delivered: 5,
    market_salary_median: 92000,
    market_availability: 'Modérée — Les estimateurs seniors sont en demande au Québec. Le marché est compétitif.',
    recommendations: [
      'Considérer d\'augmenter le budget salarial à 95-105K$ pour attirer les profils les plus expérimentés',
      'Le mode hybride 2 jours au lieu de 3 augmenterait significativement le bassin de candidats',
      'Plusieurs candidats de qualité sont ouverts mais en processus ailleurs — vitesse de décision importante'
    ],
    created_at: '2026-04-11'
  }
]
