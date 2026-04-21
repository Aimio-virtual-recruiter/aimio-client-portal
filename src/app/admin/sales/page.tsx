"use client";
import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  CalendarCheck,
  Loader2,
  TrendingUp,
  Trophy,
  AlertCircle,
  Activity,
} from "lucide-react";

interface RepStats {
  id: string;
  name: string;
  title: string;
  calls_today: number;
  calls_connected_today: number;
  meetings_booked_today: number;
  emails_sent_today: number;
  calls_this_week: number;
  meetings_this_week: number;
  calls_target: number;
  calls_completion_pct: number;
}

interface PerformanceData {
  reps: RepStats[];
  team_totals: {
    calls_today: number;
    calls_connected_today: number;
    meetings_booked_today: number;
    emails_sent_today: number;
    calls_this_week: number;
    meetings_this_week: number;
  };
  last_updated: string;
}

const REFRESH_INTERVAL_MS = 30000; // Auto-refresh every 30 seconds

export default function SalesDashboardPage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sales/performance");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setData(json);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-zinc-300" size={20} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 max-w-2xl">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-red-800">Erreur de chargement</p>
            <p className="text-[12px] text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="text-[12px] text-red-700 underline mt-2"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { reps, team_totals } = data;
  const teamCallsTarget = reps.length * 300; // Default 300/rep
  const teamCallsPct = teamCallsTarget > 0 ? Math.round((team_totals.calls_today / teamCallsTarget) * 100) : 0;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#6C2BD9]" />
            <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
              Sales Activity — Live
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-700 font-semibold">LIVE</span>
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 mt-1">
            Refresh auto chaque 30 sec · Last update : {lastFetched?.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Team Totals — BIG ONE */}
      <div className="bg-zinc-900 text-white rounded-2xl p-7 mb-5 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[400px] h-[300px] bg-[#6C2BD9]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-4">
            Aujourd&apos;hui · Équipe entière
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <BigKPI
              icon={<Phone size={14} className="text-[#A78BFA]" />}
              value={team_totals.calls_today}
              label="Cold calls"
              subtitle={`${teamCallsPct}% de ${teamCallsTarget}`}
              progressPct={teamCallsPct}
            />
            <BigKPI
              icon={<Phone size={14} className="text-emerald-400" />}
              value={team_totals.calls_connected_today}
              label="Connectés"
              subtitle={
                team_totals.calls_today > 0
                  ? `${Math.round((team_totals.calls_connected_today / team_totals.calls_today) * 100)}% rate`
                  : ""
              }
            />
            <BigKPI
              icon={<CalendarCheck size={14} className="text-blue-400" />}
              value={team_totals.meetings_booked_today}
              label="Meetings bookés"
              subtitle={
                team_totals.calls_today > 0
                  ? `${((team_totals.meetings_booked_today / team_totals.calls_today) * 100).toFixed(1)}% conversion`
                  : ""
              }
            />
            <BigKPI
              icon={<Mail size={14} className="text-amber-400" />}
              value={team_totals.emails_sent_today}
              label="Emails envoyés"
              subtitle="Auto-sent"
            />
          </div>
        </div>
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <SmallKPI
          icon={<Phone size={14} className="text-zinc-400" />}
          label="Calls cette semaine"
          value={team_totals.calls_this_week}
        />
        <SmallKPI
          icon={<CalendarCheck size={14} className="text-zinc-400" />}
          label="Meetings cette semaine"
          value={team_totals.meetings_this_week}
        />
        <SmallKPI
          icon={<TrendingUp size={14} className="text-zinc-400" />}
          label="Reps actifs"
          value={reps.length}
        />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-[#6C2BD9]" />
            <h2 className="text-[14px] font-semibold text-zinc-900">Leaderboard — Aujourd&apos;hui</h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Cible : 300 calls/jour · 5 meetings/jour par rep
          </p>
        </div>

        {reps.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-zinc-500">
              Aucun recruteur actif. Exécute le SQL <code>AIMIO_SALES_MACHINE_SCHEMA.sql</code> pour seed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reps.map((r, idx) => {
              const isTop = idx === 0 && r.calls_today > 0;
              const isBelowTarget = r.calls_completion_pct < 50;

              return (
                <div
                  key={r.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-all"
                >
                  {/* Rank */}
                  <div className="w-7 text-center shrink-0">
                    {isTop ? (
                      <span className="text-[14px]">🏆</span>
                    ) : (
                      <span className="text-[12px] font-bold text-zinc-400">{idx + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-zinc-600">
                      {r.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("")}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{r.name}</p>
                      {isBelowTarget && r.calls_today > 0 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          ⚠ Sous target
                        </span>
                      )}
                      {r.calls_today >= r.calls_target && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          ✅ Target hit
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">{r.title}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 shrink-0">
                    <RepStat icon={<Phone size={11} />} value={r.calls_today} label="calls" />
                    <RepStat
                      icon={<Phone size={11} className="text-emerald-500" />}
                      value={r.calls_connected_today}
                      label="connect"
                    />
                    <RepStat
                      icon={<CalendarCheck size={11} className="text-blue-500" />}
                      value={r.meetings_booked_today}
                      label="meetings"
                    />
                    <RepStat
                      icon={<Mail size={11} className="text-amber-500" />}
                      value={r.emails_sent_today}
                      label="emails"
                    />
                  </div>

                  {/* Progress */}
                  <div className="w-32 shrink-0">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          r.calls_completion_pct >= 100
                            ? "bg-emerald-500"
                            : r.calls_completion_pct >= 50
                            ? "bg-[#6C2BD9]"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(r.calls_completion_pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 text-center">
                      {r.calls_completion_pct}% du target
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 bg-zinc-50 rounded-xl p-5 border border-zinc-200">
        <p className="text-[12px] font-semibold text-zinc-900 mb-2">💡 Comment ça marche</p>
        <ul className="text-[11px] text-zinc-600 space-y-1">
          <li>▸ Données mises à jour automatiquement chaque 30 secondes</li>
          <li>▸ Les calls/emails/meetings sont enregistrés via <code className="bg-white px-1 rounded">/api/activities/log</code></li>
          <li>▸ Cible par défaut : 300 calls/jour par rep (modifiable dans table <code className="bg-white px-1 rounded">sales_daily_targets</code>)</li>
          <li>▸ Conversion attendue : 1-2% calls → meetings, 25% meetings → clients</li>
        </ul>
      </div>
    </div>
  );
}

function BigKPI({
  icon,
  value,
  label,
  subtitle,
  progressPct,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  subtitle?: string;
  progressPct?: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-[36px] font-bold tabular-nums leading-none">{value.toLocaleString()}</p>
      {subtitle && <p className="text-[11px] text-zinc-500 mt-2">{subtitle}</p>}
      {progressPct !== undefined && (
        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#A78BFA] to-[#6C2BD9] transition-all"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SmallKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-[20px] font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}

function RepStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className="text-[14px] font-bold text-zinc-900 tabular-nums">{value}</p>
      </div>
      <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}
