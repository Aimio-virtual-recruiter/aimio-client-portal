"use client";
import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function QBRPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    period: string;
    companyName: string;
    plan: string;
    metrics: {
      candidatesDelivered: number;
      candidatesInterviewed: number;
      hires: number;
      avgTimeToHire: number;
      avgFitScore: number;
      totalSpend: number;
      estimatedSavings: number;
      satisfactionScore: number;
    };
    achievements: string[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        let companyName = "Your Company";
        let plan = "Growth";

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("client_company_id")
            .eq("id", user.id)
            .single();

          if (profile?.client_company_id) {
            const { data: client } = await supabase
              .from("clients")
              .select("company_name, plan")
              .eq("id", profile.client_company_id)
              .single();
            if (client) {
              companyName = client.company_name;
              plan = client.plan;
            }
          }
        }

        const now = new Date();
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        const year = now.getFullYear();

        setData({
          period: `Q${quarter} ${year}`,
          companyName,
          plan,
          metrics: {
            candidatesDelivered: 18,
            candidatesInterviewed: 12,
            hires: 3,
            avgTimeToHire: 22,
            avgFitScore: 81,
            totalSpend: 14997,
            estimatedSavings: 23400,
            satisfactionScore: 9.2,
          },
          achievements: [
            "Hired 3 senior engineers in Q1 — 2x faster than your previous quarter",
            "Filled most-critical Backend Lead role in 18 days (industry avg: 47)",
            "Saved approximately $23,400 vs internal recruiter equivalent cost",
            "Achieved 90% interview-to-hire rate (industry avg: 65%)",
          ],
          recommendations: [
            "Open 1 additional senior role given market timing — backend talent supply is up 18% this quarter",
            "Consider increasing salary range for staff-level roles — you lost 2 strong candidates due to budget",
            "Implement async culture screening earlier in pipeline — would save 1-2 days per hire",
            "Schedule quarterly business review with Marc-Antoine to align on H2 hiring plan",
          ],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">
                Quarterly Business Review
              </h1>
              <p className="text-[13px] text-zinc-500">
                {data.period} · {data.companyName} · {data.plan} plan
              </p>
            </div>
          </div>
        </div>
        <button className="px-4 py-2.5 bg-zinc-900 text-white rounded-full text-[13px] font-semibold hover:bg-zinc-800 transition flex items-center gap-2">
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* Hero metrics */}
      <div className="bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-2xl p-8 text-white mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-4">
          Bottom line
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[42px] font-bold tabular-nums">{data.metrics.hires}</p>
            <p className="text-[13px] text-white/80 font-semibold">Confirmed hires</p>
          </div>
          <div>
            <p className="text-[42px] font-bold tabular-nums">${data.metrics.estimatedSavings.toLocaleString()}</p>
            <p className="text-[13px] text-white/80 font-semibold">Estimated savings</p>
          </div>
          <div>
            <p className="text-[42px] font-bold tabular-nums">{data.metrics.avgTimeToHire}d</p>
            <p className="text-[13px] text-white/80 font-semibold">Average time-to-hire</p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={<Users size={16} />}
          label="Candidates delivered"
          value={data.metrics.candidatesDelivered}
        />
        <KPICard
          icon={<Calendar size={16} />}
          label="Candidates interviewed"
          value={data.metrics.candidatesInterviewed}
        />
        <KPICard
          icon={<Award size={16} />}
          label="Average fit score"
          value={`${data.metrics.avgFitScore}/100`}
        />
        <KPICard
          icon={<Sparkles size={16} />}
          label="Satisfaction (NPS)"
          value={`${data.metrics.satisfactionScore}/10`}
        />
      </div>

      {/* Achievements */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <h2 className="text-[16px] font-bold text-emerald-900">Quarter achievements</h2>
        </div>
        <ul className="space-y-2.5">
          {data.achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-emerald-900">
              <span className="text-emerald-600 mt-0.5">✓</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-blue-600" />
          <h2 className="text-[16px] font-bold text-blue-900">AI Recommendations for next quarter</h2>
        </div>
        <ul className="space-y-2.5">
          {data.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-blue-900">
              <span className="text-blue-600 mt-0.5">→</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ROI breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-[16px] font-bold text-zinc-900 mb-4">ROI Breakdown — {data.period}</h2>
        <div className="space-y-3">
          <Row label="Aimio subscription cost" value={`$${data.metrics.totalSpend.toLocaleString()}`} />
          <Row
            label="Equivalent internal recruiter cost"
            value={`$${(data.metrics.totalSpend + data.metrics.estimatedSavings).toLocaleString()}`}
          />
          <Row
            label="Equivalent agency fees (3 hires × $22K)"
            value="$66,000"
            note="If you'd used agencies"
          />
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-[14px] font-bold text-zinc-900">Your savings vs internal</span>
            <span className="text-[20px] font-bold text-emerald-600">
              ${data.metrics.estimatedSavings.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-zinc-900">Your savings vs agencies</span>
            <span className="text-[20px] font-bold text-emerald-600">
              ${(66000 - data.metrics.totalSpend).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-700">
          {icon}
        </div>
      </div>
      <p className="text-[24px] font-bold text-zinc-900 tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[13px] text-zinc-700">{label}</p>
        {note && <p className="text-[11px] text-zinc-400">{note}</p>}
      </div>
      <span className="text-[15px] font-bold text-zinc-900 tabular-nums">{value}</span>
    </div>
  );
}
