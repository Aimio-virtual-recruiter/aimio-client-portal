"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Candidate, type Mandate } from "@/lib/supabase";
import { UserPlus, CheckSquare, Clock, Users, Briefcase, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [m, c] = await Promise.all([
        supabase.from('mandates').select('*').order('created_at', { ascending: false }),
        supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      ]);
      setMandates(m.data || []);
      setCandidates(c.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const drafts = candidates.filter(c => c.internal_status === 'draft');
  const approved = candidates.filter(c => c.internal_status === 'approved');
  const activeMandates = mandates.filter(m => m.status === 'active');

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-300">Chargement...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Admin — Recruteur Virtuel IA</h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">Gerez les candidats, mandats et approbations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/recruiters"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-[13px] font-medium transition-premium btn-press"
          >
            <Users size={15} />
            Recruteurs
          </Link>
          <Link
            href="/admin/candidates/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition-premium btn-press"
          >
            <UserPlus size={15} />
            Nouveau candidat
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Mandats actifs", value: activeMandates.length, icon: Briefcase, color: "#6C2BD9" },
          { label: "En attente d'approbation", value: drafts.length, icon: Clock, color: "#6C2BD9" },
          { label: "Candidats livres", value: approved.length, icon: CheckSquare, color: "#10B981" },
          { label: "Total candidats", value: candidates.length, icon: Users, color: "#3B82F6" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} style={{ color: stat.color }} strokeWidth={1.5} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
              <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending Approvals */}
      {drafts.length > 0 && (
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={15} className="text-[#6C2BD9]" />
            <h2 className="text-[13px] font-semibold text-zinc-900">{drafts.length} candidat(s) en attente d approbation</h2>
          </div>
          <div className="space-y-2">
            {drafts.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-zinc-700">{c.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{c.name}</p>
                    <p className="text-[11px] text-zinc-400">{c.current_title} — Score: {c.score}/10</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await supabase.from('candidates').update({ internal_status: 'approved', approved_at: new Date().toISOString() }).eq('id', c.id);
                      setCandidates(prev => prev.map(p => p.id === c.id ? { ...p, internal_status: 'approved' } : p));
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[11px] font-medium transition-premium btn-press"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from('candidates').update({ internal_status: 'rejected' }).eq('id', c.id);
                      setCandidates(prev => prev.map(p => p.id === c.id ? { ...p, internal_status: 'rejected' } : p));
                    }}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md text-[11px] font-medium transition-premium btn-press"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Candidates */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card mb-6">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-zinc-900">Derniers candidats</h2>
          <Link href="/admin/candidates/new" className="text-[11px] text-[#6C2BD9] font-medium flex items-center gap-1 hover:text-[#5521B5] transition-premium">
            Ajouter <ArrowRight size={10} />
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {candidates.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center ring-2 ring-white">
                  <span className="text-[10px] font-semibold text-zinc-600">{c.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-zinc-900">{c.name}</p>
                  <p className="text-[11px] text-zinc-400">{c.current_title} — {c.current_company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold text-zinc-600 tabular-nums">{c.score >= 0 && c.score <= 10 ? `${c.score}/10` : `${Math.round(c.score)}/100`}</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                  c.internal_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                  c.internal_status === 'draft' ? 'bg-[#6C2BD9]/10 text-[#6C2BD9]' :
                  'bg-red-50 text-red-600'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    c.internal_status === 'approved' ? 'bg-emerald-500' :
                    c.internal_status === 'draft' ? 'bg-[#6C2BD9]' :
                    'bg-red-500'
                  }`} />
                  {c.internal_status === 'approved' ? 'Livre' : c.internal_status === 'draft' ? 'En attente' : 'Rejete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Mandates */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[13px] font-semibold text-zinc-900">Mandats actifs</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {mandates.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px] font-medium text-zinc-900">{m.title}</p>
                <p className="text-[11px] text-zinc-400">{m.location} — {m.salary_min ? `${(m.salary_min/1000).toFixed(0)}-${(m.salary_max/1000).toFixed(0)}K$` : 'TBD'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400">{candidates.filter(c => c.mandate_id === m.id).length} candidats</span>
                <Link
                  href={`/admin/candidates/new?mandate=${m.id}`}
                  className="px-3 py-1.5 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-md text-[11px] font-medium transition-premium btn-press"
                >
                  + Candidat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
