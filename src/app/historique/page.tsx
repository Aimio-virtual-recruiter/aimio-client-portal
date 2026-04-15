"use client";
import { CheckCircle2, Clock, DollarSign, Users, TrendingUp, Award } from "lucide-react";

const pastPlacements = [
  { id: 1, title: "Directeur de projet", candidate: "Philippe Gagnon", salary: 105000, date: "Mars 2026", status: "active", retention: "En poste", daysToFill: 18 },
  { id: 2, title: "Comptable senior", candidate: "Isabelle Roy", salary: 78000, date: "Fevrier 2026", status: "active", retention: "En poste", daysToFill: 22 },
  { id: 3, title: "Surintendant", candidate: "Martin Bouchard", salary: 95000, date: "Janvier 2026", status: "active", retention: "En poste", daysToFill: 15 },
  { id: 4, title: "Coordonnateur de chantier", candidate: "Alexandre Morin", salary: 72000, date: "Decembre 2025", status: "active", retention: "En poste", daysToFill: 25 },
  { id: 5, title: "Estimateur", candidate: "Julie Tremblay", salary: 82000, date: "Novembre 2025", status: "left", retention: "Parti apres 4 mois", daysToFill: 20 },
];

export default function HistoriquePage() {
  const totalPlacements = pastPlacements.length;
  const activeCount = pastPlacements.filter(p => p.status === "active").length;
  const retentionRate = ((activeCount / totalPlacements) * 100).toFixed(0);
  const avgDaysToFill = (pastPlacements.reduce((sum, p) => sum + p.daysToFill, 0) / totalPlacements).toFixed(0);
  const totalSaved = pastPlacements.reduce((sum, p) => sum + (p.salary * 0.20), 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2332]">Historique des placements</h1>
        <p className="text-gray-400 text-sm mt-1">Tous vos placements effectues avec Aimio</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Placements totaux", value: totalPlacements.toString(), icon: Users, color: "bg-[#6C2BD9]/10 text-[#6C2BD9]" },
          { label: "Taux de retention", value: `${retentionRate}%`, icon: Award, color: "bg-emerald-50 text-emerald-600" },
          { label: "Delai moyen", value: `${avgDaysToFill}j`, icon: Clock, color: "bg-blue-50 text-blue-600" },
          { label: "Economies vs agence trad.", value: `${(totalSaved / 1000).toFixed(0)}K$`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100/80 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-[#1a2332]">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ROI Card */}
      <div className="bg-gradient-to-r from-[#6C2BD9] via-[#7C3AED] to-[#8B5CF6] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} />
            <h2 className="font-semibold text-sm">Votre retour sur investissement avec Aimio</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[11px] text-white/60">Cout avec agence traditionnelle (20%)</p>
              <p className="text-xl font-bold">{(totalSaved / 1000).toFixed(0)},000$</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60">Cout avec Aimio Recruteur IA</p>
              <p className="text-xl font-bold">14,995$</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60">Vos economies</p>
              <p className="text-xl font-bold text-emerald-300">{((totalSaved - 14995) / 1000).toFixed(0)},000$</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placement History Table */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h2 className="font-semibold text-[#1a2332] text-sm">Tous les placements</h2>
        </div>
        <div className="divide-y divide-gray-50/80">
          {pastPlacements.map((placement) => (
            <div key={placement.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  placement.status === "active" ? "bg-emerald-50" : "bg-red-50"
                }`}>
                  <CheckCircle2 size={16} className={placement.status === "active" ? "text-emerald-600" : "text-red-400"} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">{placement.title}</p>
                  <p className="text-xs text-gray-400">{placement.candidate} — {placement.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Salaire</p>
                  <p className="text-sm font-semibold text-[#1a2332]">{(placement.salary / 1000).toFixed(0)}K$</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Delai</p>
                  <p className="text-sm font-semibold text-[#6C2BD9]">{placement.daysToFill}j</p>
                </div>
                <div className="text-right w-28">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                    placement.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {placement.retention}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
