"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  UserPlus,
  Users,
  Briefcase,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Loader2,
  CreditCard,
  BarChart3,
  Rocket,
  ListChecks,
  Send,
  Inbox,
  Activity,
  Clock,
  DollarSign,
  ChevronRight,
  Plus,
} from "lucide-react";

interface ClientRow {
  id: string;
  company_name: string;
  status: string;
  plan: string | null;
  mrr_usd: number | null;
  created_at: string;
  contact_first_name: string | null;
}

interface MandateRow {
  id: string;
  title: string | null;
  status: string;
  company_id: string;
  created_at: string;
  clients?: { company_name: string } | null;
}

interface CandidateRow {
  id: string;
  full_name: string | null;
  status: string;
  ai_score: number | null;
  delivered_at: string | null;
  created_at: string;
  clients?: { company_name: string } | null;
}

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [mandates, setMandates] = useState<MandateRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const [c, m, cand] = await Promise.all([
          supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(100),
          supabase.from("mandates").select("*, clients(company_name)").order("created_at", { ascending: false }).limit(50),
          supabase.from("sourced_candidates").select("id, full_name, status, ai_score, delivered_at, created_at, clients(company_name)").order("created_at", { ascending: false }).limit(20),
        ]);
        setClients((c.data as ClientRow[]) || []);
        setMandates((m.data as MandateRow[]) || []);
        setCandidates((cand.data as unknown as CandidateRow[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  // KPIs
  const activeClients = clients.filter((c) => c.status === "active");
  const onboardingClients = clients.filter((c) => c.status === "onboarding");
  const totalMRR = activeClients.reduce((sum, c) => sum + (c.mrr_usd || 0), 0);
  const newThisMonth = clients.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const activeMandates = mandates.filter((m) => m.status === "active" || m.status === "pending_review");
  const candidatesNew = candidates.filter((c) => c.status === "new").length;
  const candidatesDelivered = candidates.filter((c) => c.status === "delivered").length;
  const candidatesHired = candidates.filter((c) => c.status === "hired").length;

  return (
    <div className="bg-zinc-50 min-h-screen -m-4 md:-m-6 lg:-m-8">
      {/* Top bar — Salesforce style */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span className="text-zinc-900 font-semibold">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/recruiter/source" className="px-3 py-1.5 text-[12px] font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-flex items-center gap-1.5">
              <Rocket size={11} /> Sourcer
            </Link>
            <Link href="/admin/clients/new" className="px-3 py-1.5 text-[12px] font-semibold bg-[#2445EB] text-white rounded-md hover:bg-[#1A36C4] inline-flex items-center gap-1.5">
              <Plus size={11} /> Nouveau client
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Vue d&apos;ensemble</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {clients.length} clients total · {activeMandates.length} mandats actifs · {candidates.length} candidats récents
          </p>

          {/* KPIs grid — Salesforce dense */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-5">
            <Stat label="Clients actifs" value={activeClients.length} sub={`+${newThisMonth} ce mois`} color="blue" icon={<Users size={11} />} />
            <Stat label="MRR total" value={`$${(totalMRR / 1000).toFixed(0)}K`} sub="par mois" color="emerald" icon={<DollarSign size={11} />} />
            <Stat label="Onboarding" value={onboardingClients.length} sub="à activer" color="amber" icon={<Clock size={11} />} />
            <Stat label="Mandats actifs" value={activeMandates.length} sub="en sourcing" color="purple" icon={<Briefcase size={11} />} />
            <Stat label="À valider" value={candidatesNew} sub="dans queue" color="amber" icon={<ListChecks size={11} />} />
            <Stat label="Embauchés" value={candidatesHired} sub="ce trimestre" color="emerald-strong" icon={<CheckCircle2 size={11} />} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* Quick Actions Grid */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ActionCard href="/admin/clients/new" icon={<UserPlus size={16} className="text-[#2445EB]" />} title="Onboard client" desc="Nouveau client RV" />
            <ActionCard href="/recruiter/source" icon={<Rocket size={16} className="text-purple-600" />} title="Sourcer candidats" desc="Apify · Apollo · DB" />
            <ActionCard href="/recruiter/queue" icon={<ListChecks size={16} className="text-amber-600" />} title="Queue à valider" desc={`${candidatesNew} candidats`} badge={candidatesNew > 0 ? candidatesNew : undefined} />
            <ActionCard href="/recruiter/outreach" icon={<Send size={16} className="text-blue-600" />} title="Envoyer outreach" desc="LinkedIn · Email" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent clients (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Derniers clients" icon={<Users size={13} className="text-[#2445EB]" />} count={clients.length} action={
              <Link href="/admin/clients" className="text-[11px] text-[#2445EB] font-semibold hover:underline">
                Voir tout →
              </Link>
            }>
              <div className="divide-y divide-zinc-100">
                {clients.slice(0, 6).map((c) => {
                  const daysAgo = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
                  return (
                    <Link key={c.id} href={`/recruiter/clients/${c.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {c.company_name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-[#2445EB] truncate">{c.company_name}</p>
                          <p className="text-[11px] text-zinc-500">{c.contact_first_name} · {c.plan} · ${(c.mrr_usd || 0).toLocaleString()}/mo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] text-zinc-400">{daysAgo}j</span>
                        <ChevronRight size={12} className="text-zinc-400" />
                      </div>
                    </Link>
                  );
                })}
                {clients.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12px] text-zinc-400 italic">Aucun client encore.</div>
                )}
              </div>
            </Card>

            <Card title="Mandats récents" icon={<Briefcase size={13} className="text-[#2445EB]" />} count={mandates.length} action={
              <Link href="/admin/mandates" className="text-[11px] text-[#2445EB] font-semibold hover:underline">
                Voir tout →
              </Link>
            }>
              <div className="divide-y divide-zinc-100">
                {mandates.slice(0, 5).map((m) => {
                  const daysAgo = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000);
                  return (
                    <Link key={m.id} href={`/mandats/${m.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          <Briefcase size={13} className="text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-[#2445EB] truncate">{m.title || "Sans titre"}</p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {m.clients?.company_name && <>📍 {m.clients.company_name} · </>}
                            il y a {daysAgo}j
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={m.status} />
                        <ChevronRight size={12} className="text-zinc-400" />
                      </div>
                    </Link>
                  );
                })}
                {mandates.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12px] text-zinc-400 italic">Aucun mandat encore.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Right column (1/3) — recent activity + shortcuts */}
          <div className="space-y-4">
            <Card title="Candidats récents" icon={<Sparkles size={13} className="text-[#2445EB]" />} count={candidates.length} action={
              <Link href="/recruiter/candidates" className="text-[11px] text-[#2445EB] font-semibold hover:underline">
                Banque →
              </Link>
            }>
              <div className="divide-y divide-zinc-100">
                {candidates.slice(0, 6).map((c) => {
                  const initials = (c.full_name || "?").split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
                  return (
                    <Link key={c.id} href={`/recruiter/candidates/${c.id}`} className="flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-900 truncate">{c.full_name}</p>
                          {c.clients?.company_name && (
                            <p className="text-[10px] text-zinc-500 truncate">{c.clients.company_name}</p>
                          )}
                        </div>
                      </div>
                      {c.ai_score !== null && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                          c.ai_score >= 85 ? "bg-emerald-50 text-emerald-700" :
                          c.ai_score >= 70 ? "bg-blue-50 text-blue-700" :
                          c.ai_score >= 50 ? "bg-amber-50 text-amber-700" :
                          "bg-zinc-100 text-zinc-600"
                        }`}>
                          {c.ai_score}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {candidates.length === 0 && (
                  <div className="px-3 py-6 text-center text-[11px] text-zinc-400 italic">Aucun candidat.</div>
                )}
              </div>
            </Card>

            <Card title="Raccourcis" icon={<TrendingUp size={13} className="text-[#2445EB]" />}>
              <div className="p-2 space-y-0.5">
                <ShortcutItem href="/admin/billing" icon={<CreditCard size={12} />} label="Facturation Stripe" />
                <ShortcutItem href="/admin/recruiters" icon={<Users size={12} />} label="Gérer recruteurs" />
                <ShortcutItem href="/admin/analytics/outreach" icon={<BarChart3 size={12} />} label="Analytics outreach" />
                <ShortcutItem href="/recruiter/scorecard" icon={<Activity size={12} />} label="Mon scorecard" />
                <ShortcutItem href="/recruiter/deliver" icon={<Inbox size={12} />} label="Livrer un candidat" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── HELPERS ─────────

function Stat({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color?: "blue" | "purple" | "amber" | "emerald" | "emerald-strong"; icon?: React.ReactNode }) {
  const styles = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    "emerald-strong": "bg-emerald-100 border-emerald-300 text-emerald-900",
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${color ? styles[color] : "bg-white border-zinc-200"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 leading-none flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-[18px] font-bold text-zinc-900 tabular-nums mt-1.5 leading-none">{value}</p>
      {sub && <p className="text-[9px] text-zinc-500 mt-1 leading-none">{sub}</p>}
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
          {count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full font-bold">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ActionCard({ href, icon, title, desc, badge }: { href: string; icon: React.ReactNode; title: string; desc: string; badge?: number }) {
  return (
    <Link href={href} className="bg-white border border-zinc-200 rounded-lg p-3 hover:border-[#2445EB] hover:shadow-md transition group relative">
      {badge !== undefined && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center bg-amber-500 text-white px-1">
          {badge}
        </span>
      )}
      <div className="mb-1.5">{icon}</div>
      <p className="text-[13px] font-bold text-zinc-900 group-hover:text-[#2445EB]">{title}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
    </Link>
  );
}

function ShortcutItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-zinc-700 hover:bg-zinc-50 hover:text-[#2445EB] transition">
      {icon} {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Actif", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    onboarding: { label: "Onboarding", color: "bg-amber-50 text-amber-700 border-amber-200" },
    pending_review: { label: "En revue", color: "bg-amber-50 text-amber-700 border-amber-200" },
    paused: { label: "Pause", color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
    churned: { label: "Churned", color: "bg-red-50 text-red-700 border-red-200" },
    filled: { label: "Comblé", color: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const s = map[status] || { label: status, color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${s.color}`}>
      {s.label}
    </span>
  );
}
