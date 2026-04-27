"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Target,
  MapPin,
  Briefcase,
  Plus,
  X,
  GraduationCap,
  Languages,
  Award,
  Building2,
  Globe2,
  UserCheck,
  Filter,
  Info,
} from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  roles_hiring_for: string | null;
  country: string;
}

interface SearchCriteria {
  // Position
  jobTitlesCurrent: string[];
  jobTitlesPast: string[];
  excludeTitles: string[];

  // Experience
  yearsExperienceMin: number;
  yearsExperienceMax: number;
  seniorityLevels: string[];
  functions: string[];

  // Geography
  locations: string[];
  countries: string[];
  remoteOk: boolean;
  willingToRelocate: boolean;

  // Companies
  currentEmployers: string[];
  pastEmployers: string[];
  excludeEmployers: string[];
  industries: string[];
  companySizes: string[];

  // Skills + education
  skills: string[];
  certifications: string[];
  languages: { name: string; proficiency: string }[];
  schools: string[];
  degrees: string[];
  fieldsOfStudy: string[];

  // Signals
  openToWork: boolean;
  recentlyChangedJobs: boolean;
  yearsAtCurrentMin: number;

  // Diversity (optional)
  diversityFilters: string[];
}

interface SearchBrief {
  boolean_search: string;
  primary_keywords: string[];
  secondary_keywords: string[];
  location_filters: string[];
  experience_range: string;
  target_companies: string[];
  exclude_companies: string[];
  seniority_titles: string[];
}

interface SourcingResult {
  sourcing_run_id: string;
  candidates_found: number;
  candidates_after_dedupe: number;
  candidates_inserted: number;
  sources_used: string[];
}

const SENIORITY_LEVELS = [
  "Stagiaire",
  "Junior (0-2 ans)",
  "Intermédiaire (3-5 ans)",
  "Sénior (6-10 ans)",
  "Lead / Manager",
  "Directeur",
  "VP / Vice-Président",
  "C-Suite (CEO/CFO/COO)",
];

const FUNCTIONS = [
  "Comptabilité / Finance",
  "Construction / Génie civil",
  "Génie mécanique",
  "Génie électrique",
  "Droit / Juridique",
  "Ressources humaines",
  "Ventes / Développement",
  "Marketing",
  "Opérations",
  "Logistique / Chaîne d'approvisionnement",
  "Gestion de projet",
  "Administration",
  "Production / Manufacturier",
  "Service à la clientèle",
  "Santé / Médical",
  "Éducation",
  "Immobilier",
  "Restauration / Hôtellerie",
];

const INDUSTRIES = [
  "Construction",
  "Manufacturier",
  "Services financiers",
  "Cabinets d'avocats",
  "Cabinets comptables",
  "Immobilier",
  "Énergie / Mines",
  "Transport / Logistique",
  "Détail / Commerce",
  "Hôtellerie / Restauration",
  "Santé",
  "Éducation",
  "Gouvernement / Public",
  "OBNL",
  "Agriculture / Agroalimentaire",
];

const COMPANY_SIZES = [
  "1-10 employés",
  "11-50 employés",
  "51-200 employés",
  "201-500 employés",
  "501-1000 employés",
  "1001-5000 employés",
  "5000+ employés",
];

const LANGUAGE_PROFICIENCY = ["Notions", "Conversationnel", "Courant", "Bilingue / Natif"];

const COMMON_LANGUAGES = [
  "Français",
  "Anglais",
  "Espagnol",
  "Mandarin",
  "Arabe",
  "Portugais",
  "Italien",
  "Allemand",
];

const DEGREE_LEVELS = [
  "DEP / DEC",
  "Certificat",
  "Baccalauréat",
  "Maîtrise",
  "MBA",
  "Doctorat (Ph.D.)",
];

function emptyCriteria(): SearchCriteria {
  return {
    jobTitlesCurrent: [],
    jobTitlesPast: [],
    excludeTitles: [],
    yearsExperienceMin: 0,
    yearsExperienceMax: 30,
    seniorityLevels: [],
    functions: [],
    locations: [],
    countries: [],
    remoteOk: false,
    willingToRelocate: false,
    currentEmployers: [],
    pastEmployers: [],
    excludeEmployers: [],
    industries: [],
    companySizes: [],
    skills: [],
    certifications: [],
    languages: [],
    schools: [],
    degrees: [],
    fieldsOfStudy: [],
    openToWork: false,
    recentlyChangedJobs: false,
    yearsAtCurrentMin: 0,
    diversityFilters: [],
  };
}

