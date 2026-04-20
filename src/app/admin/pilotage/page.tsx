"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  Target,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Recruiter {
  id: string;
  name: string;
  title: string;
  specialty: string | null;
  photo_url: string | null;
}

interface Placement {
  id: string;
  recruiter_id: string;
  placement_date: string;
  salary_placed: number;
  fee_amount: number | null;
}

interface Mandate {
  id: string;
  title: string;
  status: string;
  company_id: string;
  salary_min: number | null;
  salary_max: number | null;
  candidates_delivered: number | null;
  created_at: string;
}

const MONTHLY_TARGET_MIN = 25;
const MONTHLY_TARGET_MAX = 30;
const RECRUITER_FLOOR = 2;

export default function PilotagePage() {
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [placementsThisMonth, setPlacementsThisMonth] = useState<Placement[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const [recruitersRes, placementsRes, mandatesRes] = await Promise.all([
        supabase.from("recruiters").select("id, name, title, specialty, photo_url").eq("is_active", true),
        supabase
          .from("placements")
          .select("id, recruiter_id, placement_date, salary_placed, fee_amount")
          .gte("placement_date", firstOfMonth),
        supabase.from("mandates").select("*").in("status", ["active", "pending_review", "paused"]),
      ]);

      setRecruiters(recruitersRes.data ?? []);
      setPlacementsThisMonth(placementsRes.data ?? []);
      setMandates(mandatesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-zinc-300" size={20} />
      </div>
    );
  }

  const totalPlacements = placementsThisMonth.length;
  const progressPct = Math.min(
    (totalPlacements / MONTHLY_TARGET_MIN) * 100,
    100
  );

  const totalFees = placementsThisMonth.reduce(
    (sum, p) => sum + (p.fee_amount ?? 0),
    0
  );

  const activeMandates = mandates.filter((m) => m.status === "active").length;
  const pendingMandates = mandates.filter(
    (m) => m.status === "pending_review"
  ).length;
  const pausedMandates = mandates.filter((m) => m.status === "paused").length;

  // Placements per recruiter this month
  const placementsByRecruiter = recruiters
    .map((r) => {
      const count = placementsThisMonth.filter(
        (p) => p.recruiter_id === r.id
      ).length;
      const fees = placementsThisMonth
        .filter((p) => p.recruiter_id === r.id)
        .reduce((sum, p) => sum + (p.fee_amount ?? 0), 0);
      return { ...r, placements: count, fees };
    })
    .sort((a, b) => b.placements - a.placements);

  // Projection (based on current pace)
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const daysSoFar = new Date().getDate();
  const projectedMonthly =
    daysSoFar > 0 ? Math.round((totalPlacements / daysSoFar) * daysInMonth) : 0;

  const targetHit = totalPlacements >= MONTHLY_TARGET_MIN;
  const onTrack = projectedMonthly >= MONTHLY_TARGET_MIN;

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
          Pilotage permanent
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Cible :{" "}
          <span className="font-semibold text-zinc-700">
            {MONTHLY_TARGET_MIN}-{MONTHLY_TARGET_MAX} placements/mois
          </span>{" "}
          · Floor :{" "}
          <span className="font-semibold text-zinc-700">
            {RECRUITER_FLOOR}/recruteur
          </span>
        </p>
      </div>

      {/* Main KPI — Placements ce mois */}
      <div className="bg-zinc-900 text-white rounded-2xl p-7 mb-5 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#6C2BD9]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">
              Placements ce mois-ci
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-[64px] font-bold leading-none tabular-nums">
                {totalPlacements}
              </p>
              <p className="text-[16px] text-zinc-500">
                / {MONTHLY_TARGET_MIN}-{MONTHLY_TARGET_MAX}
              </p>
            </div>
            <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A78BFA] to-[#6C2BD9] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">
              Projection fin de mois
            </p>
            <p className="text-[40px] font-bold tabular-nums leading-none">
              {projectedMonthly}
            </p>
            <p className="text-[11px] mt-2">
              {onTrack ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Sur la bonne voie
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle size={11} /> En dessous de la cible
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">
              Fees générés ce mois
            </p>
            <p className="text-[40px] font-bold tabular-nums leading-none">
              ${totalFees.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              Moyenne ${totalPlacements > 0 ? Math.round(totalFees / totalPlacements).toLocaleString() : 0}/placement
            </p>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Mandats actifs",
            value: activeMandates,
            icon: Briefcase,
            color: "#6C2BD9",
          },
          {
            label: "En attente review",
            value: pendingMandates,
            icon: Clock,
            color: "#6C2BD9",
          },
          {
            label: "Mandats en pause",
            value: pausedMandates,
            icon: AlertCircle,
            color: "#71717a",
          },
          {
            label: "Recruteurs actifs",
            value: recruiters.length,
            icon: Users,
            color: "#10B981",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} style={{ color: kpi.color }} strokeWidth={1.5} />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: kpi.color }}
                />
              </div>
              <p className="text-[24px] font-bold text-zinc-900 tabular-nums">
                {kpi.value}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-1">
                {kpi.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Performance par recruteur */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-card mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-semibold text-zinc-900">
            Performance par recruteur (ce mois-ci)
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Floor = {RECRUITER_FLOOR}/mois · Top performers à droite
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {placementsByRecruiter.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-zinc-400">
              Aucun recruteur dans la base. Exécute le SQL MEGA_BATCH_SCHEMA pour initialiser l&apos;équipe.
            </div>
          ) : (
            placementsByRecruiter.map((r) => {
              const belowFloor = r.placements < RECRUITER_FLOOR;
              const topPerformer = r.placements >= 5;
              return (
                <div
                  key={r.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-zinc-600">
                      {r.name
                        .split(" ")
                        .map((n) => n[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">
                        {r.name}
                      </p>
                      {topPerformer && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          🔥 TOP
                        </span>
                      )}
                      {belowFloor && r.title !== "Président & Fondateur" && !r.title.includes("Marketing") && !r.title.includes("Ventes") && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          ⚠ Sous la barre
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">{r.title}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[18px] font-bold text-zinc-900 tabular-nums">
                        {r.placements}
                      </p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-wider">
                        Placements
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-emerald-600 tabular-nums">
                        ${r.fees.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-wider">
                        Fees
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pipeline mandats */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-zinc-900">
              Pipeline de mandats
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Valeur potentielle basée sur salaire max × 18% (STANDARD)
            </p>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-bold text-zinc-900">
              $
              {mandates
                .filter((m) => m.status === "active")
                .reduce(
                  (sum, m) => sum + (m.salary_max ?? 0) * 0.18,
                  0
                )
                .toLocaleString()}
            </p>
            <p className="text-[9px] text-zinc-400 uppercase tracking-wider">
              Pipeline value
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {mandates.slice(0, 10).map((m) => (
            <div
              key={m.id}
              className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-zinc-900 truncate">
                  {m.title}
                </p>
                <p className="text-[11px] text-zinc-400">
                  $
                  {m.salary_min?.toLocaleString() ?? "?"} - $
                  {m.salary_max?.toLocaleString() ?? "?"} ·{" "}
                  {m.candidates_delivered ?? 0} candidats livrés
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded ${
                    m.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : m.status === "pending_review"
                      ? "bg-[#6C2BD9]/10 text-[#6C2BD9]"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {m.status === "active"
                    ? "Actif"
                    : m.status === "pending_review"
                    ? "Review"
                    : "Pause"}
                </span>
                <p className="text-[12px] font-semibold text-emerald-600 tabular-nums">
                  $
                  {((m.salary_max ?? 0) * 0.18).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 bg-zinc-50 rounded-xl p-5 border border-zinc-200">
        <div className="flex items-start gap-3">
          <Target size={16} className="text-[#6C2BD9] mt-0.5 shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-zinc-900 mb-1">
              💡 Comment utiliser ce dashboard
            </p>
            <ul className="text-[11px] text-zinc-600 space-y-0.5">
              <li>▸ Review hebdo des recruteurs sous la barre {RECRUITER_FLOOR}/mois</li>
              <li>▸ Si projection &lt; {MONTHLY_TARGET_MIN} → focus sales pipeline pour générer plus de mandats</li>
              <li>▸ Pipeline value = indicatif, basé sur salaire max × 18%</li>
              <li>▸ Placements enregistrés manuellement dans la table `placements` Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
