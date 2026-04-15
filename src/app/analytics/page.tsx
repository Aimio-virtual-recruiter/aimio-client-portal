"use client";
import { useI18n } from "@/i18n/provider";
import { TrendingUp, Target, Clock, BarChart3, ArrowUp, ArrowDown, Minus, Shield, Zap, DollarSign, Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AnalyticsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2332]">{t("nav.analytics")}</h1>
        <p className="text-gray-400 text-sm mt-1">Intelligence de marche et performance de vos mandats</p>
      </div>

      {/* Salary Benchmark */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6C2BD9]/10 to-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
            <DollarSign size={16} className="text-[#6C2BD9]" />
          </div>
          <h2 className="font-semibold text-[#1a2332] text-sm">Benchmark salarial en temps reel</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Estimateur senior",
              yourOffer: "85-100K$",
              marketMedian: "92K$",
              marketRange: "80-115K$",
              percentile: 45,
              trend: "up",
              trendValue: "+8%",
              status: "warning"
            },
            {
              title: "Charge de projet",
              yourOffer: "90-110K$",
              marketMedian: "98K$",
              marketRange: "85-125K$",
              percentile: 55,
              trend: "up",
              trendValue: "+5%",
              status: "good"
            },
            {
              title: "Controleur financier",
              yourOffer: "95-115K$",
              marketMedian: "105K$",
              marketRange: "90-130K$",
              percentile: 50,
              trend: "stable",
              trendValue: "+2%",
              status: "good"
            }
          ].map((item) => (
            <div key={item.title} className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1a2332]">{item.title}</h3>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  item.trend === "up" ? "text-emerald-600" : item.trend === "down" ? "text-red-500" : "text-gray-400"
                }`}>
                  {item.trend === "up" ? <ArrowUp size={12} /> : item.trend === "down" ? <ArrowDown size={12} /> : <Minus size={12} />}
                  {item.trendValue} / 12 mois
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Votre offre</span>
                  <span className="font-semibold text-[#1a2332]">{item.yourOffer}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Mediane du marche</span>
                  <span className="font-semibold text-[#6C2BD9]">{item.marketMedian}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Fourchette marche</span>
                  <span className="font-medium text-gray-600">{item.marketRange}</span>
                </div>
              </div>

              {/* Percentile Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Bas du marche</span>
                  <span>Haut du marche</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full relative">
                  <div className="absolute h-full bg-gradient-to-r from-red-300 via-yellow-300 to-emerald-300 rounded-full w-full opacity-30" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#6C2BD9] rounded-full border-2 border-white shadow-sm"
                    style={{ left: `${item.percentile}%` }}
                  />
                </div>
                <p className="text-[10px] text-center mt-1.5">
                  <span className={`font-semibold ${item.status === "good" ? "text-emerald-600" : "text-amber-600"}`}>
                    {item.status === "good" ? "Competitif" : "Sous le marche"}
                  </span>
                  <span className="text-gray-400"> — Percentile {item.percentile}e</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitiveness Score + AI Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Competitiveness Score */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-[#1a2332] text-sm">Score de competitivite de vos offres</h2>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${72 * 3.27} ${326.73 - 72 * 3.27}`} />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6C2BD9" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#1a2332]">72</span>
                <span className="text-[10px] text-gray-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Salaire", score: 65, status: "warning" },
              { label: "Flexibilite (hybride/remote)", score: 70, status: "warning" },
              { label: "Avantages sociaux", score: 80, status: "good" },
              { label: "Reputation employeur", score: 85, status: "good" },
              { label: "Vitesse du processus", score: 60, status: "warning" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-44 shrink-0">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.status === "good" ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-8 text-right ${item.status === "good" ? "text-emerald-600" : "text-amber-600"}`}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6C2BD9]/10 to-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-[#6C2BD9]" />
            </div>
            <h2 className="font-semibold text-[#1a2332] text-sm">Prediction IA — Temps de recrutement</h2>
          </div>

          <div className="space-y-5">
            {[
              { title: "Estimateur senior", days: "18-25", confidence: 82, status: "On track", candidates: 5 },
              { title: "Charge de projet", days: "22-30", confidence: 74, status: "Attention requise", candidates: 3 },
              { title: "Controleur financier", days: "25-35", confidence: 68, status: "Debut de recherche", candidates: 2 },
            ].map((item) => (
              <div key={item.title} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1a2332]">{item.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                    item.confidence >= 80 ? "bg-emerald-50 text-emerald-700" :
                    item.confidence >= 70 ? "bg-amber-50 text-amber-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock size={11} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Estimation</span>
                    </div>
                    <p className="text-sm font-bold text-[#1a2332]">{item.days} jours</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Target size={11} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Confiance</span>
                    </div>
                    <p className="text-sm font-bold text-[#6C2BD9]">{item.confidence}%</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Users size={11} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Candidats</span>
                    </div>
                    <p className="text-sm font-bold text-[#1a2332]">{item.candidates} livres</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-[#F8F7FF] rounded-xl p-3 border border-[#6C2BD9]/5">
            <p className="text-[11px] text-gray-500">
              <Zap size={11} className="inline text-[#6C2BD9] mr-1" />
              Predictions basees sur 44,821 candidats en base et les tendances du marche quebecois.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Analytics */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <h2 className="font-semibold text-[#1a2332] text-sm">Pipeline de recrutement — Tous les mandats</h2>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {[
            { label: "Sources", value: 741, color: "from-gray-200 to-gray-300", textColor: "text-gray-600" },
            { label: "Approches", value: 144, color: "from-[#6C2BD9]/20 to-[#6C2BD9]/30", textColor: "text-[#6C2BD9]" },
            { label: "Reponses", value: 48, color: "from-[#6C2BD9]/30 to-[#6C2BD9]/40", textColor: "text-[#6C2BD9]" },
            { label: "Qualifies", value: 24, color: "from-[#6C2BD9]/40 to-[#6C2BD9]/60", textColor: "text-[#6C2BD9]" },
            { label: "Livres", value: 15, color: "from-[#6C2BD9]/60 to-[#6C2BD9]/80", textColor: "text-white" },
            { label: "Entrevues", value: 6, color: "from-[#6C2BD9]/80 to-[#6C2BD9]", textColor: "text-white" },
            { label: "Embauches", value: 1, color: "from-emerald-500 to-emerald-600", textColor: "text-white" },
          ].map((step, i) => (
            <div key={step.label} className="text-center">
              <div
                className={`bg-gradient-to-b ${step.color} rounded-xl flex items-center justify-center mx-auto mb-2`}
                style={{ height: `${Math.max(40, (step.value / 741) * 200)}px`, width: "100%" }}
              >
                <span className={`text-sm font-bold ${step.textColor}`}>{step.value}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">{step.label}</p>
              {i < 6 && (
                <p className="text-[9px] text-gray-300 mt-0.5">
                  {i === 0 ? "" : `${((step.value / [741, 144, 48, 24, 15, 6][i-1]) * 100).toFixed(0)}%`}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-lg font-bold text-[#6C2BD9]">19.4%</p>
            <p className="text-[10px] text-gray-400">Taux approche → reponse</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#6C2BD9]">33.3%</p>
            <p className="text-[10px] text-gray-400">Taux reponse → qualification</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">6.7%</p>
            <p className="text-[10px] text-gray-400">Taux livre → embauche</p>
          </div>
        </div>
      </div>

      {/* Comparison with similar companies */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-amber-600" />
          </div>
          <h2 className="font-semibold text-[#1a2332] text-sm">Comparaison avec les entreprises similaires</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Salaire moyen offert", you: "93K$", market: "97K$", diff: "-4%", status: "warning" },
            { label: "Temps moyen pour combler", you: "22 jours", market: "35 jours", diff: "-37%", status: "great" },
            { label: "Candidats par mandat", you: "8.3", market: "4.2", diff: "+98%", status: "great" },
            { label: "Taux de retention 1 an", you: "N/A", market: "87%", diff: "", status: "neutral" },
          ].map((item) => (
            <div key={item.label} className="border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">{item.label}</p>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-[10px] text-gray-400">Vous</p>
                  <p className="text-lg font-bold text-[#1a2332]">{item.you}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Marche</p>
                  <p className="text-sm text-gray-500">{item.market}</p>
                </div>
              </div>
              {item.diff && (
                <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${
                  item.status === "great" ? "bg-emerald-50 text-emerald-700" :
                  item.status === "warning" ? "bg-amber-50 text-amber-700" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {item.status === "great" ? <CheckCircle2 size={11} /> : item.status === "warning" ? <AlertTriangle size={11} /> : null}
                  {item.diff} vs marche
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