interface MandateSummary {
  id: string;
  title: string;
  company_id: string;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  status: string;
  search_criteria: SearchCriteria | null;
  criteria_updated_at: string | null;
  created_at: string;
}

function SourcePageContent() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client") || "";
  const preselectedMandateId = searchParams.get("mandate") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [mandates, setMandates] = useState<MandateSummary[]>([]);
  const [mandateId, setMandateId] = useState<string>(preselectedMandateId);
  const [positionTitle, setPositionTitle] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [criteria, setCriteria] = useState<SearchCriteria>(emptyCriteria());
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [criteriaSaved, setCriteriaSaved] = useState(false);
  // Single source selection — pick ONE source per sourcing run for clarity.
  // Matches user's vision: "tu as l'option de choisir apify ou apollo ou banque de candidat"
  const [primarySource, setPrimarySource] = useState<"apify_linkedin" | "apollo" | "internal_db">("apify_linkedin");
  const selectedSources = {
    apify_linkedin: primarySource === "apify_linkedin",
    apify_sales_nav: false,
    apify_recruiter_lite: false,
    apollo: primarySource === "apollo",
    indeed_resume: false,
    internal_db: primarySource === "internal_db",
  };

  const [brief, setBrief] = useState<SearchBrief | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [runningSourcing, setRunningSourcing] = useState(false);
  const [result, setResult] = useState<SourcingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recruiter/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []));
  }, []);

  // Load mandates when client changes
  useEffect(() => {
    if (!clientId) {
      setMandates([]);
      setMandateId("");
      return;
    }
    fetch(`/api/mandates?client_id=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setMandates(data.mandates || []);
        // Auto-select the URL-preselected mandate if it belongs to this client
        if (preselectedMandateId && data.mandates?.find((m: MandateSummary) => m.id === preselectedMandateId)) {
          setMandateId(preselectedMandateId);
        }
      })
      .catch(() => setMandates([]));
  }, [clientId, preselectedMandateId]);

  // Pre-fill form when mandate is selected
  useEffect(() => {
    if (!mandateId) return;
    const m = mandates.find((x) => x.id === mandateId);
    if (!m) return;
    if (m.title) setPositionTitle(m.title);
    if (m.search_criteria) setCriteria({ ...emptyCriteria(), ...m.search_criteria });
    setCriteriaSaved(false);
  }, [mandateId, mandates]);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedMandate = mandates.find((m) => m.id === mandateId);

  const handleSaveCriteria = async () => {
    if (!mandateId) {
      setError("Sélectionne d'abord un mandat pour sauver les critères dessus");
      return;
    }
    setSavingCriteria(true);
    setError(null);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/criteria`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_criteria: criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec sauvegarde");
      setCriteriaSaved(true);
      setTimeout(() => setCriteriaSaved(false), 3000);
      // refresh mandates list to get the new criteria_updated_at
      fetch(`/api/mandates?client_id=${clientId}`)
        .then((r) => r.json())
        .then((d) => setMandates(d.mandates || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingCriteria(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!clientId || !positionTitle) {
      setError("Sélectionne un client et entre un titre de poste");
      return;
    }
    setGeneratingBrief(true);
    setError(null);
    try {
      const rawQuery = buildRawQuery(criteria);
      const location = criteria.locations.join(", ") || criteria.countries.join(", ");
      const res = await fetch("/api/recruiter/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_brief",
          client_id: clientId,
          position_title: positionTitle,
          raw_query: rawQuery,
          location,
          search_criteria: criteria,
          internal_notes: internalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleRunSourcing = async () => {
    if (!brief) return;
    setRunningSourcing(true);
    setError(null);
    try {
      const sources = Object.entries(selectedSources)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      const res = await fetch("/api/recruiter/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_sourcing",
          client_id: clientId,
          mandate_id: mandateId || undefined,
          position_title: positionTitle,
          search_brief: brief,
          search_criteria: criteria,
          max_results_per_source: maxResults,
          sources,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);

      fetch("/api/recruiter/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score_batch",
          sourcing_run_id: data.sourcing_run_id,
        }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRunningSourcing(false);
    }
  };

  const updateBriefArray = (key: keyof SearchBrief, index: number, value: string) => {
    if (!brief || !Array.isArray(brief[key])) return;
    const newArr = [...(brief[key] as string[])];
    newArr[index] = value;
    setBrief({ ...brief, [key]: newArr });
  };

  const addToBriefArray = (key: keyof SearchBrief) => {
    if (!brief || !Array.isArray(brief[key])) return;
    setBrief({ ...brief, [key]: [...(brief[key] as string[]), ""] });
  };

  const removeFromBriefArray = (key: keyof SearchBrief, index: number) => {
    if (!brief || !Array.isArray(brief[key])) return;
    const newArr = (brief[key] as string[]).filter((_, i) => i !== index);
    setBrief({ ...brief, [key]: newArr });
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 mb-3">Sourcing complété</h1>
            <p className="text-[14px] text-zinc-600 mb-6">
              <strong>{result.candidates_inserted}</strong> candidats uniques ajoutés à la queue.
              <br />
              <span className="text-zinc-500">
                ({result.candidates_found} bruts, {result.candidates_after_dedupe} après dédup)
              </span>
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2">
                Scoring IA en cours
              </p>
              <p className="text-[13px] text-blue-800">
                Claude score les candidats en background. Ils apparaîtront dans la queue avec leur
                score dans ~1 minute.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/recruiter/queue?run=${result.sourcing_run_id}`}
                className="flex-1 py-3 bg-[#2445EB] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1A36C4] transition"
              >
                Voir la queue →
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setBrief(null);
                  setCriteria(emptyCriteria());
                }}
                className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-semibold hover:bg-zinc-50 transition"
              >
                Nouveau sourcing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/recruiter"
          className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4"
        >
          <ArrowLeft size={14} /> Retour dashboard
        </Link>

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={14} className="opacity-80" />
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Outil recruteur · LinkedIn Recruiter Lite équivalent
              </p>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight mb-2">Sourcing intelligent</h1>
            <p className="text-[14px] opacity-90 max-w-2xl">
              Tu remplis les critères de recherche pour ton client (le client ne voit pas ce
              formulaire). Claude génère un boolean search optimisé puis on source automatiquement
              sur LinkedIn, Apollo et autres bases.
            </p>
          </div>
        </div>

        {/* Step 1 — Client + position */}
        <Section
          step={1}
          title="Mandat client"
          description="Pour quel client recrutes-tu et quel est le poste à combler ?"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Client *">
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setMandateId("");
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
              >
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Mandat (charge critères sauvés)"
              hint={
                selectedMandate?.criteria_updated_at
                  ? `Critères mis à jour le ${new Date(selectedMandate.criteria_updated_at).toLocaleDateString("fr-CA")}`
                  : "Optionnel — sélectionne pour pré-remplir les critères"
              }
            >
              <select
                value={mandateId}
                onChange={(e) => setMandateId(e.target.value)}
                disabled={!clientId || mandates.length === 0}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!clientId
                    ? "Choisis un client d'abord"
                    : mandates.length === 0
                    ? "Aucun mandat pour ce client"
                    : "Aucun (sourcing libre)"}
                </option>
                {mandates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}{m.search_criteria ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titre du poste *">
              <input
                type="text"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Comptable CPA · Chargé de projet construction"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
            </Field>
            <div className="md:col-span-3">
              <Field
                label="Notes internes (visibles seulement par toi et l'équipe Aimio)"
                hint="Contexte, instructions spéciales, préférences du client mentionnées en appel"
              >
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Le client veut éviter les candidats venant de Deloitte. Préférence forte pour profils avec expérience en construction commerciale..."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
                />
              </Field>
            </div>
          </div>

          {selectedMandate && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                  Mandat sélectionné — critères {selectedMandate.search_criteria ? "chargés" : "vides"}
                </p>
                <p className="text-[13px] text-purple-800">
                  Ajuste les filtres ci-dessous pour optimiser le sourcing. Clique &laquo; Sauver critères &raquo; pour persister tes ajustements sur ce mandat.
                </p>
              </div>
              <button
                onClick={handleSaveCriteria}
                disabled={savingCriteria}
                className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[12px] font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
              >
                {savingCriteria ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Sauvegarde…
                  </>
                ) : criteriaSaved ? (
                  <>
                    <CheckCircle2 size={11} /> Sauvé ✓
                  </>
                ) : (
                  <>
                    💾 Sauver critères au mandat
                  </>
                )}
              </button>
            </div>
          )}

          {!selectedMandate && selectedClient?.roles_hiring_for && (
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                Postes du client (référence)
              </p>
              <p className="text-[13px] text-blue-800 whitespace-pre-line">
                {selectedClient.roles_hiring_for}
              </p>
            </div>
          )}
        </Section>

        {/* Step 2 — Job titles */}
        <Section
          step={2}
          title="Titres d'emploi"
          icon={<Briefcase size={14} />}
          description="Titres actuels recherchés et titres antérieurs (boost pour candidats avec parcours pertinent)"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput
              label="Titres actuels"
              hint="Le candidat doit avoir un de ces titres maintenant"
              placeholder="ex: Senior Accountant"
              items={criteria.jobTitlesCurrent}
              onChange={(v) => setCriteria({ ...criteria, jobTitlesCurrent: v })}
              color="blue"
            />
            <TagInput
              label="Titres passés"
              hint="A occupé un de ces postes par le passé"
              placeholder="ex: Junior Auditor"
              items={criteria.jobTitlesPast}
              onChange={(v) => setCriteria({ ...criteria, jobTitlesPast: v })}
              color="purple"
            />
            <div className="md:col-span-2">
              <TagInput
                label="Titres à exclure"
                hint="Aucun candidat avec ces titres"
                placeholder="ex: Stagiaire, Étudiant"
                items={criteria.excludeTitles}
                onChange={(v) => setCriteria({ ...criteria, excludeTitles: v })}
                color="red"
              />
            </div>
          </div>
        </Section>

        {/* Step 3 — Experience + seniority */}
        <Section
          step={3}
          title="Expérience et niveau"
          icon={<Award size={14} />}
          description="Années d'expérience, niveau de séniorité et fonction"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label={`Années d'expérience : ${criteria.yearsExperienceMin} - ${criteria.yearsExperienceMax} ans`}>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={criteria.yearsExperienceMin}
                  onChange={(e) =>
                    setCriteria({ ...criteria, yearsExperienceMin: parseInt(e.target.value) || 0 })
                  }
                  className="w-20 px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
                />
                <span className="text-zinc-400">à</span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={criteria.yearsExperienceMax}
                  onChange={(e) =>
                    setCriteria({ ...criteria, yearsExperienceMax: parseInt(e.target.value) || 30 })
                  }
                  className="w-20 px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
                />
                <span className="text-[13px] text-zinc-500">ans</span>
              </div>
            </Field>
            <Field label="Années dans le poste actuel (min)">
              <input
                type="number"
                min="0"
                max="20"
                value={criteria.yearsAtCurrentMin}
                onChange={(e) =>
                  setCriteria({ ...criteria, yearsAtCurrentMin: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
              />
            </Field>
          </div>

          <Field label="Niveau de séniorité">
            <ChipMultiSelect
              options={SENIORITY_LEVELS}
              selected={criteria.seniorityLevels}
              onChange={(v) => setCriteria({ ...criteria, seniorityLevels: v })}
            />
          </Field>

          <Field label="Fonction / département">
            <ChipMultiSelect
              options={FUNCTIONS}
              selected={criteria.functions}
              onChange={(v) => setCriteria({ ...criteria, functions: v })}
            />
          </Field>
        </Section>

        {/* Step 4 — Geography */}
        <Section
          step={4}
          title="Géographie"
          icon={<Globe2 size={14} />}
          description="Où le candidat doit être localisé"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TagInput
              label="Villes / régions"
              hint="ex: Montréal, Québec, Laval, Rive-Sud"
              placeholder="Ajouter une ville"
              items={criteria.locations}
              onChange={(v) => setCriteria({ ...criteria, locations: v })}
              color="zinc"
            />
            <TagInput
              label="Pays"
              hint="ex: Canada, États-Unis, France"
              placeholder="Ajouter un pays"
              items={criteria.countries}
              onChange={(v) => setCriteria({ ...criteria, countries: v })}
              color="zinc"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <ToggleChip
              label="Ouvert au télétravail"
              checked={criteria.remoteOk}
              onChange={(v) => setCriteria({ ...criteria, remoteOk: v })}
            />
            <ToggleChip
              label="Prêt à se relocaliser"
              checked={criteria.willingToRelocate}
              onChange={(v) => setCriteria({ ...criteria, willingToRelocate: v })}
            />
          </div>
        </Section>

        {/* Step 5 — Companies + industry */}
        <Section
          step={5}
          title="Entreprises et industrie"
          icon={<Building2 size={14} />}
          description="Employeurs cibles, à éviter, taille d'entreprise et secteur"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TagInput
              label="Employeurs actuels (cibles)"
              hint="Travaille présentement chez"
              placeholder="ex: KPMG, Deloitte, EY"
              items={criteria.currentEmployers}
              onChange={(v) => setCriteria({ ...criteria, currentEmployers: v })}
              color="emerald"
            />
            <TagInput
              label="Employeurs passés"
              hint="A déjà travaillé chez"
              placeholder="ex: Pomerleau, EBC"
              items={criteria.pastEmployers}
              onChange={(v) => setCriteria({ ...criteria, pastEmployers: v })}
              color="purple"
            />
            <div className="md:col-span-2">
              <TagInput
                label="Employeurs à exclure"
                hint="Ne pas approcher candidats venant de"
                placeholder="ex: concurrent direct du client"
                items={criteria.excludeEmployers}
                onChange={(v) => setCriteria({ ...criteria, excludeEmployers: v })}
                color="red"
              />
            </div>
          </div>

          <Field label="Industrie">
            <ChipMultiSelect
              options={INDUSTRIES}
              selected={criteria.industries}
              onChange={(v) => setCriteria({ ...criteria, industries: v })}
            />
          </Field>

          <Field label="Taille de l'entreprise">
            <ChipMultiSelect
              options={COMPANY_SIZES}
              selected={criteria.companySizes}
              onChange={(v) => setCriteria({ ...criteria, companySizes: v })}
            />
          </Field>
        </Section>

        {/* Step 6 — Skills + certifications */}
        <Section
          step={6}
          title="Compétences et certifications"
          icon={<Target size={14} />}
          description="Skills techniques, soft skills, certifications professionnelles"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput
              label="Compétences"
              hint="ex: Excel avancé, SAP, Revit, AutoCAD, gestion d'équipe"
              placeholder="Ajouter une compétence"
              items={criteria.skills}
              onChange={(v) => setCriteria({ ...criteria, skills: v })}
              color="blue"
            />
            <TagInput
              label="Certifications"
              hint="ex: CPA, PMP, ing., LL.B., CFA"
              placeholder="Ajouter une certification"
              items={criteria.certifications}
              onChange={(v) => setCriteria({ ...criteria, certifications: v })}
              color="emerald"
            />
          </div>
        </Section>

        {/* Step 7 — Languages */}
        <Section
          step={7}
          title="Langues parlées"
          icon={<Languages size={14} />}
          description="Langues requises et niveau de maîtrise"
        >
          <LanguagesField
            languages={criteria.languages}
            onChange={(v) => setCriteria({ ...criteria, languages: v })}
          />
        </Section>

        {/* Step 8 — Education */}
        <Section
          step={8}
          title="Formation académique"
          icon={<GraduationCap size={14} />}
          description="Universités, niveaux de diplôme et champs d'études"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TagInput
              label="Universités / écoles"
              hint="ex: HEC Montréal, McGill, Laval"
              placeholder="Ajouter une école"
              items={criteria.schools}
              onChange={(v) => setCriteria({ ...criteria, schools: v })}
              color="purple"
            />
            <div>
              <Field label="Niveau de diplôme">
                <ChipMultiSelect
                  options={DEGREE_LEVELS}
                  selected={criteria.degrees}
                  onChange={(v) => setCriteria({ ...criteria, degrees: v })}
                />
              </Field>
            </div>
            <TagInput
              label="Champ d'études"
              hint="ex: Comptabilité, Génie civil, Droit"
              placeholder="Ajouter un champ"
              items={criteria.fieldsOfStudy}
              onChange={(v) => setCriteria({ ...criteria, fieldsOfStudy: v })}
              color="blue"
            />
          </div>
        </Section>

        {/* Step 9 — Signals */}
        <Section
          step={9}
          title="Signaux d'ouverture"
          icon={<UserCheck size={14} />}
          description="Filtrer pour candidats plus réceptifs à un changement"
        >
          <div className="space-y-2">
            <ToggleRow
              label="Open to Work"
              desc="Candidats qui ont activé le badge LinkedIn « Ouvert aux opportunités »"
              checked={criteria.openToWork}
              onChange={(v) => setCriteria({ ...criteria, openToWork: v })}
            />
            <ToggleRow
              label="A récemment changé d'emploi (6 derniers mois)"
              desc="Plus difficile à approcher mais bon signal d'ambition"
              checked={criteria.recentlyChangedJobs}
              onChange={(v) => setCriteria({ ...criteria, recentlyChangedJobs: v })}
            />
          </div>
        </Section>

        {/* Step 10 — Generate brief */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles size={20} className="text-[#2445EB] mt-0.5" />
            <div>
              <h2 className="text-[16px] font-bold text-zinc-900">
                Générer le brief de recherche
              </h2>
              <p className="text-[13px] text-zinc-500 mt-1">
                Claude transforme tes critères en boolean search optimisé pour LinkedIn et Apollo.
              </p>
            </div>
          </div>

          <CriteriaSummary criteria={criteria} />

          <button
            onClick={handleGenerateBrief}
            disabled={!clientId || !positionTitle || generatingBrief}
            className="mt-4 w-full py-3 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-lg text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {generatingBrief ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Claude génère le brief...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Générer le boolean search avec Claude
              </>
            )}
          </button>
        </div>

        {/* Brief review */}
        {brief && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h2 className="text-[16px] font-bold text-zinc-900">Brief généré — à valider</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Boolean search
                </p>
                <textarea
                  value={brief.boolean_search}
                  onChange={(e) => setBrief({ ...brief, boolean_search: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[12px] font-mono focus:border-[#2445EB] outline-none"
                />
              </div>

              <BriefArrayField
                label="Mots-clés primaires (must-haves)"
                icon={<Target size={11} />}
                items={brief.primary_keywords}
                onUpdate={(i, v) => updateBriefArray("primary_keywords", i, v)}
                onRemove={(i) => removeFromBriefArray("primary_keywords", i)}
                onAdd={() => addToBriefArray("primary_keywords")}
                color="emerald"
              />

              <BriefArrayField
                label="Mots-clés secondaires (nice-to-haves)"
                items={brief.secondary_keywords}
                onUpdate={(i, v) => updateBriefArray("secondary_keywords", i, v)}
                onRemove={(i) => removeFromBriefArray("secondary_keywords", i)}
                onAdd={() => addToBriefArray("secondary_keywords")}
                color="blue"
              />

              <BriefArrayField
                label="Localisations"
                icon={<MapPin size={11} />}
                items={brief.location_filters}
                onUpdate={(i, v) => updateBriefArray("location_filters", i, v)}
                onRemove={(i) => removeFromBriefArray("location_filters", i)}
                onAdd={() => addToBriefArray("location_filters")}
                color="zinc"
              />

              <BriefArrayField
                label="Entreprises cibles"
                icon={<Briefcase size={11} />}
                items={brief.target_companies}
                onUpdate={(i, v) => updateBriefArray("target_companies", i, v)}
                onRemove={(i) => removeFromBriefArray("target_companies", i)}
                onAdd={() => addToBriefArray("target_companies")}
                color="purple"
              />

              <BriefArrayField
                label="Entreprises à exclure"
                items={brief.exclude_companies}
                onUpdate={(i, v) => updateBriefArray("exclude_companies", i, v)}
                onRemove={(i) => removeFromBriefArray("exclude_companies", i)}
                onAdd={() => addToBriefArray("exclude_companies")}
                color="red"
              />

              <BriefArrayField
                label="Titres ciblés"
                items={brief.seniority_titles}
                onUpdate={(i, v) => updateBriefArray("seniority_titles", i, v)}
                onRemove={(i) => removeFromBriefArray("seniority_titles", i)}
                onAdd={() => addToBriefArray("seniority_titles")}
                color="blue"
              />
            </div>
          </div>
        )}

        {/* Source picker — 3 big cards (Apify / Apollo / Banque interne) + launch */}
        {brief && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={16} className="text-[#2445EB]" />
              <h2 className="text-[16px] font-bold text-zinc-900">Choisis ta source</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <SourceCard
                active={primarySource === "apify_linkedin"}
                onClick={() => setPrimarySource("apify_linkedin")}
                badge="🔵"
                title="Apify LinkedIn"
                desc="Scrape LinkedIn public + emails inclus. Sans cookie."
                detail="apimaestro/linkedin-profile-search-scraper"
                cost={`~$${(maxResults * 0.005).toFixed(2)} pour ${maxResults} profils`}
                bestFor="Volume + emails vérifiés"
              />
              <SourceCard
                active={primarySource === "apollo"}
                onClick={() => setPrimarySource("apollo")}
                badge="🟢"
                title="Apollo.io"
                desc="275M contacts B2B. Bons emails pour USA/UK. Faible au QC francophone."
                detail="API Apollo — credits"
                cost="Inclus dans plan Apollo"
                bestFor="Marchés US/UK"
              />
              <SourceCard
                active={primarySource === "internal_db"}
                onClick={() => setPrimarySource("internal_db")}
                badge="🟣"
                title="Banque interne"
                desc="Cherche dans les candidats déjà sourcés pour autres clients matchant les critères."
                detail="Réutilise + économise du budget API"
                cost="Gratuit"
                bestFor="2è/3è mandat similaire"
              />
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Nombre de candidats à ramener : <span className="text-zinc-900 font-bold">{maxResults}</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="w-full accent-[#2445EB]"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                <span>10</span>
                <span>200</span>
              </div>
            </div>

            <button
              onClick={handleRunSourcing}
              disabled={runningSourcing}
              className="w-full py-4 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-lg text-[15px] font-bold hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-lg shadow-[#2445EB]/20"
            >
              {runningSourcing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sourcing en cours... (2-3 min)
                </>
              ) : (
                <>
                  <Rocket size={16} /> Lancer le sourcing
                </>
              )}
            </button>
            <p className="text-[11px] text-zinc-400 text-center mt-2">
              {primarySource === "internal_db"
                ? "Source gratuite — pas d'appel API externe"
                : `Coût estimé : ~$${primarySource === "apify_linkedin" ? (maxResults * 0.005).toFixed(2) : "0.30"}`}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function buildRawQuery(c: SearchCriteria): string {
  const parts: string[] = [];
  if (c.skills.length) parts.push(`Skills: ${c.skills.join(", ")}`);
  if (c.certifications.length) parts.push(`Certifications: ${c.certifications.join(", ")}`);
  if (c.yearsExperienceMin > 0)
    parts.push(`${c.yearsExperienceMin}-${c.yearsExperienceMax} ans expérience`);
  if (c.functions.length) parts.push(`Fonctions: ${c.functions.join(", ")}`);
  if (c.industries.length) parts.push(`Industries: ${c.industries.join(", ")}`);
  if (c.languages.length)
    parts.push(`Langues: ${c.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")}`);
  if (c.schools.length) parts.push(`Écoles: ${c.schools.join(", ")}`);
  if (c.fieldsOfStudy.length) parts.push(`Champs études: ${c.fieldsOfStudy.join(", ")}`);
  if (c.openToWork) parts.push("Open to Work signal");
  if (c.remoteOk) parts.push("Télétravail OK");
  return parts.join(" | ");
}

function Section({
  step,
  title,
  description,
  icon,
  children,
}: {
  step: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-[#2445EB]/10 text-[#2445EB] text-[12px] font-bold flex items-center justify-center shrink-0">
          {step}
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-zinc-900 flex items-center gap-1.5">
            {icon}
            {title}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

function TagInput({
  label,
  hint,
  placeholder,
  items,
  onChange,
  color,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  items: string[];
  onChange: (v: string[]) => void;
  color: "emerald" | "blue" | "zinc" | "purple" | "red";
}) {
  const [input, setInput] = useState("");
  const colorClasses: Record<typeof color, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) {
      onChange([...items, v]);
      setInput("");
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="border border-zinc-200 rounded-lg px-2 py-1.5 focus-within:border-[#2445EB] focus-within:ring-2 focus-within:ring-[#2445EB]/10">
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[12px] ${colorClasses[color]}`}
            >
              {item}
              <button
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="hover:bg-white/50 rounded p-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add();
              } else if (e.key === "Backspace" && !input && items.length) {
                onChange(items.slice(0, -1));
              }
            }}
            onBlur={add}
            placeholder={items.length ? "" : placeholder}
            className="flex-1 min-w-[120px] px-1 py-1 text-[13px] outline-none bg-transparent"
          />
        </div>
      </div>
    </Field>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() =>
              onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
            }
            className={`px-2.5 py-1.5 rounded-md border text-[12px] transition ${
              active
                ? "bg-[#2445EB] border-[#2445EB] text-white"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition ${
        checked
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
          checked ? "bg-emerald-500 border-emerald-500" : "border-zinc-300"
        }`}
      >
        {checked && <CheckCircle2 size={10} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 cursor-pointer transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#2445EB]"
      />
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-zinc-900">{label}</p>
        <p className="text-[12px] text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

function LanguagesField({
  languages,
  onChange,
}: {
  languages: { name: string; proficiency: string }[];
  onChange: (v: { name: string; proficiency: string }[]) => void;
}) {
  const addLang = (name: string) => {
    if (!languages.find((l) => l.name === name)) {
      onChange([...languages, { name, proficiency: "Courant" }]);
    }
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {languages.map((lang, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50"
          >
            <span className="text-[13px] font-semibold text-zinc-900 flex-1">{lang.name}</span>
            <select
              value={lang.proficiency}
              onChange={(e) => {
                const newLangs = [...languages];
                newLangs[i] = { ...lang, proficiency: e.target.value };
                onChange(newLangs);
              }}
              className="px-2 py-1 rounded border border-zinc-200 text-[12px] bg-white"
            >
              {LANGUAGE_PROFICIENCY.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              onClick={() => onChange(languages.filter((_, idx) => idx !== i))}
              className="p-1 hover:bg-zinc-200 rounded"
            >
              <X size={12} className="text-zinc-500" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] text-zinc-400 self-center mr-1">Ajouter :</span>
        {COMMON_LANGUAGES.filter((l) => !languages.find((x) => x.name === l)).map((l) => (
          <button
            key={l}
            onClick={() => addLang(l)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-zinc-300 text-[12px] text-zinc-600 hover:border-[#2445EB] hover:text-[#2445EB]"
          >
            <Plus size={10} /> {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function CriteriaSummary({ criteria }: { criteria: SearchCriteria }) {
  const count = (k: keyof SearchCriteria) => {
    const v = criteria[k];
    return Array.isArray(v) ? v.length : 0;
  };
  const total =
    count("jobTitlesCurrent") +
    count("jobTitlesPast") +
    count("excludeTitles") +
    count("seniorityLevels") +
    count("functions") +
    count("locations") +
    count("countries") +
    count("currentEmployers") +
    count("pastEmployers") +
    count("excludeEmployers") +
    count("industries") +
    count("companySizes") +
    count("skills") +
    count("certifications") +
    count("languages") +
    count("schools") +
    count("degrees") +
    count("fieldsOfStudy");

  return (
    <div className="bg-zinc-50 rounded-lg p-4 flex items-start gap-3">
      <Info size={14} className="text-zinc-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-[12px] font-semibold text-zinc-900 mb-1">
          {total} critère{total > 1 ? "s" : ""} configuré{total > 1 ? "s" : ""}
        </p>
        <p className="text-[11px] text-zinc-500">
          Plus tu donnes de critères, plus le boolean search est précis. Minimum recommandé : titre +
          fonction + localisation + 3 compétences.
        </p>
      </div>
    </div>
  );
}

function BriefArrayField({
  label,
  icon,
  items,
  onUpdate,
  onRemove,
  onAdd,
  color,
}: {
  label: string;
  icon?: React.ReactNode;
  items: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  color: "emerald" | "blue" | "zinc" | "purple" | "red";
}) {
  const colorClasses: Record<typeof color, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div>
      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[12px] ${colorClasses[color]}`}
          >
            <input
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              className="bg-transparent outline-none w-auto min-w-[60px]"
              style={{ width: `${Math.max(item.length + 1, 8)}ch` }}
            />
            <button onClick={() => onRemove(i)} className="hover:bg-white/50 rounded p-0.5">
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-zinc-300 text-[12px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          <Plus size={10} /> Ajouter
        </button>
      </div>
    </div>
  );
}

function SourceCard({
  active,
  onClick,
  badge,
  title,
  desc,
  detail,
  cost,
  bestFor,
}: {
  active: boolean;
  onClick: () => void;
  badge: string;
  title: string;
  desc: string;
  detail: string;
  cost: string;
  bestFor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition relative ${
        active
          ? "border-[#2445EB] bg-[#2445EB]/5 shadow-md shadow-[#2445EB]/10"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      {active && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2445EB] text-white text-[12px] flex items-center justify-center font-bold">
          ✓
        </span>
      )}
      <div className="text-[24px] mb-2">{badge}</div>
      <p className="text-[14px] font-bold text-zinc-900 mb-1">{title}</p>
      <p className="text-[12px] text-zinc-600 leading-relaxed mb-3">{desc}</p>
      <div className="space-y-1 pt-2 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400 font-mono">{detail}</p>
        <p className="text-[11px] text-zinc-700"><strong>Coût :</strong> {cost}</p>
        <p className="text-[11px] text-emerald-700"><strong>Idéal pour :</strong> {bestFor}</p>
      </div>
    </button>
  );
}

export default function SourcePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={20} />
        </div>
      }
    >
      <SourcePageContent />
    </Suspense>
  );
}
