"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import {
  Loader2,
  Phone,
  Mail,
  Link2,
  MapPin,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Prospect {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company_name: string;
  company_industry: string | null;
  company_city: string | null;
  company_state: string | null;
  icp_score: number;
  priority: string;
  status: string;
  last_contacted_at: string | null;
  last_attempted_at: string | null;
  touch_count: number;
  call_count: number;
  email_count: number;
  notes: string | null;
}

interface QueueStats {
  total: number;
  never_contacted: number;
  high_priority: number;
  with_phone: number;
  with_email: number;
}

interface Recruiter {
  id: string;
  name: string;
}

const DISPOSITIONS: Array<{
  value: string;
  label: string;
  emoji: string;
  color: string;
}> = [
  { value: "connected", label: "Connecté", emoji: "✅", color: "emerald" },
  { value: "booked_meeting", label: "Meeting bookée", emoji: "🎯", color: "blue" },
  { value: "voicemail", label: "Voicemail", emoji: "📩", color: "amber" },
  { value: "no_answer", label: "Pas de réponse", emoji: "🔇", color: "zinc" },
  { value: "not_interested", label: "Pas intéressé", emoji: "❌", color: "red" },
  { value: "wrong_number", label: "Mauvais numéro", emoji: "🚫", color: "zinc" },
  { value: "do_not_call", label: "Do not call", emoji: "⛔", color: "red" },
];

