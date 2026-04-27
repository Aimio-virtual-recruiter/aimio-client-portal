"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  DollarSign,
  Building2,
  Users,
  Edit3,
  Rocket,
  Briefcase,
  Calendar,
  Sparkles,
  ExternalLink,
  Filter,
  AlertCircle,
} from "lucide-react";

interface MandateRow {
  id: string;
  company_id: string;
  title: string | null;
  department: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  work_mode: string | null;
  status: string;
  search_criteria: Record<string, unknown> | null;
  criteria_updated_at: string | null;
  scoring_criteria: { criteria: string; weight: number }[] | null;
  candidates_delivered: number | null;
  created_at: string;
}

interface ClientRow {
  id: string;
  company_name: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  country: string | null;
  plan: string | null;
}

interface CandidateRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  ai_score: number | null;
  status: string;
  delivered_at: string | null;
  created_at: string;
}

export default function MandateDetailPage() {
  const params = useParams();
  const [mandate, setMandate] = useState<MandateRow | null>(null);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.id) return;
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          setUserRole(profile?.role || null);
        }

        const { data: m } = await supabase
          .from("mandates")
          .select("*")
          .eq("id", params.id as string)
          .single();
        setMandate(m as MandateRow);

        if (m?.company_id) {
          const { data: c } = await supabase
            .from("clients")
            .select("id, company_name, contact_first_name, contact_last_name, country, plan")
            .eq("id", m.company_id)
            .single();
          setClient(c as ClientRow);
        }

        const { data: cands } = await supabase
          .from("sourced_candidates")
          .select("id, full_name, first_name, last_name, current_title, current_company, ai_score, status, delivered_at, created_at")
          .eq("mandate_id", params.id as string)
          .order("ai_score", { ascending: false, nullsFirst: false })
          .limit(50);
        setCandidates((cands as CandidateRow[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <Link href="/mandats" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
          <ArrowLeft size={14} /> Retour
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-[14px] text-red-800">Mandat introuvable.</p>
        </div>
      </div>
    );
  }

  const statusColor =
    mandate.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    mandate.status === "pending_review" ? "bg-amber-50 text-amber-700 border-amber-200" :
    mandate.status === "filled" ? "bg-blue-50 text-blue-700 border-blue-200" :
    "bg-zinc-100 text-zinc-700 border-zinc-200";

  const statusLabel =
    mandate.status === "active" ? "Actif" :
    mandate.status === "pending_review" ? "En revue" :
    mandate.status === "filled" ? "Comblé" :
    mandate.status === "paused" ? "Pause" :
    mandate.status;

  const criteriaCount = mandate.search_criteria
    ? Object.values(mandate.search_criteria).filter((v) => Array.isArray(v) ? v.length > 0 : !!v).length
    : 0;

  // Pipeline stats
  const stats = {
    sourced: candidates.length,
    outreached: candidates.filter((c) => ["outreached", "outreach_ready"].includes(c.status)).length,
    replied: candidates.filter((c) => ["replied_interested", "replied_not_interested", "qualifying", "qualified", "delivered", "hired"].includes(c.status)).length,
    delivered: candidates.filter((c) => c.status === "delivered").length,
    hired: candidates.filter((c) => c.status === "hired").length,
  };

  const isRecruiterOrAdmin = userRole === "admin" || userRole === "recruiter";

  return (
    <div className="max-w-5xl mx-auto py-6 px-6">
      {/* Back */}
      <Link href={isRecruiterOrAdmin ? "/admin/mandates" : "/mandats"} className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft size={14} /> Retour aux mandats
      </Link>

      {/* Client banner — clearly shows which client this mandate is for */}
      {client && (
        <Link
          href={isRecruiterOrAdmin ? `/recruiter/clients/${client.id}` : "/dashboard"}
          className="block mb-4 bg-gradient-to-r from-[#2445EB]/5 to-[#4B5DF5]/5 border border-[#2445EB]/20 rounded-xl p-4 hover:border-[#2445EB]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] flex items-center justify-center text-white font-bold text-[14px]">
                {client.company_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Mandat pour</p>
                <p className="text-[16px] font-bold text-zinc-900">{client.company_name}</p>
                <p className="text-[12px] text-zinc-500">
                  {client.contact_first_name} {client.contact_last_name}
                  {client.country && <> · {client.country}</>}
                  {client.plan && <> · Plan {client.plan}</>}
                </p>
              </div>
            </div>
            <ExternalLink size={14} className="text-zinc-400 group-hover:text-[#2445EB]" />
          </div>
        </Link>
      )}

      {/* Mandate header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{mandate.title || "Sans titre"}</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-[13px] text-zinc-500">
              {mandate.department && <>{mandate.department} · </>}
              Créé le {new Date(mandate.created_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          {isRecruiterOrAdmin && (
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/mandats/nouveau?edit=${mandate.id}&client=${mandate.company_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                <Edit3 size={12} /> Modifier
              </Link>
              <Link
                href={`/recruiter/source?client=${mandate.company_id}&mandate=${mandate.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition shadow-md shadow-[#2445EB]/20"
              >
                <Rocket size={12} /> Lancer sourcing
              </Link>
            </div>
          )}
        </div>

        {/* Quick info pills */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {mandate.location && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-700">
              <MapPin size={12} className="text-zinc-400" /> {mandate.location}
            </span>
          )}
          {(mandate.salary_min || mandate.salary_max) && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-700">
              <DollarSign size={12} className="text-zinc-400" />
              {mandate.salary_min ? `${(mandate.salary_min / 1000).toFixed(0)}K` : "?"}
              {" - "}
              {mandate.salary_max ? `${(mandate.salary_max / 1000).toFixed(0)}K` : "?"}
              $/an
            </span>
          )}
          {mandate.work_mode && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-700">
              <Building2 size={12} className="text-zinc-400" /> {mandate.work_mode}
            </span>
          )}
          {mandate.criteria_updated_at && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500">
              <Calendar size={12} /> Critères MAJ {new Date(mandate.criteria_updated_at).toLocaleDateString("fr-CA")}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        <h2 className="text-[14px] font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-[#2445EB]" /> Pipeline
        </h2>
        <div className="grid grid-cols-5 gap-2">
          <PipelineStat label="Sourcés" value={stats.sourced} color="bg-zinc-100 text-zinc-700" />
          <PipelineStat label="Outreachés" value={stats.outreached} color="bg-blue-100 text-blue-700" />
          <PipelineStat label="Réponses" value={stats.replied} color="bg-purple-100 text-purple-700" />
          <PipelineStat label="Livrés" value={stats.delivered} color="bg-emerald-100 text-emerald-700" />
          <PipelineStat label="Embauchés" value={stats.hired} color="bg-emerald-200 text-emerald-900" highlight />
        </div>
      </div>

      {/* Recruiter Lite criteria summary */}
      {isRecruiterOrAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-zinc-900 flex items-center gap-2">
              <Filter size={14} className="text-[#2445EB]" />
              Critères Recruiter Lite ({criteriaCount} configurés)
            </h2>
            <Link
              href={`/mandats/nouveau?edit=${mandate.id}&client=${mandate.company_id}`}
              className="text-[12px] text-[#2445EB] hover:text-[#1A36C4] font-semibold"
            >
              Modifier →
            </Link>
          </div>
          {criteriaCount === 0 ? (
            <p className="text-[13px] text-zinc-500 italic">
              Aucun critère détaillé configuré. Clique « Modifier » pour préciser titres, langues, écoles, employeurs cibles, etc.
            </p>
          ) : (
            <CriteriaSummary criteria={mandate.search_criteria || {}} />
          )}
        </div>
      )}

      {/* Description */}
      {mandate.description && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
          <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <Briefcase size={14} className="text-zinc-400" /> Description
          </h2>
          <p className="text-[13px] text-zinc-700 whitespace-pre-line leading-relaxed">
            {mandate.description}
          </p>
        </div>
      )}

      {/* Candidates list */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-zinc-900 flex items-center gap-2">
            <Users size={14} /> Candidats ({candidates.length})
          </h2>
          {isRecruiterOrAdmin && candidates.length > 0 && (
            <Link href={`/recruiter/queue?client_id=${mandate.company_id}`} className="text-[12px] text-[#2445EB] hover:text-[#1A36C4] font-semibold">
              Voir tout dans la queue →
            </Link>
          )}
        </div>
        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={28} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-[14px] font-semibold text-zinc-700">Aucun candidat encore</p>
            <p className="text-[12px] text-zinc-500 mt-1">
              {isRecruiterOrAdmin
                ? "Lance un sourcing pour ramener des candidats matchant les critères."
                : "Votre recruteur travaille à sourcer les meilleurs candidats. Premier shortlist sous 5-7 jours."}
            </p>
            {isRecruiterOrAdmin && (
              <Link
                href={`/recruiter/source?client=${mandate.company_id}&mandate=${mandate.id}`}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2445EB] text-white rounded-lg text-[12px] font-bold hover:bg-[#1A36C4] transition"
              >
                <Rocket size={12} /> Lancer le 1er sourcing
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {candidates.map((c) => {
              const fullName = c.full_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Sans nom";
              const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
              const score = c.ai_score || 0;
              const scoreColor = score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-700";
              return (
                <Link key={c.id} href={`/candidats/${c.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{fullName}</p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {c.current_title}
                        {c.current_company && <> · {c.current_company}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score > 0 && (
                      <span className={`text-[12px] font-bold px-2 py-1 rounded-md tabular-nums ${scoreColor}`}>
                        {score}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 capitalize">{c.status.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineStat({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? "ring-2 ring-emerald-200" : ""}`}>
      <div className={`inline-block px-3 py-1 rounded-md ${color} mb-1`}>
        <span className="text-[18px] font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

function CriteriaSummary({ criteria }: { criteria: Record<string, unknown> }) {
  const items: { label: string; value: string }[] = [];
  const arr = (k: string) => (Array.isArray(criteria[k]) ? (criteria[k] as unknown[]) : []);

  if (arr("jobTitlesCurrent").length) items.push({ label: "Titres actuels", value: arr("jobTitlesCurrent").join(", ") });
  if (arr("seniorityLevels").length) items.push({ label: "Séniorité", value: arr("seniorityLevels").join(", ") });
  if (arr("functions").length) items.push({ label: "Fonction", value: arr("functions").join(", ") });
  if (criteria.yearsExperienceMin !== undefined && criteria.yearsExperienceMax !== undefined && (Number(criteria.yearsExperienceMin) > 0 || Number(criteria.yearsExperienceMax) < 30)) {
    items.push({ label: "Expérience", value: `${criteria.yearsExperienceMin}-${criteria.yearsExperienceMax} ans` });
  }
  if (arr("locations").length) items.push({ label: "Villes", value: arr("locations").join(", ") });
  if (arr("countries").length) items.push({ label: "Pays", value: arr("countries").join(", ") });
  if (arr("currentEmployers").length) items.push({ label: "Employeurs cibles", value: arr("currentEmployers").join(", ") });
  if (arr("excludeEmployers").length) items.push({ label: "À exclure", value: arr("excludeEmployers").join(", ") });
  if (arr("industries").length) items.push({ label: "Industries", value: arr("industries").join(", ") });
  if (arr("skills").length) items.push({ label: "Compétences", value: arr("skills").join(", ") });
  if (arr("certifications").length) items.push({ label: "Certifications", value: arr("certifications").join(", ") });
  if (Array.isArray(criteria.languages) && criteria.languages.length) {
    items.push({
      label: "Langues",
      value: (criteria.languages as { name: string; proficiency: string }[]).map((l) => `${l.name} (${l.proficiency})`).join(", "),
    });
  }
  if (arr("schools").length) items.push({ label: "Écoles", value: arr("schools").join(", ") });
  if (arr("degrees").length) items.push({ label: "Diplômes", value: arr("degrees").join(", ") });
  if (criteria.openToWork) items.push({ label: "Signal", value: "Open to Work activé" });

  if (items.length === 0) {
    return <p className="text-[13px] text-zinc-500 italic">Aucun critère configuré.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
      {items.map((it, i) => (
        <div key={i} className="text-[12px]">
          <span className="font-semibold text-zinc-700">{it.label}: </span>
          <span className="text-zinc-600">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
