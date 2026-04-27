"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import {
  Loader2,
  Search,
  Users,
  Mail,
  MapPin,
  Building2,
  Sparkles,
  X,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface CandidateRow {
  id: string;
  client_id: string | null;
  mandate_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  location_city: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean | null;
  phone: string | null;
  ai_score: number | null;
  ai_verdict: string | null;
  status: string;
  source: string | null;
  delivered_at: string | null;
  created_at: string;
  tags: string[] | null;
  clients?: { company_name: string } | null;
  mandates?: { title: string } | null;
}

interface AISearchFilter {
  min_score?: number;
  max_score?: number;
  verdicts?: string[];
  statuses?: string[];
  name_contains?: string;
  current_companies?: string[];
  past_companies?: string[];
  current_titles?: string[];
  cities?: string[];
  countries?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  schools?: string[];
  tags?: string[];
  has_email?: boolean;
  has_phone?: boolean;
  has_linkedin?: boolean;
  email_verified_only?: boolean;
  sources?: string[];
  client_company_contains?: string;
  mandate_title_contains?: string;
  created_after_days_ago?: number;
  created_before_days_ago?: number;
  sort?: "score_desc" | "score_asc" | "recent" | "oldest";
  limit?: number;
}

type SortKey = "name" | "title" | "company" | "score" | "status" | "created_at";