export default function QueuePage() {
  const [reps, setReps] = useState<Recruiter[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>("");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "never" | "high">("all");
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [logging, setLogging] = useState(false);
  const [callNotes, setCallNotes] = useState("");

  // Load active reps
  useEffect(() => {
    async function loadReps() {
      const { data } = await supabase
        .from("recruiters")
        .select("id, name")
        .eq("is_active", true);
      setReps(data ?? []);
    }
    loadReps();
  }, []);

  // Load queue when rep changes
  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prospects/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rep_id: selectedRep || undefined,
          limit: 300,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setProspects(json.prospects ?? []);
      setStats(json.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRep]);

  // Log a call disposition
  const logDisposition = async (
    prospect: Prospect,
    disposition: string
  ) => {
    if (!selectedRep) {
      toast.warning("Choisis d'abord un rep");
      return;
    }
    setLogging(true);
    try {
      const res = await fetch("/api/activities/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospect.id,
          rep_id: selectedRep,
          activity_type: "call",
          direction: "outbound",
          call_disposition: disposition,
          notes: callNotes || undefined,
          outcome:
            disposition === "booked_meeting" || disposition === "connected"
              ? "positive"
              : disposition === "not_interested" || disposition === "do_not_call"
              ? "negative"
              : "neutral",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");

      // Remove from active list, refresh
      setActiveProspect(null);
      setCallNotes("");
      // Optimistic update — just remove from local state
      setProspects((prev) => prev.filter((p) => p.id !== prospect.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLogging(false);
    }
  };

  // Filter + search
  const filteredProspects = useMemo(() => {
    let list = prospects;

    if (filter === "never") {
      list = list.filter((p) => !p.last_contacted_at);
    } else if (filter === "high") {
      list = list.filter((p) => p.priority === "high" || p.icp_score >= 75);
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(s) ||
          p.company_name.toLowerCase().includes(s) ||
          (p.email?.toLowerCase().includes(s) ?? false)
      );
    }

    return list;
  }, [prospects, filter, search]);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-[#6C2BD9]" />
            <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
              Lead Queue — Cold Calls
            </h1>
          </div>
          <p className="text-[13px] text-zinc-500 mt-1">
            300 prospects priorisés par jour · ICP score + recency
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] hover:bg-zinc-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <span>🔄</span>}
          Refresh
        </button>
      </div>

      {/* Rep selector + filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
          >
            <option value="">📋 Tous les reps (queue partagée)</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                👤 {r.name}
              </option>
            ))}
          </select>

          <div className="flex-1 min-w-[200px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher prospect, entreprise..."
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition ${
                filter === "all" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("never")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition ${
                filter === "never" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              Jamais contactés
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition ${
                filter === "high" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              🔥 High priority
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatPill label="En queue" value={stats.total} icon={<Phone size={11} />} />
          <StatPill label="Jamais contactés" value={stats.never_contacted} icon={<Clock size={11} />} />
          <StatPill label="High priority" value={stats.high_priority} icon={<Sparkles size={11} className="text-[#6C2BD9]" />} />
          <StatPill label="Avec phone" value={stats.with_phone} icon={<Phone size={11} className="text-emerald-500" />} />
          <StatPill label="Avec email" value={stats.with_email} icon={<Mail size={11} className="text-blue-500" />} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* Prospect list */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin text-zinc-300 mx-auto" size={20} />
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="p-12 text-center">
            <Phone size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-zinc-600 mb-1">
              {prospects.length === 0
                ? "Aucun prospect dans la queue"
                : "Aucun prospect avec ces filtres"}
            </p>
            <p className="text-[12px] text-zinc-400 max-w-md mx-auto">
              {prospects.length === 0
                ? "Importe des prospects via Apollo, Apify, ou CSV pour démarrer."
                : "Ajuste tes filtres."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredProspects.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveProspect(p)}
                className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-50 cursor-pointer transition-all"
              >
                {/* Score badge */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    p.icp_score >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : p.icp_score >= 60
                      ? "bg-[#6C2BD9]/15 text-[#6C2BD9]"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {p.icp_score}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-zinc-900 truncate">
                      {p.full_name || "(sans nom)"}
                    </p>
                    {p.priority === "high" && (
                      <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                        🔥 HIGH
                      </span>
                    )}
                    {!p.last_contacted_at && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        FRESH
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {p.title} · {p.company_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400 flex-wrap">
                    {p.phone && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Phone size={9} /> {p.phone}
                      </span>
                    )}
                    {p.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={9} /> {p.email}
                      </span>
                    )}
                    {(p.company_city || p.company_state) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={9} />
                        {[p.company_city, p.company_state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {p.touch_count > 0 && (
                      <span className="text-zinc-400">
                        {p.touch_count} touches · last {p.last_attempted_at?.substring(0, 10) ?? "—"}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={14} className="text-zinc-300 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active prospect modal */}
      {activeProspect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveProspect(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-zinc-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6C2BD9] flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                  {activeProspect.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-bold text-zinc-900">{activeProspect.full_name}</h2>
                  <p className="text-[12px] text-zinc-500">{activeProspect.title}</p>
                  <p className="text-[12px] text-zinc-700 font-medium mt-0.5">
                    {activeProspect.company_name}
                  </p>
                </div>
              </div>

              {/* Contact buttons */}
              <div className="flex gap-2 mt-4">
                {activeProspect.phone && (
                  <a
                    href={`tel:${activeProspect.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
                {activeProspect.email && (
                  <a
                    href={`mailto:${activeProspect.email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-[12px] font-medium"
                  >
                    <Mail size={12} /> Email
                  </a>
                )}
                {activeProspect.linkedin_url && (
                  <a
                    href={activeProspect.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-[12px] font-medium"
                  >
                    <Link2 size={12} />
                  </a>
                )}
              </div>
            </div>

            <div className="p-6">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
                Note pour ce call (optionnel)
              </p>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={2}
                placeholder="ex: Très intéressé, à recontacter mardi avec proposition..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] resize-none focus:outline-none focus:border-[#6C2BD9]"
              />

              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-3 mt-5">
                Disposition du call
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DISPOSITIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => logDisposition(activeProspect, d.value)}
                    disabled={logging}
                    className={`px-3 py-2.5 rounded-lg text-[12px] font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                      d.color === "emerald"
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        : d.color === "blue"
                        ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                        : d.color === "amber"
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                        : d.color === "red"
                        ? "bg-red-50 hover:bg-red-100 text-red-700"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    <span>{d.emoji}</span>
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveProspect(null)}
                className="w-full mt-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-[12px]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 px-3 py-2.5 flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[15px] font-bold text-zinc-900 tabular-nums">{value}</p>
        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
