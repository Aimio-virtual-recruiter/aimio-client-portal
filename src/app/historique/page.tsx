"use client";
import { useEffect, useState } from "react";
import { supabase, type Candidate } from "@/lib/supabase";
import { useI18n } from "@/i18n/provider";
import { CheckCircle2, Users, TrendingUp, Clock, Loader2, Briefcase } from "lucide-react";

export default function HistoriquePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('candidates')
        .select('*, mandates(title)')
        .eq('company_id', '11111111-1111-1111-1111-111111111111')
        .eq('internal_status', 'approved')
        .order('delivered_at', { ascending: false });
      setCandidates(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;

  const hired = candidates.filter(c => c.status === 'hired');
  const interested = candidates.filter(c => c.status === 'interested');
  const avgScore = candidates.length > 0 ? (candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length).toFixed(1) : '0';

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
          {candidates.map((c) => (
            <div key={c.id} className="px-5 py-4 hover:bg-zinc-50/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center ring-2 ring-white">
                    <span className="text-[10px] font-semibold text-zinc-500">{c.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{c.name}</p>
                    <p className="text-[11px] text-zinc-400">{c.current_title} — {c.current_company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Briefcase size={11} />
                    {(c as unknown as Record<string, Record<string, string>>).mandates?.title || "—"}
                  </div>
                  <span className="text-[12px] font-semibold text-[#6C2BD9] tabular-nums">{c.score}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                    c.status === 'hired' ? 'bg-emerald-50 text-emerald-700' :
                    c.status === 'interested' ? 'bg-blue-50 text-blue-700' :
                    c.status === 'interview_scheduled' ? 'bg-amber-50 text-amber-700' :
                    c.status === 'not_interested' ? 'bg-red-50 text-red-600' :
                    'bg-zinc-50 text-zinc-500'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      c.status === 'hired' ? 'bg-emerald-500' :
                      c.status === 'interested' ? 'bg-blue-500' :
                      c.status === 'interview_scheduled' ? 'bg-amber-500' :
                      c.status === 'not_interested' ? 'bg-red-500' :
                      'bg-zinc-400'
                    }`} />
                    {c.status === 'hired' ? 'Hired' :
                     c.status === 'interested' ? 'Interested' :
                     c.status === 'interview_scheduled' ? 'Interview' :
                     c.status === 'not_interested' ? 'Passed' :
                     'Delivered'}
                  </span>
                  <span className="text-[10px] text-zinc-300">{new Date(c.delivered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
