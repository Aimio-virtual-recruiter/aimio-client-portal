"use client";
import { mockReports } from "@/lib/mock-data";

export default function RapportsPage() {
  const report = mockReports[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2332]">Rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi hebdomadaire de votre recrutement</p>
      </div>

      {/* Current Week Report */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[#1a2332]">Semaine du {report.week}</h2>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            Dernier rapport
          </span>
        </div>

        {/* Funnel */}
        <div className="space-y-4 mb-8">
          {[
            { label: "Profils sourcés par l'IA", value: report.profiles_sourced, color: "bg-gray-200", width: "100%" },
            { label: "Candidats approchés", value: report.candidates_approached, color: "bg-[#6C2BD9]/30", width: `${(report.candidates_approached / report.profiles_sourced) * 100}%` },
            { label: "Réponses reçues", value: report.responses_received, color: "bg-[#6C2BD9]/50", width: `${(report.responses_received / report.profiles_sourced) * 100}%` },
            { label: "Candidats qualifiés", value: report.candidates_qualified, color: "bg-[#6C2BD9]/70", width: `${(report.candidates_qualified / report.profiles_sourced) * 100}%` },
            { label: "Candidats livrés", value: report.candidates_delivered, color: "bg-[#6C2BD9]", width: `${(report.candidates_delivered / report.profiles_sourced) * 100}%` },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-48 shrink-0">{step.label}</span>
              <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-lg flex items-center px-3 transition-all duration-700`}
                  style={{ width: step.width }}
                >
                  <span className="text-xs font-bold text-white drop-shadow">{step.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#F8F7FF] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#6C2BD9]">
              {((report.responses_received / report.candidates_approached) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">Taux de réponse</p>
          </div>
          <div className="bg-[#F8F7FF] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#6C2BD9]">
              {((report.candidates_qualified / report.responses_received) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">Taux de qualification</p>
          </div>
          <div className="bg-[#F8F7FF] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#6C2BD9]">
              {report.market_salary_median.toLocaleString()}$
            </p>
            <p className="text-xs text-gray-500">Salaire médian du marché</p>
          </div>
        </div>

        {/* Market Intelligence */}
        <div className="mb-6">
          <h3 className="font-semibold text-[#1a2332] mb-3">📊 Intelligence de marché</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">{report.market_availability}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="font-semibold text-[#1a2332] mb-3">💡 Recommandations</h3>
          <ul className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="text-[#6C2BD9] shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
