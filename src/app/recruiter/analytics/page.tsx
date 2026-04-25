"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Send,
  MessageCircle,
  CheckCircle2,
  Award,
  Loader2,
  DollarSign,
} from "lucide-react";

interface Analytics {
  global: {
    total_sourced: number;
    total_outreached: number;
    total_replied: number;
    total_interested: number;
    total_delivered: number;
    total_hired: number;
    mrr_usd: number;
    arr_usd: number;
    active_clients: number;
  };
  conversion_rates: {
    sourced_to_outreached: string;
    outreached_to_replied: string;
    replied_to_interested: string;
    interested_to_delivered: string;
    delivered_to_hired: string;
    overall_sourced_to_hired: string;
  };
  per_client_funnel: Array<{
    client_id: string;
    company_name: string;
    position_title: string;
    sourced: number;
    reviewed_kept: number;
    strong_matches: number;
    outreached: number;
    replied: number;
    interested: number;
    delivered: number;
    hired: number;
  }>;
  recent_sourcing_runs: Array<{
    id: string;
    position_title: string;
    status: string;
    candidates_found: number;
    candidates_after_dedupe: number;
    started_at: string;
    estimated_cost_usd: number;
  }>;
  per_recruiter: Record<string, { runs: number; candidates: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruiter/analytics")
      .then((r) => r.json())
      .then((data) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={20} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">Pas de données</p>
      </div>
    );
  }

  const funnel = [
    { label: "Sourced", value: data.global.total_sourced, icon: Users, color: "bg-zinc-100 text-zinc-700" },
    { label: "Outreached", value: data.global.total_outreached, icon: Send, color: "bg-blue-100 text-blue-700" },
    { label: "Replied", value: data.global.total_replied, icon: MessageCircle, color: "bg-purple-100 text-purple-700" },
    { label: "Interested", value: data.global.total_interested, icon: TrendingUp, color: "bg-amber-100 text-amber-700" },
    { label: "Delivered", value: data.global.total_delivered, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
    { label: "Hired", value: data.global.total_hired, icon: Award, color: "bg-[#2445EB]/10 text-[#2445EB]" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-zinc-500">Full funnel · sourcing → hire</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* MRR stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="MRR"
            value={`$${data.global.mrr_usd.toLocaleString()}`}
            sub="per month"
            icon={<DollarSign size={14} />}
            color="emerald"
          />
          <StatCard
            label="ARR"
            value={`$${data.global.arr_usd.toLocaleString()}`}
            sub="annualized"
            icon={<TrendingUp size={14} />}
            color="blue"
          />
          <StatCard
            label="Active clients"
            value={data.global.active_clients.toString()}
            sub="RV subscribers"
            icon={<Users size={14} />}
            color="purple"
          />
          <StatCard
            label="Overall conv."
            value={`${data.conversion_rates.overall_sourced_to_hired}%`}
            sub="sourced → hired"
            icon={<Award size={14} />}
            color="amber"
          />
        </div>

        {/* Global funnel */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Global funnel</h2>
          <p className="text-[12px] text-zinc-500 mb-5">All clients combined</p>

          <div className="space-y-2">
            {funnel.map((stage, idx) => {
              const Icon = stage.icon;
              const prev = idx > 0 ? funnel[idx - 1].value : stage.value;
              const conversion = prev > 0 ? ((stage.value / prev) * 100).toFixed(0) : "—";
              const maxValue = funnel[0].value || 1;
              const widthPct = (stage.value / maxValue) * 100;

              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stage.color}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-zinc-900">{stage.label}</span>
                      <span className="text-[11px] text-zinc-500">{conversion}% conv.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] h-full rounded-full transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-bold text-zinc-900 tabular-nums w-12 text-right">
                        {stage.value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-client breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Per-client funnel</h2>
          <p className="text-[12px] text-zinc-500 mb-5">
            {data.per_client_funnel.length} active mandate(s)
          </p>

          {data.per_client_funnel.length === 0 ? (
            <p className="text-[13px] text-zinc-500 text-center py-8">Pas encore de données</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 text-left">Client</th>
                    <th className="pb-3 text-left">Position</th>
                    <th className="pb-3 text-right">Sourced</th>
                    <th className="pb-3 text-right">Strong</th>
                    <th className="pb-3 text-right">Out</th>
                    <th className="pb-3 text-right">Reply</th>
                    <th className="pb-3 text-right">Deliv</th>
                    <th className="pb-3 text-right">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_client_funnel.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition">
                      <td className="py-3 font-semibold text-zinc-900">{row.company_name}</td>
                      <td className="py-3 text-zinc-600">{row.position_title}</td>
                      <td className="py-3 text-right tabular-nums">{row.sourced}</td>
                      <td className="py-3 text-right tabular-nums text-emerald-600 font-semibold">
                        {row.strong_matches}
                      </td>
                      <td className="py-3 text-right tabular-nums">{row.outreached}</td>
                      <td className="py-3 text-right tabular-nums">{row.replied}</td>
                      <td className="py-3 text-right tabular-nums text-[#2445EB] font-semibold">
                        {row.delivered}
                      </td>
                      <td className="py-3 text-right tabular-nums text-zinc-900 font-bold">
                        {row.hired || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent sourcing runs */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Recent sourcing runs</h2>
          <p className="text-[12px] text-zinc-500 mb-5">Last 20</p>

          {data.recent_sourcing_runs.length === 0 ? (
            <p className="text-[13px] text-zinc-500 text-center py-8">Aucun sourcing lancé</p>
          ) : (
            <div className="space-y-2">
              {data.recent_sourcing_runs.slice(0, 10).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 truncate">
                      {run.position_title}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(run.started_at).toLocaleString("fr-CA")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[13px] font-bold text-zinc-900">
                      {run.candidates_after_dedupe} candidats
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      ${run.estimated_cost_usd?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <span
                    className={`ml-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      run.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : run.status === "running"
                        ? "bg-blue-100 text-blue-700"
                        : run.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-recruiter */}
        {Object.keys(data.per_recruiter).length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-5">Per recruiter</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(data.per_recruiter).map(([email, stats]) => (
                <div key={email} className="bg-zinc-50 rounded-lg p-4">
                  <p className="text-[13px] font-semibold text-zinc-900 mb-1 truncate">{email}</p>
                  <p className="text-[11px] text-zinc-500 mb-2">
                    {stats.runs} sourcing runs
                  </p>
                  <p className="text-[22px] font-bold text-[#2445EB] tabular-nums">
                    {stats.candidates}
                    <span className="text-[11px] text-zinc-400 font-normal ml-1">candidats</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const colors: Record<typeof color, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[26px] font-bold text-zinc-900 tracking-tight">{value}</p>
      <p className="text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
