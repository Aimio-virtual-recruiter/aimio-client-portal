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
} from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  roles_hiring_for: string | null;
  country: string;
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

function SourcePageContent() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [positionTitle, setPositionTitle] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [selectedSources, setSelectedSources] = useState({
    apify_linkedin: true,
    apify_sales_nav: false,
    apollo: true,
  });

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

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleGenerateBrief = async () => {
    if (!clientId || !positionTitle) {
      setError("Sélectionne un client et entre un titre de poste");
      return;
    }
    setGeneratingBrief(true);
    setError(null);
    try {
      const res = await fetch("/api/recruiter/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_brief",
          client_id: clientId,
          position_title: positionTitle,
          raw_query: rawQuery,
          location,
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
          position_title: positionTitle,
          search_brief: brief,
          max_results_per_source: maxResults,
          sources,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);

      // Auto-trigger scoring in background
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

  // Success screen
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 mb-3">Sourcing complété 🎯</h1>
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
      <div className="max-w-4xl mx-auto">
        <Link
          href="/recruiter"
          className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4"
        >
          <ArrowLeft size={14} /> Retour dashboard
        </Link>
        <h1 className="text-[32px] font-bold text-zinc-900 tracking-tight">Sourcing auto</h1>
        <p className="text-[14px] text-zinc-500 mt-2 mb-8">
          Claude génère un search brief → on source sur LinkedIn + Apollo → candidats scorés
          automatiquement dans ta queue.
        </p>

        {/* Step 1 — Setup */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </div>
            <h2 className="text-[16px] font-bold text-zinc-900">Client + poste</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
              >
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Titre du poste *
              </label>
              <input
                type="text"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Senior Software Engineer"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Mots-clés techniques / critères spécifiques
              </label>
              <input
                type="text"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Go, microservices, backend, 8+ years"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Optionnel — Claude peut déduire à partir du titre, mais plus tu donnes d&apos;info
                meilleur sera le brief
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Localisation préférée
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Toronto ou Remote Canada"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
            </div>
          </div>

          {selectedClient?.roles_hiring_for && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                Postes du client (context pour Claude)
              </p>
              <p className="text-[13px] text-blue-800 whitespace-pre-line">
                {selectedClient.roles_hiring_for}
              </p>
            </div>
          )}

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
                <Sparkles size={14} /> Générer le search brief avec Claude
              </>
            )}
          </button>
        </div>

        {/* Step 2 — Brief review */}
        {brief && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Search brief — à valider</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Boolean search
                </p>
                <textarea
                  value={brief.boolean_search}
                  onChange={(e) => setBrief({ ...brief, boolean_search: e.target.value })}
                  rows={2}
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

        {/* Step 3 — Source selection + launch */}
        {brief && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                3
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Sources + volume</h2>
            </div>

            <div className="space-y-3 mb-4">
              <SourceCheckbox
                checked={selectedSources.apify_linkedin}
                onChange={(v) =>
                  setSelectedSources({ ...selectedSources, apify_linkedin: v })
                }
                label="LinkedIn Public Search (Apify)"
                desc="Recherche publique LinkedIn — pas besoin de cookie"
                cost="$0.50 / 50 profils"
              />
              <SourceCheckbox
                checked={selectedSources.apify_sales_nav}
                onChange={(v) =>
                  setSelectedSources({ ...selectedSources, apify_sales_nav: v })
                }
                label="LinkedIn Sales Navigator (Apify)"
                desc="Résultats premium — cookie Sales Nav requis"
                cost="$2.00 / 50 profils"
              />
              <SourceCheckbox
                checked={selectedSources.apollo}
                onChange={(v) => setSelectedSources({ ...selectedSources, apollo: v })}
                label="Apollo.io"
                desc="275M contacts avec emails vérifiés"
                cost="Inclus dans plan Apollo"
              />
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                Profils par source : <span className="text-zinc-900 font-bold">{maxResults}</span>
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
              className="w-full py-4 bg-[#2445EB] text-white rounded-lg text-[14px] font-bold hover:bg-[#1A36C4] disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-lg shadow-[#2445EB]/20"
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
              Coût estimé : ~${(
                (selectedSources.apify_linkedin ? 0.5 : 0) +
                (selectedSources.apify_sales_nav ? 2 : 0) +
                (selectedSources.apollo ? 0.3 : 0)
              ).toFixed(2)}
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

function SourceCheckbox({
  checked,
  onChange,
  label,
  desc,
  cost,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
  cost: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
        checked ? "border-[#2445EB] bg-[#2445EB]/5" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#2445EB]"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-zinc-900">{label}</p>
          <span className="text-[11px] text-zinc-400">{cost}</span>
        </div>
        <p className="text-[12px] text-zinc-500">{desc}</p>
      </div>
    </label>
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
