"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMandates, getAllCandidates, getReports, type Mandate, type Candidate, type Report } from "@/lib/supabase";
import { useI18n } from "@/i18n/provider";
import { Briefcase, Users, CheckCircle2, Calendar, MapPin, DollarSign, ArrowRight, TrendingUp, Search, MessageSquare, UserCheck, Send, Sparkles, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { t } = useI18n();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, c, r] = await Promise.all([getMandates(), getAllCandidates(), getReports()]);
        setMandates(m);
        setCandidates(c);
        setReports(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  const report = reports[0];
  const interestedCount = candidates.filter(c => c.status === 'interested').length;
  const interviewCount = candidates.filter(c => c.status === 'interview_scheduled').length;

  const stats = [
    { label: t("dashboard.activeMandates"), value: String(mandates.filter(m => m.status === 'active').length), icon: Briefcase, accent: "#6C2BD9" },
    { label: t("dashboard.candidatesDelivered"), value: String(candidates.length), icon: Users, accent: "#10B981" },
    { label: t("dashboard.interested"), value: String(interestedCount), icon: CheckCircle2, accent: "#3B82F6" },
    { label: t("dashboard.interviewsScheduled"), value: String(interviewCount), icon: Calendar, accent: "#F59E0B" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{t("dashboard.greeting", { name: "Terri" })}</h1>
        <p className="text-zinc-400 text-[13px] mt-0.5">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card transition-premium hover:shadow-card-hover">
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} style={{ color: stat.accent }} strokeWidth={1.5} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.accent }} />
              </div>
              <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{stat.value}</p>
              <p className="label mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Recent Candidates */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-zinc-900">{t("dashboard.recentCandidates")}</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {candidates.slice(0, 4).map((candidate) => (
              <Link
                key={candidate.id}
                href={`/candidats/${candidate.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-premium"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center ring-2 ring-white">
                    <span className="text-[10px] font-semibold text-zinc-600">
                      {candidate.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{candidate.name}</p>
                    <p className="text-[11px] text-zinc-400">{candidate.current_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-zinc-600 tabular-nums">{candidate.score}</span>
                  {candidate.status === "new" && (
                    <div className="w-1.5 h-1.5 bg-[#6C2BD9] rounded-full" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Mandates */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-zinc-900">{t("dashboard.activeMandatesList")}</h2>
            <Link href="/mandats" className="label text-[#6C2BD9] hover:text-[#5521B5] flex items-center gap-1 transition-premium">
              {t("dashboard.viewAllMandates")} <ArrowRight size={10} />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {mandates.map((mandate) => (
              <Link
                key={mandate.id}
                href={`/mandats/${mandate.id}`}
                className="block px-5 py-3 hover:bg-zinc-50 transition-premium"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-medium text-zinc-900">{mandate.title}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[11px] text-zinc-500">{t("mandates.active")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {mandate.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={11} /> {mandate.salary_min ? `${(mandate.salary_min / 1000).toFixed(0)}-${(mandate.salary_max / 1000).toFixed(0)}K$` : 'TBD'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* AI Feedback Summary */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={15} className="text-[#6C2BD9]" />
          <h2 className="text-[13px] font-semibold text-zinc-900">{t("dashboard.feedbackTitle")}</h2>
          <span className="label ml-auto">{t("dashboard.feedbackSubtitle")}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg p-4 bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <p className="label text-emerald-700">{t("dashboard.interestedCount", { count: String(interestedCount) })}</p>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("dashboard.interestedSummary") }} />
          </div>
          <div className="rounded-lg p-4 bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <p className="label text-red-600">{t("dashboard.notInterestedCount", { count: String(candidates.filter(c => c.status === 'not_interested').length) })}</p>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("dashboard.notInterestedSummary") }} />
          </div>
          <div className="rounded-lg p-4 bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <p className="label text-blue-700">{t("dashboard.marketTrend")}</p>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("dashboard.marketTrendSummary") }} />
          </div>
        </div>

        <div className="bg-[#6C2BD9]/[0.03] rounded-lg p-4 border border-[#6C2BD9]/10">
          <p className="label text-[#6C2BD9] mb-1.5">{t("dashboard.aiRecommendation")}</p>
          <p className="text-[13px] text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("dashboard.aiRecommendationText") }} />
        </div>
      </div>

      {/* Weekly Summary */}
      {report && (
        <div className="bg-zinc-900 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} />
            <h3 className="text-[13px] font-semibold">{t("dashboard.weeklySummary", { week: report.week })}</h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { value: report.profiles_sourced, label: t("dashboard.profilesSourced"), icon: Search },
              { value: report.candidates_approached, label: t("dashboard.candidatesApproached"), icon: Send },
              { value: report.responses_received, label: t("dashboard.responsesReceived"), icon: MessageSquare },
              { value: report.candidates_qualified, label: t("dashboard.qualified"), icon: UserCheck },
              { value: report.candidates_delivered, label: t("dashboard.deliveredThisWeek"), icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <stat.icon size={12} className="text-zinc-500" />
                  <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
                </div>
                <p className="text-[10px] text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <Link href="/rapports" className="inline-flex items-center gap-1 mt-4 text-[11px] text-zinc-500 hover:text-zinc-300 transition-premium">
            {t("dashboard.viewFullReport")} <ArrowRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}
