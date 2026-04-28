"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Plus,
  Briefcase,
  MapPin,
  DollarSign,
  Loader2,
  ChevronRight,
  Building2,
  Search,
  Filter,
} from "lucide-react";

interface MandateRow {
  id: string;
  title: string | null;
  department: string | null;
  location: string | null;
  work_mode: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  candidates_delivered: number | null;
  search_criteria: Record<string, unknown> | null;
  created_at: string;
  company_id: string;
  clients?: { company_name: string } | null;
}

const STATUS_PILL: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Actif", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  pending_review: { label: "En revue", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  paused: { label: "Pause", color: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" },
  filled: { label: "Comblé", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  closed: { label: "Fermé", color: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" },
};

export default function AdminMandatesPage() {
  const [mandates, setMandates] = useState<MandateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("mandates")
        .select("*, clients(company_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      setMandates((data as MandateRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = mandates.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q) ||
      m.clients?.company_name.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: mandates.length,
    active: mandates.filter((m) => m.status === "active").length,
    pending: mandates.filter((m) => m.status === "pending_review").length,
    filled: mandates.filter((m) => m.status === "filled").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="bg-zinc-50 min-h-screen -m-4 md:-m-6 lg:-m-8">
      {/* Top bar */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <Link href="/admin" className="hover:text-[#2445EB]">Admin</Link>
            <ChevronRight size={11} />
            <span className="text-zinc-900 font-semibold">Mandats</span>
          </div>
          <Link
            href="/mandats/nouveau"
            className="px-4 py-2 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-md text-[12px] font-bold hover:opacity-90 inline-flex items-center gap-1.5 shadow-md shadow-[#2445EB]/20"
          >
            <Plus size={12} /> Créer un mandat (avec filtres Recruiter Lite)
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Mandats</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {mandates.length} mandats au total · {filtered.length} affichés
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
            <Stat label="Total" value={stats.total} />
            <Stat label="Actifs" value={stats.active} color="emerald" />
            <Stat label="En revue" value={stats.pending} color="amber" />
            <Stat label="Comblés" value={stats.filled} color="blue" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre, client, ville…"
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-zinc-200 text-[12px] focus:border-[#2445EB] outline-none bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 rounded-md border border-zinc-200 text-[12px] bg-white"
            >
              <option value="all">Tous statuts</option>
              {Object.entries(STATUS_PILL).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hint banner */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="bg-gradient-to-r from-[#2445EB]/5 to-purple-500/5 border border-[#2445EB]/20 rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#2445EB]" />
            <p className="text-[12px] text-zinc-700">
              <strong>Tous les nouveaux mandats</strong> sont créés avec les <strong>filtres Recruiter Lite (40+ critères)</strong> : titres, employeurs, langues, écoles, certifications, etc.
            </p>
          </div>
          <Link href="/mandats/nouveau" className="shrink-0 text-[12px] text-[#2445EB] font-semibold hover:underline">
            Créer un mandat →
          </Link>
        </div>
      </div>

      {/* Mandates list */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
            <Briefcase size={32} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-[14px] font-semibold text-zinc-700">Aucun mandat trouvé</p>
            <p className="text-[12px] text-zinc-500 mt-1 mb-4">
              {search || statusFilter !== "all" ? "Ajuste tes filtres." : "Crée le premier mandat avec les filtres Recruiter Lite complets."}
            </p>
            <Link
              href="/mandats/nouveau"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2445EB] text-white rounded-md text-[12px] font-bold hover:bg-[#1A36C4]"
            >
              <Plus size={12} /> Créer un mandat
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {filtered.map((m) => {
                const statusInfo = STATUS_PILL[m.status] || { label: m.status, color: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" };
                const criteriaCount = m.search_criteria
                  ? Object.values(m.search_criteria).filter((v) => Array.isArray(v) ? v.length > 0 : !!v).length
                  : 0;
                const daysAgo = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000);
                return (
                  <Link
                    key={m.id}
                    href={`/mandats/${m.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                        <Briefcase size={14} className="text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-bold text-zinc-900 group-hover:text-[#2445EB] truncate">
                            {m.title || "Sans titre"}
                          </p>
                          {criteriaCount > 0 && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 font-bold">
                              ✓ {criteriaCount} CRITÈRES
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                          {m.clients?.company_name && (
                            <span className="text-[11px] text-[#2445EB] font-semibold inline-flex items-center gap-1">
                              <Building2 size={10} /> {m.clients.company_name}
                            </span>
                          )}
                          {m.location && (
                            <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                              <MapPin size={10} /> {m.location}
                            </span>
                          )}
                          {(m.salary_min || m.salary_max) && (
                            <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                              <DollarSign size={10} />
                              {m.salary_min ? `${(m.salary_min / 1000).toFixed(0)}K` : "?"}-
                              {m.salary_max ? `${(m.salary_max / 1000).toFixed(0)}K` : "?"}
                            </span>
                          )}
                          {m.work_mode && (
                            <span className="text-[11px] text-zinc-500">{m.work_mode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 hidden md:inline">il y a {daysAgo}j</span>
                      <ChevronRight size={14} className="text-zinc-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: "blue" | "emerald" | "amber" | "purple" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${color ? styles[color] : "bg-white border-zinc-200"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none">{label}</p>
      <p className="text-[20px] font-bold text-zinc-900 tabular-nums mt-1.5 leading-none">{value}</p>
    </div>
  );
}
