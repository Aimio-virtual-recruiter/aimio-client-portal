"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { CheckCircle2, Users, TrendingUp, Clock, Loader2, Briefcase } from "lucide-react";

interface CandidateHistoryRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  ai_score: number | null;
  status: string;
  delivered_at: string | null;
  mandates?: { title: string } | null;
}

export default function HistoriquePage() {
  const [candidates, setCandidates] = useState<CandidateHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, client_company_id")
          .eq("id", user.id)
          .single();

        // Build query — admin/recruiter see all, client sees only their own
        let query = supabase
          .from("sourced_candidates")
          .select("id, full_name, first_name, last_name, current_title, current_company, ai_score, status, delivered_at, mandates(title)")
          .in("status", ["delivered", "client_interested", "qualifying", "qualified", "hired"])
          .order("delivered_at", { ascending: false, nullsFirst: false })
          .limit(200);

        if (profile?.role === "client" && profile.client_company_id) {
          query = query.eq("client_id", profile.client_company_id);
        }

        const { data } = await query;
        setCandidates((data as unknown as CandidateHistoryRow[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;

  const hired = candidates.filter((c) => c.status === "hired");
  const interested = candidates.filter((c) => c.status === "client_interested" || c.status === "replied_interested");
  const scoredCandidates = candidates.filter((c) => c.ai_score !== null);
  const avgScore = scoredCandidates.length > 0
    ? (scoredCandidates.reduce((sum, c) => sum + (c.ai_score || 0), 0) / scoredCandidates.length).toFixed(0)
    : "—";

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{t("nav.history")}</h1>
        <p className="text-zinc-400 text-[13px] mt-0.5">Your recruitment performance over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total candidates delivered", value: candidates.length, icon: Users, color: "#6C2BD9" },
          { label: "Hired", value: hired.length, icon: CheckCircle2, color: "#10B981" },
          { label: "Interested", value: interested.length, icon: TrendingUp, color: "#3B82F6" },
          { label: "Average AI score", value: avgScore, icon: Clock, color: "#F59E0B" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} style={{ color: stat.color }} strokeWidth={1.5} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
              <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
              <p className="label mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Candidate history */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[13px] font-semibold text-zinc-900">All delivered candidates</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {candidates.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-zinc-500">Aucun candidat livré encore.</div>
          ) : candidates.map((c) => {
            const fullName = c.full_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Sans nom";
            const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
            return (
              <div key={c.id} className="px-5 py-4 hover:bg-zinc-50/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center ring-2 ring-white">
                      <span className="text-[10px] font-semibold text-zinc-500">{initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-zinc-900">{fullName}</p>
                      <p className="text-[11px] text-zinc-400">{c.current_title}{c.current_company && <> — {c.current_company}</>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Briefcase size={11} />
                      {c.mandates?.title || "—"}
                    </div>
                    {c.ai_score !== null && (
                      <span className="text-[12px] font-semibold text-[#6C2BD9] tabular-nums">{c.ai_score}</span>
                    )}
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      c.status === "hired" ? "bg-emerald-50 text-emerald-700" :
                      c.status === "client_interested" ? "bg-emerald-50 text-emerald-700" :
                      c.status === "qualified" ? "bg-blue-50 text-blue-700" :
                      c.status === "qualifying" ? "bg-amber-50 text-amber-700" :
                      "bg-zinc-50 text-zinc-500"
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        c.status === "hired" ? "bg-emerald-500" :
                        c.status === "client_interested" ? "bg-emerald-500" :
                        c.status === "qualified" ? "bg-blue-500" :
                        c.status === "qualifying" ? "bg-amber-500" :
                        "bg-zinc-400"
                      }`} />
                      {c.status === "hired" ? "Embauché 🎉" :
                       c.status === "client_interested" ? "Intéressé" :
                       c.status === "qualified" ? "Qualifié" :
                       c.status === "qualifying" ? "Qualif." :
                       "Livré"}
                    </span>
                    {c.delivered_at && (
                      <span className="text-[10px] text-zinc-300">
                        {new Date(c.delivered_at).toLocaleDateString("fr-CA", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
