"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pause,
} from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string;
  country: string | null;
  plan: string | null;
  mrr_usd: number | null;
  status: string;
  billing_status: string | null;
  recruteur_lead: string | null;
  created_at: string;
  roles_hiring_for: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Actif", color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={11} /> },
  onboarding: { label: "Onboarding", color: "bg-blue-50 text-blue-700", icon: <Loader2 size={11} /> },
  paused: { label: "Pause", color: "bg-amber-50 text-amber-700", icon: <Pause size={11} /> },
  churned: { label: "Churned", color: "bg-red-50 text-red-700", icon: <AlertCircle size={11} /> },
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });
        setClients((data as Client[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = clients.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_email?.toLowerCase().includes(q) ||
      `${c.contact_first_name || ""} ${c.contact_last_name || ""}`.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    onboarding: clients.filter((c) => c.status === "onboarding").length,
    mrr: clients.reduce((sum, c) => sum + (c.status === "active" ? c.mrr_usd || 0 : 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Clients</h1>
          <p className="text-[14px] text-zinc-500 mt-1.5">
            {stats.total} clients · ${stats.mrr.toLocaleString()} MRR · {stats.active} actifs · {stats.onboarding} en onboarding
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2445EB] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1A36C4] transition"
        >
          <Plus size={14} /> Onboard nouveau client
        </Link>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile icon={<Building2 size={13} />} label="Clients total" value={stats.total} />
        <Tile icon={<CheckCircle2 size={13} />} label="Actifs" value={stats.active} highlight="emerald" />
        <Tile icon={<Loader2 size={13} />} label="Onboarding" value={stats.onboarding} highlight="blue" />
        <Tile icon={<TrendingUp size={13} />} label="MRR total" value={`$${stats.mrr.toLocaleString()}`} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'entreprise, email, contact…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {(["all", "active", "onboarding", "paused", "churned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
                statusFilter === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Building2 size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-[14px] font-semibold text-zinc-700">Aucun client trouvé</p>
          <p className="text-[13px] text-zinc-500 mt-1">Ajuste tes filtres ou onboard ton premier client.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">Client</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">Plan</th>
                <th className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">MRR</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">Recruteur</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">Statut</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-3">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const status = STATUS_CONFIG[c.status] || { label: c.status, color: "bg-zinc-100 text-zinc-700", icon: null };
                const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
                return (
                  <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/recruiter/clients/${c.id}`} className="block">
                        <p className="text-[13px] font-semibold text-zinc-900 hover:text-[#2445EB]">{c.company_name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {c.contact_first_name} {c.contact_last_name} · {c.contact_email}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold uppercase tracking-wider">
                        {c.plan || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-[13px] font-semibold text-zinc-900 tabular-nums">
                        ${(c.mrr_usd || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-400 uppercase">/ mois</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-zinc-700">{c.recruteur_lead || <span className="text-zinc-400">À assigner</span>}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-zinc-500">
                      {days}j
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: "emerald" | "blue";
}) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
  };
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? styles[highlight] : "bg-white border-zinc-200"}`}>
      <div className="flex items-center gap-1.5 mb-2 text-zinc-500">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[22px] font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}
