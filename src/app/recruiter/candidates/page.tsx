"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Loader2,
  Search,
  Users,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Filter,
  CheckCircle2,
  Building2,
  Clock,
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

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "new", label: "Nouveau (à valider)" },
  { value: "kept", label: "Gardé" },
  { value: "outreach_ready", label: "Outreach prêt" },
  { value: "outreached", label: "Outreaché" },
  { value: "replied_interested", label: "Répondu — intéressé" },
  { value: "replied_not_interested", label: "Répondu — pas intéressé" },
  { value: "qualifying", label: "En qualification" },
  { value: "qualified", label: "Qualifié" },
  { value: "delivered", label: "Livré au client" },
  { value: "client_interested", label: "Client intéressé" },
  { value: "hired", label: "Embauché 🎉" },
  { value: "rejected", label: "Rejeté" },
];

const SCORE_BUCKETS = [
  { value: "all", label: "Tous scores" },
  { value: "strong", label: "Strong (85+)" },
  { value: "good", label: "Good (70+)" },
  { value: "borderline", label: "Borderline (50-69)" },
  { value: "low", label: "Low (<50)" },
  { value: "unscored", label: "Non scoré" },
];

export default function CandidatesCRMPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        // Load candidates with client + mandate info
        const { data } = await supabase
          .from("sourced_candidates")
          .select("*, clients(company_name), mandates(title)")
          .order("created_at", { ascending: false })
          .limit(500);
        setCandidates((data as CandidateRow[]) || []);

        // Load distinct clients for filter
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

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      // Status filter
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      // Score filter
      const s = c.ai_score;
      if (scoreFilter === "unscored" && s !== null) return false;
      if (scoreFilter === "strong" && (s === null || s < 85)) return false;
      if (scoreFilter === "good" && (s === null || s < 70)) return false;
      if (scoreFilter === "borderline" && (s === null || s < 50 || s >= 70)) return false;
      if (scoreFilter === "low" && (s === null || s >= 50)) return false;

      // Client filter
      if (clientFilter !== "all" && c.client_id !== clientFilter) return false;

      // Search (name, title, company, email, location)
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          c.full_name,
          c.first_name,
          c.last_name,
          c.current_title,
          c.current_company,
          c.email,
          c.location_city,
          c.location_country,
          ...(c.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [candidates, search, statusFilter, scoreFilter, clientFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Banque de candidats</h1>
        <p className="text-[14px] text-zinc-500 mt-1">
          {candidates.length.toLocaleString()} candidats sourcés au total · {filtered.length.toLocaleString()} affichés
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Total" value={candidates.length} />
        <Stat label="À valider" value={statusCounts["new"] || 0} color="blue" />
        <Stat label="Outreach prêt" value={statusCounts["outreach_ready"] || 0} color="purple" />
        <Stat label="Livrés" value={statusCounts["delivered"] || 0} color="emerald" />
        <Stat label="Embauchés" value={statusCounts["hired"] || 0} color="emerald-strong" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Recherche : nom, titre, entreprise, email, ville, tag..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-zinc-200 text-[13px] bg-white focus:border-[#2445EB] outline-none"
          >
            <option value="all">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 text-[12px] bg-white focus:border-[#2445EB] outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 text-[12px] bg-white focus:border-[#2445EB] outline-none"
            >
              {SCORE_BUCKETS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidate list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Users size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-[14px] font-semibold text-zinc-700">Aucun candidat trouvé</p>
          <p className="text-[13px] text-zinc-500 mt-1">
            {search || statusFilter !== "all" || scoreFilter !== "all" || clientFilter !== "all"
              ? "Ajuste tes filtres."
              : "Lance un sourcing pour commencer."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <CandidateRow key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: "blue" | "purple" | "emerald" | "emerald-strong" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    "emerald-strong": "bg-emerald-100 border-emerald-300 text-emerald-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${color ? styles[color] : "bg-white border-zinc-200"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-[22px] font-bold text-zinc-900 tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: CandidateRow }) {
  const fullName = candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Sans nom";
  const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
  const score = candidate.ai_score;
  const scoreColor =
    score === null ? "bg-zinc-100 text-zinc-500" :
    score >= 85 ? "bg-emerald-100 text-emerald-800" :
    score >= 70 ? "bg-blue-100 text-blue-800" :
    score >= 50 ? "bg-amber-100 text-amber-800" :
    "bg-red-100 text-red-700";

  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/recruiter/candidates/${candidate.id}`}
      className="block bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#2445EB] hover:shadow-md transition group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-bold text-zinc-900 truncate">{fullName}</h3>
            {candidate.email_verified && (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 rounded px-1 py-0.5 font-bold uppercase">
                ✓ email
              </span>
            )}
            <span className="text-[9px] bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5 font-semibold capitalize">
              {candidate.status.replace(/_/g, " ")}
            </span>
            {candidate.source === "manual_recruiter" && (
              <span className="text-[9px] bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 font-semibold">
                Manuel
              </span>
            )}
          </div>
          <p className="text-[12px] text-zinc-600 truncate">
            {candidate.current_title}
            {candidate.current_company && <> · {candidate.current_company}</>}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {location && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <MapPin size={10} /> {location}
              </span>
            )}
            {candidate.email && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <Mail size={10} /> {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <Phone size={10} /> {candidate.phone}
              </span>
            )}
            {candidate.clients?.company_name && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#2445EB] font-semibold">
                <Building2 size={10} /> {candidate.clients.company_name}
                {candidate.mandates?.title && <> → {candidate.mandates.title}</>}
              </span>
            )}
          </div>
          {candidate.tags && candidate.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.tags.map((tag, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="shrink-0 text-center">
          <div className={`px-3 py-1.5 rounded-lg ${scoreColor}`}>
            <span className="text-[18px] font-bold tabular-nums">
              {score !== null ? score : "—"}
            </span>
            {score !== null && <span className="text-[10px] text-zinc-500 ml-0.5">/100</span>}
          </div>
          {candidate.ai_verdict && (
            <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
              {candidate.ai_verdict.replace(/_/g, " ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
