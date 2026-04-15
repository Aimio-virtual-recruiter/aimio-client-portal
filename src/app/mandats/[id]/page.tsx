"use client";
import Link from "next/link";
import { mockMandates, mockCandidates } from "@/lib/mock-data";

export default function MandateDetailPage() {
  const mandate = mockMandates[0];
  const candidates = mockCandidates;

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/mandats" className="text-sm text-[#6C2BD9] hover:underline mb-2 inline-block">
          ← Retour aux mandats
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2332]">{mandate.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {mandate.department} • {mandate.location} • {mandate.work_mode}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
            En recherche
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#6C2BD9]">{candidates.length}</p>
          <p className="text-xs text-gray-500">Candidats livrés</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {candidates.filter((c) => c.status === "interested").length}
          </p>
          <p className="text-xs text-gray-500">Intéressés</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {candidates.filter((c) => c.status === "new").length}
          </p>
          <p className="text-xs text-gray-500">Nouveaux</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">Score moyen</p>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-semibold text-[#1a2332]">Candidats ({candidates.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {candidates
            .sort((a, b) => b.score - a.score)
            .map((candidate) => (
              <Link
                key={candidate.id}
                href={`/candidats/${candidate.id}`}
                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#6C2BD9]/10 flex items-center justify-center">
                    <span className="font-semibold text-[#6C2BD9]">
                      {candidate.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#1a2332]">{candidate.name}</p>
                    <p className="text-sm text-gray-500">
                      {candidate.current_title} chez {candidate.current_company}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>📍 {candidate.location}</span>
                      <span>⏱️ {candidate.experience_years} ans</span>
                      <span>💰 {candidate.salary_expectations}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Score */}
                  <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                    candidate.score >= 9 ? "bg-emerald-50 text-emerald-700" :
                    candidate.score >= 8 ? "bg-blue-50 text-blue-700" :
                    candidate.score >= 7 ? "bg-purple-50 text-purple-700" :
                    "bg-gray-50 text-gray-600"
                  }`}>
                    {candidate.score}/10
                  </div>

                  {/* Status */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    candidate.status === "new" ? "bg-[#6C2BD9]/10 text-[#6C2BD9]" :
                    candidate.status === "interested" ? "bg-emerald-50 text-emerald-700" :
                    candidate.status === "not_interested" ? "bg-red-50 text-red-600" :
                    candidate.status === "interview_scheduled" ? "bg-blue-50 text-blue-700" :
                    "bg-gray-50 text-gray-600"
                  }`}>
                    {candidate.status === "new" ? "Nouveau" :
                     candidate.status === "interested" ? "Intéressé" :
                     candidate.status === "not_interested" ? "Pas intéressé" :
                     candidate.status === "interview_scheduled" ? "Entrevue" :
                     candidate.status === "viewed" ? "Vu" : candidate.status}
                  </span>

                  <span className="text-gray-300">→</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