const STATUS_PILL: Record<string, { label: string; color: string; dot: string }> = {
  new: { label: "Nouveau", color: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  kept: { label: "Validé", color: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  rejected: { label: "Rejeté", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  outreach_ready: { label: "Outreach prêt", color: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  outreached: { label: "Outreaché", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  replied_interested: { label: "Répondu OK", color: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  replied_not_interested: { label: "Répondu non", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  qualifying: { label: "Qualif.", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  qualified: { label: "Qualifié", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  delivered: { label: "Livré", color: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  client_interested: { label: "Client OK", color: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  client_not_interested: { label: "Client non", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  hired: { label: "Embauché 🎉", color: "bg-emerald-100 text-emerald-900 border-emerald-300", dot: "bg-emerald-600" },
};

const AI_SUGGESTIONS = [
  "Top 10 candidats par score",
  "CPA bilingues à Montréal",
  "Hot-leads de la semaine",
  "À recontacter — décliné il y a 90j+",
  "Livrés sans feedback client",
  "Embauchés cette année",
  "Sans email — à enrichir",
];

export default function CandidatesCRMPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiFilter, setAiFilter] = useState<AISearchFilter | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from("sourced_candidates")
          .select("*, clients(company_name), mandates(title)")
          .order("created_at", { ascending: false })
          .limit(500);
        setCandidates((data as CandidateRow[]) || []);

        const { data: clientList } = await supabase
          .from("clients")
          .select("id, company_name")
          .order("company_name");
        setClients(clientList || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const runAISearch = async (queryText?: string) => {
    const q = (queryText ?? aiQuery).trim();
    if (!q) return;
    setAiQuery(q);
    setAiLoading(true);
    try {
      const res = await fetch("/api/recruiter/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiFilter(data.filter || {});
      setAiSummary(data.summary || null);
      setAiSuggestions(data.suggestions || []);
      // Reset manual filters when AI takes over
      setStatusFilter("all");
      setScoreFilter("all");
      setClientFilter("all");
      setSearch("");
      toast.success(`IA filtrée: ${data.summary || "OK"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAI = () => {
    setAiQuery("");
    setAiFilter(null);
    setAiSummary(null);
    setAiSuggestions([]);
  };

  const filtered = useMemo(() => {
    let result = candidates;

    // ─── AI FILTER (takes precedence) ──────────────────────────
    if (aiFilter) {
      result = result.filter((c) => {
        // Score
        if (aiFilter.min_score !== undefined && (c.ai_score ?? -1) < aiFilter.min_score) return false;
        if (aiFilter.max_score !== undefined && (c.ai_score ?? 999) > aiFilter.max_score) return false;
        if (aiFilter.verdicts?.length && (!c.ai_verdict || !aiFilter.verdicts.includes(c.ai_verdict))) return false;
        // Status
        if (aiFilter.statuses?.length && !aiFilter.statuses.includes(c.status)) return false;
        // Name
        if (aiFilter.name_contains) {
          const fullName = (c.full_name || `${c.first_name || ""} ${c.last_name || ""}`).toLowerCase();
          if (!fullName.includes(aiFilter.name_contains.toLowerCase())) return false;
        }
        // Companies
        if (aiFilter.current_companies?.length) {
          const company = (c.current_company || "").toLowerCase();
          if (!aiFilter.current_companies.some((x) => company.includes(x.toLowerCase()))) return false;
        }
        // Titles
        if (aiFilter.current_titles?.length) {
          const title = (c.current_title || "").toLowerCase();
          if (!aiFilter.current_titles.some((x) => title.includes(x.toLowerCase()))) return false;
        }
        // Locations
        if (aiFilter.cities?.length) {
          const city = (c.location_city || "").toLowerCase();
          if (!aiFilter.cities.some((x) => city.includes(x.toLowerCase()))) return false;
        }
        if (aiFilter.countries?.length) {
          const country = (c.location_country || "").toLowerCase();
          if (!aiFilter.countries.some((x) => country.includes(x.toLowerCase()))) return false;
        }
        // Tags
        if (aiFilter.tags?.length) {
          const tags = c.tags || [];
          if (!aiFilter.tags.some((t) => tags.includes(t.toLowerCase()))) return false;
        }
        // Contact info
        if (aiFilter.has_email !== undefined && !!c.email !== aiFilter.has_email) return false;
        if (aiFilter.has_phone !== undefined && !!c.phone !== aiFilter.has_phone) return false;
        if (aiFilter.has_linkedin !== undefined && !!c.linkedin_url !== aiFilter.has_linkedin) return false;
        if (aiFilter.email_verified_only && !c.email_verified) return false;
        // Source
        if (aiFilter.sources?.length && (!c.source || !aiFilter.sources.includes(c.source))) return false;
        // Client/mandate
        if (aiFilter.client_company_contains) {
          const cName = (c.clients?.company_name || "").toLowerCase();
          if (!cName.includes(aiFilter.client_company_contains.toLowerCase())) return false;
        }
        if (aiFilter.mandate_title_contains) {
          const mTitle = (c.mandates?.title || "").toLowerCase();
          if (!mTitle.includes(aiFilter.mandate_title_contains.toLowerCase())) return false;
        }
        // Time
        const created = new Date(c.created_at).getTime();
        const now = Date.now();
        if (aiFilter.created_after_days_ago !== undefined) {
          if (created < now - aiFilter.created_after_days_ago * 86400000) return false;
        }
        if (aiFilter.created_before_days_ago !== undefined) {
          if (created > now - aiFilter.created_before_days_ago * 86400000) return false;
        }
        return true;
      });

      // AI sort
      if (aiFilter.sort === "score_desc") result = [...result].sort((a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1));
      else if (aiFilter.sort === "score_asc") result = [...result].sort((a, b) => (a.ai_score ?? 999) - (b.ai_score ?? 999));
      else if (aiFilter.sort === "recent") result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      else if (aiFilter.sort === "oldest") result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (aiFilter.limit) result = result.slice(0, aiFilter.limit);
      return result;
    }

    // ─── MANUAL FILTERS ────────────────────────────────────────
    result = result.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      const s = c.ai_score;
      if (scoreFilter === "unscored" && s !== null) return false;
      if (scoreFilter === "strong" && (s === null || s < 85)) return false;
      if (scoreFilter === "good" && (s === null || s < 70)) return false;
      if (scoreFilter === "borderline" && (s === null || s < 50 || s >= 70)) return false;
      if (scoreFilter === "low" && (s === null || s >= 50)) return false;
      if (clientFilter !== "all" && c.client_id !== clientFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [c.full_name, c.first_name, c.last_name, c.current_title, c.current_company, c.email, c.location_city, c.location_country, ...(c.tags || [])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = (a.full_name || "").localeCompare(b.full_name || ""); break;
        case "title": cmp = (a.current_title || "").localeCompare(b.current_title || ""); break;
        case "company": cmp = (a.current_company || "").localeCompare(b.current_company || ""); break;
        case "score": cmp = (a.ai_score ?? -1) - (b.ai_score ?? -1); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [candidates, search, statusFilter, scoreFilter, clientFilter, sortKey, sortDir, aiFilter]);

  const stats = useMemo(() => ({
    total: candidates.length,
    new: candidates.filter((c) => c.status === "new").length,
    outreach_ready: candidates.filter((c) => c.status === "outreach_ready").length,
    delivered: candidates.filter((c) => c.status === "delivered").length,
    hired: candidates.filter((c) => c.status === "hired").length,
  }), [candidates]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Banque de candidats</h1>
              <p className="text-[13px] text-zinc-500 mt-1">
                {candidates.length.toLocaleString()} candidats au total · {filtered.length.toLocaleString()} affichés
              </p>
            </div>
            <Link href="/recruiter/source/manual" className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[12px] font-semibold inline-flex items-center gap-1.5">
              <Users size={12} /> Ajouter manuellement
            </Link>
          </div>

          {/* Stats — Salesforce-dense */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <Stat label="Total" value={stats.total} />
            <Stat label="À valider" value={stats.new} color="blue" />
            <Stat label="Outreach prêt" value={stats.outreach_ready} color="purple" />
            <Stat label="Livrés" value={stats.delivered} color="emerald-light" />
            <Stat label="Embauchés" value={stats.hired} color="emerald" />
          </div>

          {/* AI SEARCH BAR — the star feature */}
          <div className="bg-gradient-to-r from-[#2445EB]/5 via-purple-500/5 to-pink-500/5 border-2 border-[#2445EB]/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2445EB] to-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runAISearch())}
                    placeholder="Demande à l'IA en français… ex: 'top 10 candidats CPA bilingues'"
                    className="flex-1 bg-white px-3 py-2 rounded-md border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                  />
                  <button
                    onClick={() => runAISearch()}
                    disabled={!aiQuery.trim() || aiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-[#2445EB] to-purple-600 text-white rounded-md text-[12px] font-bold hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {aiLoading ? "Recherche…" : "Recherche IA"}
                  </button>
                  {aiFilter && (
                    <button onClick={clearAI} className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 inline-flex items-center gap-1">
                      <X size={11} /> Effacer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {!aiFilter && (
              <div className="flex flex-wrap gap-1.5 ml-10">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold self-center mr-1">💡 Essaye :</span>
                {AI_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => runAISearch(s)}
                    className="px-2 py-1 bg-white border border-zinc-200 rounded text-[11px] text-zinc-600 hover:border-[#2445EB] hover:text-[#2445EB] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Active AI filter summary */}
            {aiFilter && aiSummary && (
              <div className="ml-10 mt-2 flex items-center gap-2">
                <span className="text-[11px] bg-[#2445EB] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">🤖 IA</span>
                <p className="text-[12px] text-zinc-700 font-medium flex-1">{aiSummary}</p>
                <span className="text-[11px] text-zinc-500">{filtered.length} résultats</span>
              </div>
            )}

            {/* AI suggestions (alt queries) */}
            {aiFilter && aiSuggestions.length > 0 && (
              <div className="ml-10 mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-zinc-500 self-center">↻ Affiner :</span>
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => runAISearch(s)}
                    className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[11px] text-zinc-600 hover:border-[#2445EB]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Manual filter bar — toggleable */}
        {!aiFilter && (
          <div className="border-t border-zinc-100 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Recherche manuelle (nom, titre, email, ville, tag)…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-zinc-200 text-[12px] focus:border-[#2445EB] outline-none bg-white"
                />
              </div>
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-2 py-1.5 rounded-md border border-zinc-200 text-[11px] bg-white">
                <option value="all">Tous clients</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded-md border border-zinc-200 text-[11px] bg-white">
                <option value="all">Tous statuts</option>
                {Object.entries(STATUS_PILL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="px-2 py-1.5 rounded-md border border-zinc-200 text-[11px] bg-white">
                <option value="all">Tous scores</option>
                <option value="strong">Strong (85+)</option>
                <option value="good">Good (70+)</option>
                <option value="borderline">Borderline</option>
                <option value="low">Low</option>
                <option value="unscored">Non scoré</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE — Salesforce style */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
            <Users size={32} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-[14px] font-semibold text-zinc-700">Aucun candidat trouvé</p>
            <p className="text-[12px] text-zinc-500 mt-1">
              {aiFilter ? "Essaye une autre recherche IA ou efface le filtre." : "Ajuste tes filtres."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="Candidat" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className="px-3 py-2 text-left hidden md:table-cell">
                    <SortHeader label="Titre" k="title" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className="px-3 py-2 text-left hidden lg:table-cell">
                    <SortHeader label="Entreprise" k="company" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className="px-3 py-2 text-left hidden md:table-cell">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Client → Mandat</span>
                  </th>
                  <th className="px-3 py-2 text-center">
                    <SortHeader label="Score" k="score" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="Statut" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className="px-3 py-2 text-right hidden lg:table-cell">
                    <SortHeader label="Sourcé" k="created_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <CandidateTableRow key={c.id} candidate={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: "blue" | "purple" | "emerald" | "emerald-light" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    "emerald-light": "bg-emerald-50 border-emerald-200 text-emerald-900",
    emerald: "bg-emerald-100 border-emerald-300 text-emerald-900",
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${color ? styles[color] : "bg-white border-zinc-200"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none">{label}</p>
      <p className="text-[18px] font-bold text-zinc-900 tabular-nums mt-1 leading-none">{value.toLocaleString()}</p>
    </div>
  );
}

function SortHeader({ label, k, sortKey, sortDir, onClick }: { label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; onClick: (k: SortKey) => void }) {
  const active = sortKey === k;
  return (
    <button onClick={() => onClick(k)} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1">
      {label}
      {active ? (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ArrowUpDown size={10} className="opacity-30" />}
    </button>
  );
}

function CandidateTableRow({ candidate }: { candidate: CandidateRow }) {
  const fullName = candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Sans nom";
  const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
  const score = candidate.ai_score;
  const scoreColor =
    score === null ? "text-zinc-400" :
    score >= 85 ? "text-emerald-700" :
    score >= 70 ? "text-blue-700" :
    score >= 50 ? "text-amber-700" :
    "text-red-600";
  const scoreBg =
    score === null ? "bg-zinc-50 border-zinc-200" :
    score >= 85 ? "bg-emerald-50 border-emerald-200" :
    score >= 70 ? "bg-blue-50 border-blue-200" :
    score >= 50 ? "bg-amber-50 border-amber-200" :
    "bg-red-50 border-red-200";
  const status = STATUS_PILL[candidate.status] || { label: candidate.status, color: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" };
  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(", ");
  const daysAgo = Math.floor((Date.now() - new Date(candidate.created_at).getTime()) / 86400000);

  return (
    <tr className="hover:bg-zinc-50 transition">
      <td className="px-3 py-2">
        <Link href={`/recruiter/candidates/${candidate.id}`} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-[#2445EB] truncate">{fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {location && <span className="text-[10px] text-zinc-500 inline-flex items-center gap-0.5"><MapPin size={9} />{location}</span>}
              {candidate.email_verified && <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded px-1 font-bold">✓</span>}
              {candidate.source === "manual_recruiter" && <span className="text-[9px] bg-purple-100 text-purple-700 rounded px-1 font-bold">M</span>}
              {(candidate.tags || []).slice(0, 2).map((t, i) => (
                <span key={i} className="text-[9px] bg-zinc-100 text-zinc-600 rounded px-1">#{t}</span>
              ))}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-3 py-2 text-[12px] text-zinc-700 hidden md:table-cell truncate max-w-[200px]">
        {candidate.current_title || <span className="text-zinc-400 italic">—</span>}
      </td>
      <td className="px-3 py-2 text-[12px] text-zinc-700 hidden lg:table-cell truncate max-w-[180px]">
        {candidate.current_company || <span className="text-zinc-400 italic">—</span>}
      </td>
      <td className="px-3 py-2 text-[11px] hidden md:table-cell">
        {candidate.clients?.company_name ? (
          <span className="text-[#2445EB] font-medium inline-flex items-center gap-0.5">
            <Building2 size={9} />
            <span className="truncate max-w-[140px]">{candidate.clients.company_name}</span>
            {candidate.mandates?.title && <span className="text-zinc-400"> → {candidate.mandates.title.slice(0, 20)}{candidate.mandates.title.length > 20 ? "…" : ""}</span>}
          </span>
        ) : <span className="text-zinc-400 italic">—</span>}
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`inline-block min-w-[44px] px-2 py-1 rounded-md border tabular-nums font-bold text-[13px] ${scoreColor} ${scoreBg}`}>
          {score !== null ? score : "—"}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-[11px] text-zinc-500 hidden lg:table-cell whitespace-nowrap">
        <span className="inline-flex items-center gap-1"><Clock size={9} />{daysAgo === 0 ? "aujourd'hui" : `il y a ${daysAgo}j`}</span>
      </td>
    </tr>
  );
}
