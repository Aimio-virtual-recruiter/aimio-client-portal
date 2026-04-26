"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Plus,
  MapPin,
  DollarSign,
  Target,
  TrendingUp,
  Loader2,
  Building2,
  Globe,
  Award,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  location: string;
  manager_name: string;
  recruiter_count: number;
  active_clients: number;
  delivered_30d: number;
  hired_30d: number;
  total_monthly_cost: number;
  total_mrr: number;
  revenue_to_cost_ratio_pct: number;
  target_clients: number;
}

const LOCATION_FLAGS: Record<string, string> = {
  Quebec: "🇨🇦",
  Tunisia: "🇹🇳",
  Morocco: "🇲🇦",
  Senegal: "🇸🇳",
  Philippines: "🇵🇭",
  India: "🇮🇳",
  Other: "🌍",
};

export default function TeamsPage() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // Demo data
    setTimeout(() => {
      setTeams([
        {
          id: "1",
          name: "Quebec HQ",
          location: "Quebec",
          manager_name: "Marc-Antoine Côté",
          recruiter_count: 6,
          active_clients: 24,
          delivered_30d: 42,
          hired_30d: 8,
          total_monthly_cost: 45000,
          total_mrr: 95000,
          revenue_to_cost_ratio_pct: 211,
          target_clients: 30,
        },
        {
          id: "2",
          name: "Tunisia Alpha",
          location: "Tunisia",
          manager_name: "Yassine Ben Ali",
          recruiter_count: 10,
          active_clients: 65,
          delivered_30d: 95,
          hired_30d: 18,
          total_monthly_cost: 22000,
          total_mrr: 235000,
          revenue_to_cost_ratio_pct: 1068,
          target_clients: 80,
        },
        {
          id: "3",
          name: "Tunisia Beta",
          location: "Tunisia",
          manager_name: "Sara Belhaj",
          recruiter_count: 8,
          active_clients: 38,
          delivered_30d: 58,
          hired_30d: 11,
          total_monthly_cost: 18000,
          total_mrr: 142000,
          revenue_to_cost_ratio_pct: 789,
          target_clients: 80,
        },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  const totalRecruiters = teams.reduce((s, t) => s + t.recruiter_count, 0);
  const totalClients = teams.reduce((s, t) => s + t.active_clients, 0);
  const totalCost = teams.reduce((s, t) => s + t.total_monthly_cost, 0);
  const totalMrr = teams.reduce((s, t) => s + t.total_mrr, 0);
  const totalHires = teams.reduce((s, t) => s + t.hired_30d, 0);

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2">
          <ArrowLeft size={12} /> Admin
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">Teams</h1>
            </div>
            <p className="text-[13px] text-zinc-500">
              Manager-led teams across locations · Performance + economics
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition flex items-center gap-2">
            <Plus size={14} /> New team
          </button>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Teams" value={teams.length} icon={<Building2 size={14} />} color="blue" />
        <Stat label="Recruiters" value={totalRecruiters} icon={<Users size={14} />} color="purple" />
        <Stat label="Active clients" value={totalClients} icon={<Target size={14} />} color="amber" />
        <Stat label="MRR" value={`$${(totalMrr / 1000).toFixed(0)}K`} icon={<DollarSign size={14} />} color="emerald" highlight />
        <Stat label="Hires (30d)" value={totalHires} icon={<Award size={14} />} color="emerald" />
      </div>

      {/* Insight banner */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-emerald-900 mb-1">
              Offshore teams ROI : ${((totalMrr - totalCost) * 12).toLocaleString()}/year profit
            </h3>
            <p className="text-[12px] text-emerald-800">
              {teams.find((t) => t.location !== "Quebec")
                ? `Tunisia teams running at ${teams.filter((t) => t.location === "Tunisia").reduce((s, t) => s + t.revenue_to_cost_ratio_pct, 0) / Math.max(teams.filter((t) => t.location === "Tunisia").length, 1)}% revenue-to-cost ratio. `
                : ""}
              Total monthly cost ${totalCost.toLocaleString()} vs revenue ${totalMrr.toLocaleString()} = {Math.round((totalMrr / totalCost) * 100)}% ratio.
            </p>
          </div>
        </div>
      </div>

      {/* Teams cards */}
      <div className="space-y-4">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/admin/teams/${team.id}`}
            className="block bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[24px]">{LOCATION_FLAGS[team.location] || "🌍"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] font-bold text-zinc-900">{team.name}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 font-semibold uppercase">
                        <Globe size={9} /> {team.location}
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500">Manager: {team.manager_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <Mini label="Recruiters" value={team.recruiter_count} />
                  <Mini label="Active clients" value={`${team.active_clients}/${team.target_clients}`} />
                  <Mini label="Delivered 30d" value={team.delivered_30d} />
                  <Mini label="Hired 30d" value={team.hired_30d} highlight />
                  <Mini label="MRR" value={`$${(team.total_mrr / 1000).toFixed(0)}K`} highlight />
                </div>
              </div>

              {/* ROI badge */}
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Rev/Cost</p>
                <p
                  className={`text-[28px] font-bold tabular-nums ${
                    team.revenue_to_cost_ratio_pct >= 500
                      ? "text-emerald-600"
                      : team.revenue_to_cost_ratio_pct >= 200
                      ? "text-blue-600"
                      : "text-zinc-700"
                  }`}
                >
                  {team.revenue_to_cost_ratio_pct}%
                </p>
                <p className="text-[10px] text-zinc-400">
                  ${team.total_mrr.toLocaleString()} / ${team.total_monthly_cost.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                <span>Capacity used</span>
                <span className="font-semibold">
                  {team.active_clients}/{team.target_clients} clients ({Math.round((team.active_clients / team.target_clients) * 100)}%)
                </span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (team.active_clients / team.target_clients) > 0.85
                      ? "bg-amber-500"
                      : (team.active_clients / team.target_clients) > 0.5
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min((team.active_clients / team.target_clients) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "purple" | "amber" | "emerald";
  highlight?: boolean;
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" : "bg-white border border-zinc-200"}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-3 ${highlight ? "bg-white/20" : colors[color]}`}>
        {icon}
      </div>
      <p className={`text-[24px] font-bold tabular-nums ${highlight ? "text-white" : "text-zinc-900"}`}>{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${highlight ? "text-white/80" : "text-zinc-500"}`}>
        {label}
      </p>
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-[16px] font-bold tabular-nums ${highlight ? "text-[#2445EB]" : "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
