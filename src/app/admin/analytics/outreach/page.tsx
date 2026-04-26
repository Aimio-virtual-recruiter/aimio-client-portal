"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Mail,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Loader2,
  Filter,
  CheckCircle2,
  Trophy,
  Zap,
  MessageCircle,
  BarChart3,
} from "lucide-react";

function Linkedin({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface RecruiterStats {
  recruiter_id: string;
  recruiter_name: string;
  team_name: string;
  location: string;
  messages_sent: number;
  messages_opened: number;
  messages_replied: number;
  candidates_qualified: number;
  candidates_delivered: number;
  hired: number;
  open_rate: number;
  reply_rate: number;
  qualify_rate: number;
  avg_score: number;
  cost_per_hire: number;
}

interface ChannelStats {
  channel: "linkedin" | "email" | "voice";
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  qualified: number;
  open_rate: number;
  reply_rate: number;
  cost: number;
}

export default function OutreachAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [channels, setChannels] = useState<ChannelStats[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalSent: 0,
    totalReplies: 0,
    totalQualified: 0,
    totalDelivered: 0,
    totalHired: 0,
    avgReplyRate: 0,
    avgTimeToFirstTouch: 0,
    avgTimeToReply: 0,
  });

  useEffect(() => {
    // Demo data — replace with /api/admin/analytics/outreach
    setTimeout(() => {
      setGlobalStats({
        totalSent: 8420,
        totalReplies: 1894,
        totalQualified: 421,
        totalDelivered: 178,
        totalHired: 24,
        avgReplyRate: 22.5,
        avgTimeToFirstTouch: 3.2,
        avgTimeToReply: 18.7,
      });

      setChannels([
        { channel: "linkedin", sent: 4200, delivered: 4150, opened: 3800, replied: 1080, qualified: 285, open_rate: 91.6, reply_rate: 26.0, cost: 850 },
        { channel: "email", sent: 4100, delivered: 3950, opened: 1480, replied: 720, qualified: 121, open_rate: 37.5, reply_rate: 18.2, cost: 410 },
        { channel: "voice", sent: 120, delivered: 105, opened: 105, replied: 94, qualified: 15, open_rate: 100, reply_rate: 89.5, cost: 360 },
      ]);

      setRecruiters([
        { recruiter_id: "1", recruiter_name: "Anne-Marie Gagnon", team_name: "Quebec HQ", location: "Quebec", messages_sent: 1850, messages_opened: 1240, messages_replied: 480, candidates_qualified: 95, candidates_delivered: 42, hired: 8, open_rate: 67, reply_rate: 26, qualify_rate: 19.8, avg_score: 84, cost_per_hire: 1125 },
        { recruiter_id: "2", recruiter_name: "Yassine Ben Ali", team_name: "Tunisia Alpha", location: "Tunisia", messages_sent: 2100, messages_opened: 1380, messages_replied: 510, candidates_qualified: 105, candidates_delivered: 48, hired: 7, open_rate: 65, reply_rate: 24, qualify_rate: 20.6, avg_score: 81, cost_per_hire: 357 },
        { recruiter_id: "3", recruiter_name: "Sara Belhaj", team_name: "Tunisia Alpha", location: "Tunisia", messages_sent: 1950, messages_opened: 1290, messages_replied: 425, candidates_qualified: 78, candidates_delivered: 35, hired: 5, open_rate: 66, reply_rate: 22, qualify_rate: 18.4, avg_score: 79, cost_per_hire: 500 },
        { recruiter_id: "4", recruiter_name: "Léa Bouchard", team_name: "Quebec HQ", location: "Quebec", messages_sent: 1320, messages_opened: 880, messages_replied: 285, candidates_qualified: 65, candidates_delivered: 28, hired: 3, open_rate: 67, reply_rate: 22, qualify_rate: 22.8, avg_score: 86, cost_per_hire: 3000 },
        { recruiter_id: "5", recruiter_name: "Mohamed Slim", team_name: "Tunisia Alpha", location: "Tunisia", messages_sent: 1200, messages_opened: 760, messages_replied: 194, candidates_qualified: 78, candidates_delivered: 25, hired: 1, open_rate: 63, reply_rate: 16, qualify_rate: 40.2, avg_score: 77, cost_per_hire: 2500 },
      ]);

      setLoading(false);
    }, 600);
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2">
          <ArrowLeft size={12} /> Admin
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-xl flex items-center justify-center">
                <BarChart3 size={18} className="text-white" />
              </div>
              <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">Outreach Analytics</h1>
            </div>
            <p className="text-[13px] text-zinc-500">
              Performance per recruiter, team, channel — across all clients
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                  period === p
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : "Last 90 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GLOBAL KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Messages sent" value={globalStats.totalSent.toLocaleString()} icon={<Send size={14} />} color="blue" />
        <KPICard label="Replies received" value={globalStats.totalReplies.toLocaleString()} sub={`${globalStats.avgReplyRate}% reply rate`} icon={<MessageCircle size={14} />} color="purple" />
        <KPICard label="Candidates qualified" value={globalStats.totalQualified.toLocaleString()} icon={<CheckCircle2 size={14} />} color="amber" />
        <KPICard label="Hires confirmed" value={globalStats.totalHired.toLocaleString()} sub={`${globalStats.totalDelivered} delivered`} icon={<Trophy size={14} />} color="emerald" />
      </div>

      {/* CHANNEL PERFORMANCE */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Performance by channel</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Compare LinkedIn vs Email vs Voice outreach</p>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="pb-3 text-left">Channel</th>
                <th className="pb-3 text-right">Sent</th>
                <th className="pb-3 text-right">Delivered</th>
                <th className="pb-3 text-right">Opened</th>
                <th className="pb-3 text-right">Open rate</th>
                <th className="pb-3 text-right">Replied</th>
                <th className="pb-3 text-right">Reply rate</th>
                <th className="pb-3 text-right">Qualified</th>
                <th className="pb-3 text-right">Cost</th>
                <th className="pb-3 text-right">Cost/qualif</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr key={ch.channel} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900">
                      {ch.channel === "linkedin" && <Linkedin size={13} className="text-[#0A66C2]" />}
                      {ch.channel === "email" && <Mail size={13} className="text-[#2445EB]" />}
                      {ch.channel === "voice" && <Zap size={13} className="text-purple-600" />}
                      {ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums">{ch.sent.toLocaleString()}</td>
                  <td className="py-3 text-right tabular-nums">{ch.delivered.toLocaleString()}</td>
                  <td className="py-3 text-right tabular-nums">{ch.opened.toLocaleString()}</td>
                  <td className="py-3 text-right tabular-nums font-semibold">{ch.open_rate}%</td>
                  <td className="py-3 text-right tabular-nums">{ch.replied.toLocaleString()}</td>
                  <td className="py-3 text-right tabular-nums">
                    <span className={`font-semibold ${ch.reply_rate > 25 ? "text-emerald-600" : ch.reply_rate > 15 ? "text-amber-600" : "text-zinc-700"}`}>
                      {ch.reply_rate}%
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums">{ch.qualified}</td>
                  <td className="py-3 text-right tabular-nums">${ch.cost.toLocaleString()}</td>
                  <td className="py-3 text-right tabular-nums">${(ch.cost / ch.qualified).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIME METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <TimeMetric icon={<Clock size={14} />} label="Avg time to first touch" value={`${globalStats.avgTimeToFirstTouch}h`} sub="From sourcing to first message" benchmark="Industry: 24h" trend="better" />
        <TimeMetric icon={<MessageCircle size={14} />} label="Avg time to reply" value={`${globalStats.avgTimeToReply}h`} sub="From message to candidate response" benchmark="Industry: 48h" trend="better" />
        <TimeMetric icon={<Target size={14} />} label="Avg time to deliver" value="3.4d" sub="From sourcing to client delivery" benchmark="Industry: 14d" trend="better" />
      </div>

      {/* RECRUITER LEADERBOARD */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold text-zinc-900">Recruiter performance</h2>
          <div className="flex items-center gap-2">
            <button className="text-[11px] text-[#2445EB] font-semibold hover:underline flex items-center gap-1">
              <Filter size={11} /> Filter team
            </button>
          </div>
        </div>
        <p className="text-[12px] text-zinc-500 mb-5">Sorted by hires this period</p>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="pb-3 text-left">Recruiter</th>
                <th className="pb-3 text-left">Team / Location</th>
                <th className="pb-3 text-right">Sent</th>
                <th className="pb-3 text-right">Reply rate</th>
                <th className="pb-3 text-right">Qualified</th>
                <th className="pb-3 text-right">Delivered</th>
                <th className="pb-3 text-right">Hired</th>
                <th className="pb-3 text-right">Avg score</th>
                <th className="pb-3 text-right">Cost/hire</th>
              </tr>
            </thead>
            <tbody>
              {recruiters
                .sort((a, b) => b.hired - a.hired)
                .map((r, idx) => (
                  <tr key={r.recruiter_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="text-[14px]">🥇</span>}
                        {idx === 1 && <span className="text-[14px]">🥈</span>}
                        {idx === 2 && <span className="text-[14px]">🥉</span>}
                        <span className="font-semibold text-zinc-900">{r.recruiter_name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-zinc-700">{r.team_name}</span>
                        <span className="text-[10px] text-zinc-400">{r.location}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums">{r.messages_sent.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={`font-semibold ${r.reply_rate > 25 ? "text-emerald-600" : "text-zinc-700"}`}>
                        {r.reply_rate}%
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{r.candidates_qualified}</td>
                    <td className="py-3 text-right tabular-nums">{r.candidates_delivered}</td>
                    <td className="py-3 text-right tabular-nums font-bold text-zinc-900">{r.hired}</td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={`font-semibold ${r.avg_score >= 85 ? "text-emerald-600" : r.avg_score >= 75 ? "text-blue-600" : "text-amber-600"}`}>
                        {r.avg_score}/100
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={`font-semibold ${r.cost_per_hire < 1000 ? "text-emerald-600" : r.cost_per_hire < 2000 ? "text-blue-600" : "text-zinc-700"}`}>
                        ${r.cost_per_hire.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TEAM COMPARISON — OFFSHORE INSIGHTS */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-emerald-600" />
          <h2 className="text-[16px] font-bold text-emerald-900">Team economics insight</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-zinc-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Quebec HQ</p>
            <p className="text-[20px] font-bold text-zinc-900">$2,063</p>
            <p className="text-[11px] text-zinc-500 mt-1">Avg cost per hire</p>
            <p className="text-[10px] text-zinc-400 mt-2">2 recruiters · 11 hires · 30d</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-300">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Tunisia Alpha ⭐</p>
            <p className="text-[20px] font-bold text-emerald-700">$1,119</p>
            <p className="text-[11px] text-zinc-500 mt-1">Avg cost per hire</p>
            <p className="text-[10px] text-zinc-400 mt-2">3 recruiters · 13 hires · 30d</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">Savings</p>
            <p className="text-[20px] font-bold text-blue-700">-46%</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tunisia vs Quebec</p>
            <p className="text-[10px] text-zinc-400 mt-2">Same hire output</p>
          </div>
        </div>

        <p className="text-[12px] text-zinc-700 mt-4 leading-relaxed">
          <strong>Insight :</strong> Tunisia team produces same hire volume at <strong>46% lower cost</strong>.
          At 50 clients scale, hiring 5 more Tunisia recruiters vs Quebec saves <strong>$325K/year</strong> with same delivery capacity.
        </p>
      </div>

      {/* TOP PERFORMING TEMPLATES */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Top performing outreach templates</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Best response rates this period (AI-generated)</p>

        <div className="space-y-3">
          {[
            { rank: 1, channel: "linkedin", subject: "Connection: gRPC + Go background", reply_rate: 38, sent: 142 },
            { rank: 2, channel: "email", subject: "Quick question about your migration work", reply_rate: 28, sent: 380 },
            { rank: 3, channel: "linkedin", subject: "InMail: Your Shopify experience caught my eye", reply_rate: 26, sent: 95 },
            { rank: 4, channel: "email", subject: "Aimio × {company} — opportunity", reply_rate: 22, sent: 510 },
            { rank: 5, channel: "linkedin", subject: "Hey {name}, your post on architecture", reply_rate: 21, sent: 215 },
          ].map((tpl) => (
            <div key={tpl.rank} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
              <span className="text-[14px] font-bold text-zinc-400 w-5">#{tpl.rank}</span>
              {tpl.channel === "linkedin" ? (
                <Linkedin size={13} className="text-[#0A66C2] shrink-0" />
              ) : (
                <Mail size={13} className="text-[#2445EB] shrink-0" />
              )}
              <p className="text-[13px] text-zinc-900 flex-1 truncate">{tpl.subject}</p>
              <span className="text-[11px] text-zinc-500">{tpl.sent} sent</span>
              <span className="text-[12px] font-bold text-emerald-600">{tpl.reply_rate}%</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-400 mt-4">
          💡 Aimio AI auto-replicates winning templates across recruiters
        </p>
      </div>

      {/* FUNNEL CONVERSION */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-[16px] font-bold text-zinc-900 mb-5">Conversion funnel</h2>

        <div className="space-y-3">
          <FunnelStage label="Sent" value={globalStats.totalSent} max={globalStats.totalSent} color="bg-zinc-300" />
          <FunnelStage label="Opened" value={Math.round(globalStats.totalSent * 0.65)} max={globalStats.totalSent} color="bg-blue-300" prevValue={globalStats.totalSent} />
          <FunnelStage label="Replied" value={globalStats.totalReplies} max={globalStats.totalSent} color="bg-purple-400" prevValue={Math.round(globalStats.totalSent * 0.65)} />
          <FunnelStage label="Qualified" value={globalStats.totalQualified} max={globalStats.totalSent} color="bg-amber-400" prevValue={globalStats.totalReplies} />
          <FunnelStage label="Delivered" value={globalStats.totalDelivered} max={globalStats.totalSent} color="bg-[#2445EB]" prevValue={globalStats.totalQualified} />
          <FunnelStage label="Hired" value={globalStats.totalHired} max={globalStats.totalSent} color="bg-emerald-500" prevValue={globalStats.totalDelivered} />
        </div>

        <div className="mt-5 pt-5 border-t border-zinc-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Sent → Reply</p>
            <p className="text-[22px] font-bold text-zinc-900 tabular-nums">
              {((globalStats.totalReplies / globalStats.totalSent) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Reply → Qualified</p>
            <p className="text-[22px] font-bold text-zinc-900 tabular-nums">
              {((globalStats.totalQualified / globalStats.totalReplies) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Sent → Hire</p>
            <p className="text-[22px] font-bold text-emerald-600 tabular-nums">
              {((globalStats.totalHired / globalStats.totalSent) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTS ============

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "purple" | "amber" | "emerald";
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]} mb-3`}>{icon}</div>
      <p className="text-[26px] font-bold text-zinc-900 tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function TimeMetric({
  icon,
  label,
  value,
  sub,
  benchmark,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  benchmark: string;
  trend: "better" | "worse" | "same";
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-700">{icon}</div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
      <p className="text-[28px] font-bold text-zinc-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>
      <p
        className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${
          trend === "better" ? "text-emerald-600" : trend === "worse" ? "text-red-600" : "text-zinc-500"
        }`}
      >
        {trend === "better" && <TrendingDown size={11} />}
        {trend === "worse" && <TrendingUp size={11} />}
        {benchmark}
      </p>
    </div>
  );
}

function FunnelStage({
  label,
  value,
  max,
  color,
  prevValue,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  prevValue?: number;
}) {
  const pct = (value / max) * 100;
  const conversion = prevValue ? ((value / prevValue) * 100).toFixed(0) : null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-[12px] font-semibold text-zinc-700">{label}</div>
      <div className="flex-1 bg-zinc-100 rounded-full h-9 overflow-hidden relative">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        <span className="absolute inset-0 flex items-center px-3 text-[12px] font-bold text-zinc-900">
          {value.toLocaleString()}
        </span>
      </div>
      {conversion && (
        <span className="text-[11px] font-semibold text-zinc-500 w-16 text-right">{conversion}% ↓</span>
      )}
    </div>
  );
}
