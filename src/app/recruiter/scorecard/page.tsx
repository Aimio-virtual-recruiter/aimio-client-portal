"use client";
import { useEffect, useState } from "react";
import {
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  Trophy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Stats {
  hiresMonth: number;
  hiresQuarter: number;
  hiresYear: number;
  candidatesDelivered30d: number;
  candidatesSourced30d: number;
  avgTimeToHire: number;
  responseRate: number;
  activeClients: number;
  avgScore: number;
  rankingTeam: number;
  totalCommissionsThisMonth: number;
}

export default function ScorecardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recruiterName, setRecruiterName] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, assigned_client_ids, role")
          .eq("id", user.id)
          .single();
        setRecruiterName(profile?.first_name || "");

        // Filter by recruiter's assigned clients (admin sees all)
        const isAdmin = profile?.role === "admin";
        const assignedIds: string[] = profile?.assigned_client_ids || [];

        // Date ranges
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();
        const startYear = new Date(now.getFullYear(), 0, 1).toISOString();
        const start30d = new Date(Date.now() - 30 * 86400000).toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseFilter = (q: any): any => {
          if (isAdmin || assignedIds.length === 0) return q;
          return q.in("client_id", assignedIds);
        };

        // Hires (status = hired) — month / quarter / year
        const [hM, hQ, hY] = await Promise.all([
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .eq("status", "hired")
              .gte("hired_at", startMonth)
          ),
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .eq("status", "hired")
              .gte("hired_at", startQuarter)
          ),
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .eq("status", "hired")
              .gte("hired_at", startYear)
          ),
        ]);

        // Delivered + sourced (last 30 days)
        const [dRes, sRes] = await Promise.all([
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .eq("status", "delivered")
              .gte("delivered_at", start30d)
          ),
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .gte("created_at", start30d)
          ),
        ]);

        // Active clients
        let activeClientsCount = 0;
        if (isAdmin) {
          const { count } = await supabase
            .from("clients")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");
          activeClientsCount = count || 0;
        } else {
          activeClientsCount = assignedIds.length;
        }

        // Real avg time-to-hire — only from candidates with both delivered_at + hired_at
        let avgTimeToHire = 0;
        const ttHQuery = baseFilter(
          supabase
            .from("sourced_candidates")
            .select("delivered_at, hired_at")
            .eq("status", "hired")
            .not("delivered_at", "is", null)
            .not("hired_at", "is", null)
        );
        const { data: ttHRows } = await ttHQuery;
        if (ttHRows && ttHRows.length > 0) {
          const totalDays = ttHRows.reduce((sum: number, r: { delivered_at: string; hired_at: string }) => {
            const d1 = new Date(r.delivered_at).getTime();
            const d2 = new Date(r.hired_at).getTime();
            return sum + Math.max(0, (d2 - d1) / 86400000);
          }, 0);
          avgTimeToHire = Math.round(totalDays / ttHRows.length);
        }

        // Real response rate — replied / outreached × 100
        const [outR, repR] = await Promise.all([
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .in("status", ["outreached", "replied_interested", "replied_not_interested", "qualifying", "qualified", "delivered", "hired"])
              .gte("created_at", start30d)
          ),
          baseFilter(
            supabase
              .from("sourced_candidates")
              .select("*", { count: "exact", head: true })
              .in("status", ["replied_interested", "replied_not_interested", "qualifying", "qualified", "delivered", "hired"])
              .gte("created_at", start30d)
          ),
        ]);
        const responseRate = (outR.count || 0) > 0
          ? Math.round(((repR.count || 0) / (outR.count || 1)) * 100)
          : 0;

        // Avg AI score on delivered candidates
        let avgScore = 0;
        const { data: scoreRows } = await baseFilter(
          supabase
            .from("sourced_candidates")
            .select("ai_score")
            .eq("status", "delivered")
            .not("ai_score", "is", null)
            .gte("delivered_at", start30d)
        );
        if (scoreRows && scoreRows.length > 0) {
          const total = scoreRows.reduce((sum: number, r: { ai_score: number }) => sum + (r.ai_score || 0), 0);
          avgScore = Math.round(total / scoreRows.length);
        }

        setStats({
          hiresMonth: hM.count || 0,
          hiresQuarter: hQ.count || 0,
          hiresYear: hY.count || 0,
          candidatesDelivered30d: dRes.count || 0,
          candidatesSourced30d: sRes.count || 0,
          avgTimeToHire,
          responseRate,
          activeClients: activeClientsCount,
          avgScore,
          rankingTeam: 0, // TODO: requires team-wide aggregation, hidden when 0
          totalCommissionsThisMonth: 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">
          Your scorecard{recruiterName && <span className="text-zinc-400 font-normal">, {recruiterName}</span>}
        </h1>
        <p className="text-[14px] text-zinc-500 mt-1.5">
          Your performance · {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Big KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BigKPI
          icon={<Trophy size={18} />}
          label="Hires this month"
          value={stats.hiresMonth}
          gradient="from-emerald-500 to-emerald-600"
          sub={`${stats.hiresQuarter} this quarter`}
        />
        <BigKPI
          icon={<Users size={18} />}
          label="Candidates delivered"
          value={stats.candidatesDelivered30d}
          gradient="from-blue-500 to-blue-600"
          sub="last 30 days"
        />
        <BigKPI
          icon={<Award size={18} />}
          label="Avg fit score"
          value={stats.avgScore || "—"}
          gradient="from-purple-500 to-purple-600"
          sub={stats.avgScore ? "candidats livrés (30j)" : "données après 1ère livraison"}
        />
      </div>

      {/* Detail metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Metric
          icon={<Target size={13} />}
          label="Active clients"
          value={stats.activeClients}
        />
        <Metric
          icon={<Sparkles size={13} />}
          label="Sourced (30d)"
          value={stats.candidatesSourced30d}
        />
        <Metric
          icon={<Clock size={13} />}
          label="Avg time-to-hire"
          value={stats.avgTimeToHire ? `${stats.avgTimeToHire}d` : "—"}
          sub={stats.avgTimeToHire ? "industrie: 47j" : "data après 1ère embauche"}
        />
        <Metric
          icon={<TrendingUp size={13} />}
          label="Response rate"
          value={`${stats.responseRate}%`}
          sub="outreach 30j"
        />
      </div>

      {/* Achievements — earned status computed from real metrics */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-amber-600" />
          <h2 className="text-[16px] font-bold text-amber-900">Achievements</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Achievement
            label="First hire"
            desc="Première embauche confirmée"
            earned={stats.hiresYear >= 1}
          />
          <Achievement
            label="Speed champion"
            desc="Time-to-hire ≤ 23j (50% sous industrie)"
            earned={stats.avgTimeToHire > 0 && stats.avgTimeToHire <= 23}
          />
          <Achievement
            label="Quality star"
            desc="Avg fit score ≥ 85 sur candidats livrés"
            earned={stats.avgScore >= 85}
          />
          <Achievement
            label="High response rate"
            desc="Response rate outreach ≥ 30%"
            earned={stats.responseRate >= 30}
          />
          <Achievement
            label="Hire master"
            desc="10+ embauches dans le mois"
            earned={stats.hiresMonth >= 10}
          />
          <Achievement
            label="Centurion"
            desc="100+ candidats livrés cette année"
            earned={stats.candidatesDelivered30d * 12 >= 100 || stats.hiresYear >= 100}
          />
        </div>
      </div>

      {/* Compensation tracker */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-zinc-900">Compensation tracker</h2>
          <span className="text-[10px] bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
            this month
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompCard label="Base salary" value="$5,000" sub="Monthly" color="zinc" />
          <CompCard label="Recurring commissions" value={`$${(stats.activeClients * 500).toLocaleString()}`} sub={`${stats.activeClients} active clients × $500`} color="blue" />
          <CompCard label="Hire bonuses" value={`$${(stats.hiresMonth * 500).toLocaleString()}`} sub={`${stats.hiresMonth} hires × $500`} color="emerald" />
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-[14px] font-bold text-zinc-900">Total this month</p>
          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">
            ${(5000 + stats.activeClients * 500 + stats.hiresMonth * 500).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-[16px] font-bold text-zinc-900 mb-4">Monthly goals</h2>
        <div className="space-y-3">
          <Goal label="3 hires confirmed" current={stats.hiresMonth} target={3} unit="hires" />
          <Goal label="20 candidates delivered" current={stats.candidatesDelivered30d} target={20} unit="candidates" />
          <Goal label="8 active clients managed" current={stats.activeClients} target={8} unit="clients" />
        </div>
      </div>
    </div>
  );
}

function BigKPI({
  icon,
  label,
  value,
  gradient,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  sub: string;
}) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3 opacity-90">
          {icon}
          <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-[36px] font-bold tracking-tight tabular-nums">{value}</p>
        <p className="text-[11px] text-white/80 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center gap-1.5 mb-2 text-zinc-400">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
      <p className="text-[22px] font-bold text-zinc-900 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

function Achievement({ label, desc, earned }: { label: string; desc: string; earned?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${earned ? "bg-white border border-amber-200" : "bg-amber-100/30 opacity-50"}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${earned ? "bg-amber-500 text-white" : "bg-amber-200 text-amber-700"}`}>
        <Trophy size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-zinc-900">{label}</p>
        <p className="text-[10px] text-zinc-500">{desc}</p>
      </div>
      {earned && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
    </div>
  );
}

function CompCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "zinc" | "blue" | "emerald";
}) {
  const colors = {
    zinc: "bg-zinc-50",
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-[22px] font-bold text-zinc-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>
    </div>
  );
}

function Goal({ label, current, target, unit }: { label: string; current: number; target: number; unit: string }) {
  const pct = Math.min(100, (current / target) * 100);
  const done = current >= target;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold text-zinc-900">{label}</span>
        <span className="text-[11px] text-zinc-500">
          <span className={`font-bold ${done ? "text-emerald-600" : "text-zinc-900"}`}>{current}</span> / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-[#2445EB]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
