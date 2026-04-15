"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ScoreBar, ScoreCircle } from "@/components/ScoreBar";
import { mockCandidates } from "@/lib/mock-data";
import { Sidebar } from "@/components/Sidebar";
import { useI18n } from "@/i18n/provider";
import { ArrowLeft, MapPin, Clock, GraduationCap, Globe, DollarSign, CalendarCheck, CheckCircle2, XCircle, MessageSquare, Briefcase, ChevronRight, Sparkles } from "lucide-react";

export default function CandidateDetailPage() {
  const params = useParams();
  const candidate = mockCandidates.find((c) => c.id === params.id) || mockCandidates[0];
  const [feedback, setFeedback] = useState(candidate.status);
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 max-w-5xl">
        {/* Back */}
        <Link href="/mandats/1" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-600 transition-premium mb-6">
          <ArrowLeft size={13} />
          {t("candidates.backToCandidates")}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6 mb-4">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
              <span className="text-[16px] font-semibold text-zinc-600">
                {candidate.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight">{candidate.name}</h1>
                {candidate.status === "new" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6C2BD9]/5 text-[10px] font-medium text-[#6C2BD9]">
                    <div className="w-1 h-1 bg-[#6C2BD9] rounded-full" />
                    {t("candidates.status.new")}
                  </span>
                )}
                {candidate.status === "interested" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-medium text-emerald-700">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    {t("candidates.status.interested")}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-zinc-500">{candidate.current_title} — {candidate.current_company}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-[11px] text-zinc-400"><MapPin size={11} />{candidate.location}</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Clock size={11} />{candidate.experience_years} ans</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Globe size={11} />{candidate.languages.join(", ")}</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400"><DollarSign size={11} />{candidate.salary_expectations}</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400"><CalendarCheck size={11} />{candidate.availability}</span>
              </div>
            </div>

            {/* Score Circle */}
            <ScoreCircle score={candidate.score} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left Column — 2/3 */}
          <div className="col-span-2 space-y-4">
            {/* Scoring Détaillé */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-[#6C2BD9]" />
                <h2 className="text-[13px] font-semibold text-zinc-900">{t("candidates.scoreTitle")}</h2>
              </div>
              <div className="space-y-3">
                {candidate.score_details.map((detail) => (
                  <ScoreBar key={detail.criteria} label={detail.criteria} score={detail.score} />
                ))}
              </div>
            </div>

            {/* Parcours */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Briefcase size={14} className="text-zinc-400" />
                <h2 className="text-[13px] font-semibold text-zinc-900">{t("candidates.careerTitle")}</h2>
              </div>
              <div className="space-y-0">
                {candidate.career_history.map((entry, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {/* Timeline */}
                    <div className="flex flex-col items-center pt-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-[#6C2BD9]" : "bg-zinc-200"}`} />
                      {i < candidate.career_history.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-100 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-5 ${i === 0 ? "" : ""}`}>
                      <p className={`text-[13px] font-medium ${i === 0 ? "text-zinc-900" : "text-zinc-600"}`}>{entry.title}</p>
                      <p className="text-[12px] text-zinc-400">{entry.company}</p>
                      <p className="text-[11px] text-zinc-300 mt-0.5">{entry.period}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap size={13} className="text-zinc-400" />
                  <p className="label">{t("candidates.education")}</p>
                </div>
                <p className="text-[13px] text-zinc-700 ml-[21px]">{candidate.education}</p>
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={14} className="text-zinc-400" />
                <h2 className="text-[13px] font-semibold text-zinc-900">{t("candidates.motivationTitle")}</h2>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                <p className="text-[13px] text-zinc-600 leading-relaxed italic">&ldquo;{candidate.motivation}&rdquo;</p>
              </div>
            </div>
          </div>

          {/* Right Column — 1/3 */}
          <div className="space-y-4">
            {/* Actions */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-5">
              <p className="label mb-4">{t("candidates.decision")}</p>

              <div className="space-y-2">
                <button
                  onClick={() => { setFeedback("interested"); setShowConfirm(true); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium transition-premium btn-press ${
                    feedback === "interested"
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-50 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 border border-zinc-100 hover:border-emerald-200"
                  }`}
                >
                  <CheckCircle2 size={15} />
                  {t("candidates.interested")}
                </button>

                <button
                  onClick={() => { setFeedback("not_interested"); setShowConfirm(true); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium transition-premium btn-press ${
                    feedback === "not_interested"
                      ? "bg-red-500 text-white"
                      : "bg-zinc-50 text-zinc-700 hover:bg-red-50 hover:text-red-600 border border-zinc-100 hover:border-red-200"
                  }`}
                >
                  <XCircle size={15} />
                  {t("candidates.notInterested")}
                </button>

                <button
                  onClick={() => { setFeedback("viewed"); setShowConfirm(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border border-zinc-100 transition-premium btn-press"
                >
                  <MessageSquare size={15} />
                  {t("candidates.needMoreInfo")}
                </button>
              </div>

              {showConfirm && feedback === "not_interested" && (
                <div className="mt-4 space-y-3">
                  <label className="label block">{t("candidates.reasonLabel")}</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("candidates.reasonPlaceholder")}
                    className="w-full p-3 border border-zinc-200 rounded-lg text-[12px] resize-none h-20 focus:border-[#6C2BD9] focus:ring-1 focus:ring-[#6C2BD9]/10 outline-none transition-premium text-zinc-700 placeholder:text-zinc-300"
                  />
                  <button className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-[12px] font-medium hover:bg-zinc-800 transition-premium btn-press">
                    {t("candidates.sendFeedback")}
                  </button>
                </div>
              )}

              {showConfirm && feedback === "interested" && (
                <div className="mt-4 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-emerald-700 leading-relaxed">
                      {t("candidates.interestConfirm", { name: candidate.name.split(" ")[0] })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Points forts */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <p className="label text-emerald-700">{t("candidates.strengths")}</p>
              </div>
              <ul className="space-y-2">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-zinc-600 leading-relaxed">
                    <ChevronRight size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Points d'attention */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <p className="label text-amber-700">{t("candidates.concerns")}</p>
              </div>
              <ul className="space-y-2">
                {candidate.concerns.map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-zinc-600 leading-relaxed">
                    <ChevronRight size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Note confidentialité */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t("candidates.confidentialNote")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
