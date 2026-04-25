"use client";
import { useEffect, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Users,
  Target,
  Brain,
  Loader2,
  Zap,
  Calendar,
} from "lucide-react";

interface AIInsight {
  category: string;
  type: "warning" | "info" | "success" | "opportunity";
  title: string;
  description: string;
  action?: { label: string; href: string };
  metric?: { label: string; value: string; trend?: "up" | "down" };
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    // In production: fetch from /api/client/insights
    setTimeout(() => {
      setInsights([
        {
          category: "Salary Intelligence",
          type: "warning",
          title: "Your salary range is 8% below market for Senior SWE in Toronto",
          description:
            "Top candidates are expecting $130-150K. Your current max is $120K. We've sourced 47 candidates matching your criteria, but only 12% confirmed interest at your range. Increasing max to $135K would unlock ~25% more interested candidates.",
          metric: { label: "Lost candidates due to salary", value: "23", trend: "up" },
          action: { label: "Update salary range", href: "/mandats" },
        },
        {
          category: "Response Rate",
          type: "success",
          title: "Your backend roles are getting 35% above-average response rates",
          description:
            "Our AI-generated outreach for your backend positions resonates particularly well. The mention of your microservices migration is driving strong interest. Consider similar messaging for adjacent roles.",
          metric: { label: "Response rate this month", value: "42%", trend: "up" },
        },
        {
          category: "Time-to-Hire",
          type: "info",
          title: "You're hiring 53% faster than industry average",
          description:
            "Industry average for senior tech roles is 47 days. You're at 22 days. This is largely due to fast feedback (avg 18h) and decisive interview process. Keep this momentum.",
          metric: { label: "Avg time-to-hire", value: "22 days" },
        },
        {
          category: "Pipeline Health",
          type: "opportunity",
          title: "Sarah Tremblay needs a decision",
          description:
            "Sarah has been waiting for interview slot for 5 days. Top candidates typically take other offers within 7-10 days. Schedule before Wednesday or risk losing her.",
          action: { label: "Schedule interview", href: "/candidats" },
          metric: { label: "Days waiting", value: "5", trend: "up" },
        },
        {
          category: "Source Performance",
          type: "info",
          title: "Apollo + LinkedIn combo outperforming",
          description:
            "Candidates from Apollo + LinkedIn dual-source are 47% more likely to convert vs single-source. We're prioritizing this approach for your roles.",
          metric: { label: "Conversion rate", value: "47%", trend: "up" },
        },
        {
          category: "Market Trends",
          type: "info",
          title: "Backend talent supply increased 18% this month",
          description:
            "More Q2 layoffs at FAANG = more senior backend candidates open to opportunities. Good time to push aggressive sourcing or open additional roles.",
          metric: { label: "New candidates available", value: "+18%", trend: "up" },
          action: { label: "Open new role", href: "/mandats/nouveau" },
        },
        {
          category: "Recruiter Feedback",
          type: "warning",
          title: "Candidates frequently ask about remote work policy",
          description:
            "60% of qualified candidates ask about remote work flexibility before agreeing to interview. Adding this to your role description would speed up qualification by ~30%.",
          action: { label: "Update role description", href: "/mandats" },
        },
        {
          category: "Cost Analysis",
          type: "success",
          title: "You're saving $7,800/month vs internal recruiter",
          description:
            "Based on $90K avg salary + 25% benefits + $5K tools for an internal recruiter ($117,500/yr). At your current pace, projected annual savings: $93,600.",
          metric: { label: "Monthly savings", value: "$7,800" },
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">AI Insights</h1>
            <p className="text-[13px] text-zinc-500">
              Powered by Claude · Updated every 24h based on your hiring data
            </p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Salary", "Pipeline", "Response Rate", "Market", "Cost"].map((tag, i) => (
          <button
            key={tag}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition ${
              i === 0
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Insights grid */}
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-200 p-6 text-center">
        <Sparkles size={24} className="text-[#2445EB] mx-auto mb-2" />
        <p className="text-[14px] font-bold text-zinc-900 mb-1">
          Insights improve as we hire more for you
        </p>
        <p className="text-[12px] text-zinc-500 max-w-md mx-auto">
          Claude analyzes every interaction, hire, and rejection to give you sharper
          recommendations over time. Stay engaged for best results.
        </p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = {
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: <AlertCircle size={16} className="text-amber-600" /> },
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: <Brain size={16} className="text-blue-600" /> },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={16} className="text-emerald-600" /> },
    opportunity: { bg: "bg-purple-50", border: "border-purple-200", icon: <Zap size={16} className="text-purple-600" /> },
  }[insight.type];

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {insight.category}
            </p>
            {insight.metric && (
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1 bg-white rounded-full px-2 py-0.5">
                {insight.metric.trend === "up" && <TrendingUp size={10} className="text-emerald-600" />}
                {insight.metric.trend === "down" && <TrendingDown size={10} className="text-red-600" />}
                {insight.metric.label}: {insight.metric.value}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-bold text-zinc-900 mb-1.5">{insight.title}</h3>
          <p className="text-[13px] text-zinc-600 leading-relaxed">{insight.description}</p>
          {insight.action && (
            <a
              href={insight.action.href}
              className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-[#2445EB] font-semibold hover:underline"
            >
              {insight.action.label} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
