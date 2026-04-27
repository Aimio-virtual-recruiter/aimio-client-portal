"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Loader2, Search, TrendingUp, Users } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  country: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  plan: string | null;
  mrr_usd: number | null;
  status: string;
  recruteur_lead: string | null;
  candidates_delivered_count?: number;
  last_delivery_at?: string | null;
}

export default function RecruiterClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/recruiter/clients");
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
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
      `${c.contact_first_name || ""} ${c.contact_last_name || ""}`.toLowerCase().includes(q)
    );
  });

  const totalDelivered = clients.reduce((sum, c) => sum + (c.candidates_delivered_count || 0), 0);
  const activeCount = clients.filter((c) => c.status === "active").length;
  const onboardingCount = clients.filter((c) => c.status === "onboarding").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Mes clients</h1>
        <p className="text-[14px] text-zinc-500 mt-1.5">
          {clients.length} clients · {activeCount} actifs · {onboardingCount} en onboarding · {totalDelivered} candidats livrés
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'entreprise ou contact…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {[
            { key: "all", label: "Tous" },
            { key: "active", label: "Actifs" },
            { key: "onboarding", label: "Onboarding" },
            { key: "paused", label: "Pause" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
                statusFilter === s.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Building2 size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-[14px] font-semibold text-zinc-700">Aucun client trouvé</p>
          <p className="text-[13px] text-zinc-500 mt-1">Ajuste tes filtres ou attends que l&apos;admin t&apos;assigne.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/recruiter/clients/${c.id}`}
              className="block bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#2445EB] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-bold text-zinc-900 truncate">{c.company_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        c.plan === "enterprise"
                          ? "bg-purple-50 text-purple-700"
                          : c.plan === "pro"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {c.plan || "—"}
                    </span>
                    {c.status === "onboarding" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700">
                        Onboarding
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500">
                    {c.contact_first_name} {c.contact_last_name}
                    {c.country && <> · {c.country}</>}
                    {c.recruteur_lead && <> · Lead : {c.recruteur_lead}</>}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-700">
                      <Users size={12} className="text-emerald-600" />
                      <span className="font-semibold">{c.candidates_delivered_count || 0}</span>
                      <span className="text-zinc-500">livrés</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-0.5">
                      <TrendingUp size={11} />
                      <span className="tabular-nums">${(c.mrr_usd || 0).toLocaleString()}</span>
                      <span>/mo</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
