"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Brain,
  Award,
  Loader2,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Plus,
  TrendingUp,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface NewCandidate {
  id: string;
  full_name: string;
  current_title: string;
  current_company: string;
  ai_score: number;
  ai_strengths: string[];
  ai_personalization_hooks: string[];
  ai_likelihood_to_respond: string;
  delivered_at: string;
  status: string;
}

interface DashboardStats {
  candidatesDelivered: number;
  candidatesInPipeline: number;
  candidatesInterested: number;
  hires: number;
  avgTimeToHire: number | null;
  daysActive: number;
  monthlySpend: number;
}

interface AIInsight {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ firstName: string; companyName: string; plan: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newCandidates, setNewCandidates] = useState<NewCandidate[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, client_company_id")
          .eq("id", authUser.id)
          .single();

        let clientId: string | null = null;
        let companyName = "Your Company";
        let plan = "Growth";
        let monthlyMrr = 4999;
        let daysActive = 0;

        if (profile?.client_company_id) {
          clientId = profile.client_company_id;
          const { data: client } = await supabase
            .from("clients")
            .select("company_name, plan, mrr_usd, billing_start_date")
            .eq("id", clientId!)
            .single();
          if (client) {
            companyName = client.company_name;
            plan = client.plan;
            monthlyMrr = client.mrr_usd || 4999;
            if (client.billing_start_date) {
              const start = new Date(client.billing_start_date);
              daysActive = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
            }
          }
        }

        setUser({ firstName: profile?.first_name || "there", companyName, plan });

        let candidates: NewCandidate[] = [];
        let delivered = 0, inPipeline = 0, interested = 0, hires = 0;

        if (clientId) {
          const { data: c } = await supabase.from("sourced_candidates").select("*").eq("client_id", clientId).order("delivered_at", { ascending: false }).limit(5);
          candidates = (c as NewCandidate[]) || [];

          const counts = await Promise.all([
            supabase.from("sourced_candidates").select("*", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "delivered"),
            supabase.from("sourced_candidates").select("*", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["new", "kept", "outreach_ready", "outreached"]),
            supabase.from("sourced_candidates").select("*", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["replied_interested", "qualifying", "qualified", "client_interested"]),
            supabase.from("sourced_candidates").select("*", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "hired"),
          ]);
          delivered = counts[0].count || 0;
          inPipeline = counts[1].count || 0;
          interested = counts[2].count || 0;
          hires = counts[3].count || 0;
        }

        setNewCandidates(candidates);

        let realAvgTimeToHire: number | null = null;
        if (clientId && hires > 0) {
          const { data: hiredRows } = await supabase.from("sourced_candidates").select("delivered_at, hired_at").eq("client_id", clientId).eq("status", "hired").not("delivered_at", "is", null).not("hired_at", "is", null);
          if (hiredRows && hiredRows.length > 0) {
            const totalDays = hiredRows.reduce((sum, r) => {
              const d1 = new Date(r.delivered_at as string).getTime();
              const d2 = new Date(r.hired_at as string).getTime();
              return sum + Math.max(0, (d2 - d1) / 86400000);
            }, 0);
            realAvgTimeToHire = Math.round(totalDays / hiredRows.length);
          }
        }

        setStats({
          candidatesDelivered: delivered,
          candidatesInPipeline: inPipeline,
          candidatesInterested: interested,
          hires,
          avgTimeToHire: realAvgTimeToHire,
          daysActive,
          monthlySpend: monthlyMrr,
        });

        const realInsights: AIInsight[] = [];
        if (interested > 0) {
          realInsights.push({ type: "warning", title: `${interested} candidat${interested > 1 ? "s" : ""} en attente de votre décision`, description: "Les meilleurs candidats répondent vite. Planifiez une entrevue dans les 48h pour ne pas les perdre." });
        }
        if (delivered === 0 && daysActive < 14) {
          realInsights.push({ type: "info", title: "Sourcing en cours", description: "Notre IA analyse 300-500 profils sur 10+ plateformes. Premier shortlist livré sous 5-7 jours." });
        } else if (delivered > 0 && interested === 0 && daysActive > 7) {
          realInsights.push({ type: "info", title: "Aucune décision sur les candidats livrés", description: `Vous avez ${delivered} candidat${delivered > 1 ? "s" : ""} en attente d'évaluation.` });
        }
        if (hires > 0) {
          realInsights.push({ type: "success", title: `${hires} embauche${hires > 1 ? "s" : ""} confirmée${hires > 1 ? "s" : ""} 🎉`, description: "Excellente progression. Notre équipe ajuste continuellement le profil de recherche selon vos feedbacks." });
        }
        setInsights(realInsights);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="bg-zinc-50 min-h-screen -m-4 md:-m-6 lg:-m-8">
      {/* Top bar — Salesforce style */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span className="text-zinc-900 font-semibold">Dashboard</span>
            {user && <><ChevronRight size={11} /><span>{user.companyName}</span></>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/messages" className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-50 inline-flex items-center gap-1.5">
              <MessageCircle size={11} /> Messages
            </Link>
            <Link href="/mandats/nouveau" className="px-3 py-1.5 text-[12px] font-semibold bg-[#2445EB] text-white rounded-md hover:bg-[#1A36C4] inline-flex items-center gap-1.5">
              <Plus size={11} /> Nouveau mandat
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">
            Bonjour {user?.firstName} 👋
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {user?.companyName} · Plan {user?.plan} · Jour {stats?.daysActive} de partenariat
          </p>

          {/* KPIs grid — Salesforce dense */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
            <Stat label="Livrés" value={stats?.candidatesDelivered || 0} sub={`${stats?.candidatesInterested || 0} intéressés`} color="blue" icon={<Users size={11} />} highlight />
            <Stat label="Pipeline" value={stats?.candidatesInPipeline || 0} sub="en qualification" color="purple" icon={<Sparkles size={11} />} />
            <Stat label="Time-to-hire" value={stats?.avgTimeToHire ? `${stats.avgTimeToHire}j` : "—"} sub={stats?.avgTimeToHire ? "vs industrie 47j" : "après 1ère embauche"} color="amber" icon={<Clock size={11} />} />
            <Stat label="Embauchés" value={stats?.hires || 0} sub="cette période" color="emerald" icon={<Award size={11} />} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-lg p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                      <Brain size={14} />
                    </div>
                    <div>
                      <h2 className="text-[12px] font-bold uppercase tracking-wider">AI Insights · {user?.companyName}</h2>
                      <p className="text-[10px] text-white/70">Powered by Claude</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {insights.map((insight, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur rounded-md p-2.5 border border-white/10">
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                            insight.type === "warning" ? "bg-amber-300" :
                            insight.type === "success" ? "bg-emerald-300" :
                            "bg-white"
                          }`} />
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold mb-0.5">{insight.title}</p>
                            <p className="text-[11px] text-white/80 leading-relaxed">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* New candidates */}
            <Card title="Nouveaux candidats" icon={<Sparkles size={13} className="text-[#2445EB]" />} count={newCandidates.length} action={
              <Link href="/candidats" className="text-[11px] text-[#2445EB] font-semibold hover:underline">Voir tout →</Link>
            }>
              {newCandidates.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Sparkles size={28} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-zinc-900">Sourcing en cours</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                    Votre recruteur IA analyse les meilleurs candidats. Premier shortlist sous 5-7 jours.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {newCandidates.slice(0, 5).map((c) => {
                    const initials = (c.full_name || "?").split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
                    const score = c.ai_score || 0;
                    const scoreColor = score >= 85 ? "bg-emerald-50 text-emerald-700" : score >= 70 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
                    return (
                      <Link key={c.id} href={`/candidats/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-[#2445EB] truncate">{c.full_name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{c.current_title}{c.current_company && <> · {c.current_company}</>}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded tabular-nums ${scoreColor}`}>{score}/100</span>
                          <ChevronRight size={12} className="text-zinc-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-4">
            <Card title="Actions rapides" icon={<TrendingUp size={13} className="text-[#2445EB]" />}>
              <div className="p-2 space-y-0.5">
                <ShortcutItem href="/mandats/nouveau" icon={<Plus size={12} />} label="Nouveau mandat" />
                <ShortcutItem href="/mandats" icon={<Briefcase size={12} />} label="Mes mandats" />
                <ShortcutItem href="/candidats" icon={<Users size={12} />} label="Tous mes candidats" />
                <ShortcutItem href="/messages" icon={<MessageCircle size={12} />} label="Messagerie recruteur" />
                <ShortcutItem href="/dashboard/insights" icon={<Brain size={12} />} label="AI Insights" />
                <ShortcutItem href="/dashboard/qbr" icon={<TrendingUp size={12} />} label="QBR (rapport)" />
              </div>
            </Card>

            <Card title="Statut compte" icon={<CheckCircle2 size={13} className="text-emerald-600" />}>
              <div className="p-3 space-y-2">
                <Row label="Plan" value={user?.plan || "—"} />
                <Row label="MRR" value={`$${(stats?.monthlySpend || 0).toLocaleString()}/mois`} />
                <Row label="Jour" value={`${stats?.daysActive || 0} de partenariat`} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── HELPERS ─────────

function Stat({ label, value, sub, color, icon, highlight }: { label: string; value: string | number; sub?: string; color?: "blue" | "purple" | "amber" | "emerald"; icon?: React.ReactNode; highlight?: boolean }) {
  const styles = {
    blue: highlight ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white" : "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  const labelColor = highlight ? "text-white/80" : "text-zinc-500";
  const valueColor = highlight ? "text-white" : "text-zinc-900";
  const subColor = highlight ? "text-white/70" : "text-zinc-500";
  return (
    <div className={`rounded-md border px-3 py-2.5 ${color ? styles[color] : "bg-white border-zinc-200"}`}>
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none flex items-center gap-1 ${labelColor}`}>
        {icon} {label}
      </p>
      <p className={`text-[20px] font-bold tabular-nums mt-1.5 leading-none ${valueColor}`}>{value}</p>
      {sub && <p className={`text-[9px] mt-1 leading-none ${subColor}`}>{sub}</p>}
    </div>
  );
}

function Card({ title, icon, count, action, children }: { title: string; icon?: React.ReactNode; count?: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
      <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full font-bold">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ShortcutItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-zinc-700 hover:bg-zinc-50 hover:text-[#2445EB] transition">
      {icon} {label}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
