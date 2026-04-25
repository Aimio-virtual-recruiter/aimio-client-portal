"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Users,
  Send,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  Award,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Stage {
  key: string;
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

interface Candidate {
  id: string;
  full_name: string;
  current_title: string;
  current_company: string;
  status: string;
  ai_score: number;
  delivered_at: string | null;
}

const STAGE_DEFS = [
  { key: "sourced", label: "Sourced", color: "bg-zinc-300", textColor: "text-zinc-700", icon: <Users size={14} /> },
  { key: "outreached", label: "Outreached", color: "bg-blue-400", textColor: "text-blue-700", icon: <Send size={14} /> },
  { key: "replied", label: "Replied", color: "bg-purple-400", textColor: "text-purple-700", icon: <MessageCircle size={14} /> },
  { key: "interested", label: "Interested", color: "bg-amber-400", textColor: "text-amber-700", icon: <TrendingUp size={14} /> },
  { key: "qualified", label: "Qualified", color: "bg-[#2445EB]", textColor: "text-blue-900", icon: <CheckCircle2 size={14} /> },
  { key: "delivered", label: "Delivered", color: "bg-emerald-500", textColor: "text-emerald-700", icon: <Award size={14} /> },
  { key: "hired", label: "Hired", color: "bg-emerald-700", textColor: "text-emerald-900", icon: <Award size={14} /> },
];

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [candidatesByStage, setCandidatesByStage] = useState<Record<string, Candidate[]>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("client_company_id")
            .eq("id", user.id)
            .single();

          if (profile?.client_company_id) {
            const { data: candidates } = await supabase
              .from("sourced_candidates")
              .select("*")
              .eq("client_id", profile.client_company_id)
              .order("ai_score", { ascending: false });

            const all = (candidates as Candidate[]) || [];

            const grouped: Record<string, Candidate[]> = {
              sourced: all.filter((c) => ["new", "kept"].includes(c.status)),
              outreached: all.filter((c) => c.status === "outreached"),
              replied: all.filter((c) => c.status?.startsWith("replied_")),
              interested: all.filter((c) => c.status === "replied_interested"),
              qualified: all.filter((c) => ["qualifying", "qualified"].includes(c.status)),
              delivered: all.filter((c) => c.status === "delivered"),
              hired: all.filter((c) => c.status === "hired"),
            };

            setCandidatesByStage(grouped);
            setStages(
              STAGE_DEFS.map((s) => ({
                key: s.key,
                label: s.label,
                count: grouped[s.key]?.length || 0,
                color: s.color,
                icon: s.icon,
              }))
            );
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  const totalSourced = stages[0]?.count || 0;
  const totalHired = stages[stages.length - 1]?.count || 0;
  const conversionRate = totalSourced > 0 ? ((totalHired / totalSourced) * 100).toFixed(2) : "0";

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-xl flex items-center justify-center">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">Hiring Pipeline</h1>
            <p className="text-[13px] text-zinc-500">
              Real-time view of every candidate at every stage
            </p>
          </div>
        </div>
      </div>

      {/* Funnel summary */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Total in pipeline
            </p>
            <p className="text-[28px] font-bold text-zinc-900 tabular-nums">
              {Object.values(candidatesByStage).flat().length}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Active candidates
            </p>
            <p className="text-[28px] font-bold text-zinc-900 tabular-nums">
              {(candidatesByStage.outreached?.length || 0) +
                (candidatesByStage.replied?.length || 0) +
                (candidatesByStage.interested?.length || 0) +
                (candidatesByStage.qualified?.length || 0)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Delivered to you
            </p>
            <p className="text-[28px] font-bold text-[#2445EB] tabular-nums">
              {candidatesByStage.delivered?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Conversion rate
            </p>
            <p className="text-[28px] font-bold text-emerald-600 tabular-nums">{conversionRate}%</p>
          </div>
        </div>

        {/* Funnel viz */}
        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const max = Math.max(...stages.map((s) => s.count), 1);
            const widthPct = Math.max((stage.count / max) * 100, 3);
            const def = STAGE_DEFS[idx];
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-32 text-[12px] font-semibold text-zinc-700 flex items-center gap-1.5">
                  <span className={def.textColor}>{stage.icon}</span>
                  {stage.label}
                </div>
                <div className="flex-1 bg-zinc-100 rounded-full h-9 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-4 text-[12px] font-bold text-zinc-900">
                    {stage.count}
                  </span>
                </div>
                {idx < stages.length - 1 && stages[idx + 1].count > 0 && stage.count > 0 && (
                  <span className="text-[10px] text-zinc-400 w-14 text-right">
                    {Math.round((stages[idx + 1].count / stage.count) * 100)}% conv.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-stage detail */}
      <div className="space-y-6">
        {stages
          .filter((s) => s.count > 0)
          .map((stage) => {
            const candidates = candidatesByStage[stage.key] || [];
            return (
              <div key={stage.key} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="text-[15px] font-bold text-zinc-900">{stage.label}</h3>
                    <span className="text-[12px] text-zinc-500">
                      ({candidates.length} candidates)
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100">
                  {candidates.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/candidats/${c.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-[13px] font-bold text-zinc-700">
                        {c.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-900 truncate">
                          {c.full_name}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {c.current_title}
                          {c.current_company ? ` · ${c.current_company}` : ""}
                        </p>
                      </div>
                      {c.ai_score && (
                        <span className="text-[11px] font-bold text-[#2445EB] bg-[#2445EB]/10 rounded px-1.5 py-0.5">
                          {c.ai_score}/100
                        </span>
                      )}
                      <ArrowRight size={12} className="text-zinc-400" />
                    </Link>
                  ))}
                  {candidates.length > 5 && (
                    <div className="px-5 py-3 text-center">
                      <Link
                        href={`/candidats?stage=${stage.key}`}
                        className="text-[12px] text-[#2445EB] font-semibold hover:underline"
                      >
                        View all {candidates.length} candidates →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
