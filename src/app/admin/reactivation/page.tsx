"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Flame,
  Thermometer,
  Snowflake,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
} from "lucide-react";

interface ReactivationCampaign {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  segment: string | null;
  owner: string | null;
  last_mandate_date: string | null;
  last_mandate_role: string | null;
  last_mandate_value: number | null;
  last_contacted_at: string | null;
  response_received: boolean;
  response_type: string | null;
  outcome: string | null;
  notes: string | null;
}

const OWNERS = ["Oli", "Will", "Steph", "Véro", "Noé", "Marc-Antoine"];

export default function ReactivationPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<ReactivationCampaign[]>([]);
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reactivation_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      setCampaigns(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Stats
  const hot = campaigns.filter((c) => c.segment === "hot").length;
  const warm = campaigns.filter((c) => c.segment === "warm").length;
  const cold = campaigns.filter((c) => c.segment === "cold").length;
  const contacted = campaigns.filter((c) => c.last_contacted_at).length;
  const responded = campaigns.filter((c) => c.response_received).length;
  const newMandates = campaigns.filter(
    (c) => c.outcome === "new_mandate"
  ).length;
  const totalMandatesValue = campaigns
    .filter((c) => c.outcome === "new_mandate")
    .reduce((sum, c) => sum + (c.last_mandate_value ?? 0), 0);

  // Filter
  const filtered = campaigns.filter((c) => {
    if (filterSegment !== "all" && c.segment !== filterSegment) return false;
    if (filterOwner !== "all" && c.owner !== filterOwner) return false;
    if (filterStatus !== "all") {
      if (filterStatus === "not_contacted" && c.last_contacted_at) return false;
      if (filterStatus === "contacted_no_reply" && (!c.last_contacted_at || c.response_received)) return false;
      if (filterStatus === "responded" && !c.response_received) return false;
      if (filterStatus === "converted" && c.outcome !== "new_mandate") return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        c.company_name.toLowerCase().includes(s) ||
        (c.contact_name?.toLowerCase().includes(s) ?? false) ||
        (c.contact_email?.toLowerCase().includes(s) ?? false)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-zinc-300" size={20} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
            Campagne de réactivation
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {campaigns.length} entreprises · {contacted} contactées · {responded}{" "}
            réponses · {newMandates} mandats signés
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition-premium btn-press">
          <Plus size={14} /> Importer CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-500" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Hot
            </p>
          </div>
          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">{hot}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Mandat &lt; 12 mois</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer size={14} className="text-[#6C2BD9]" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Warm
            </p>
          </div>
          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">{warm}</p>
          <p className="text-[10px] text-zinc-500 mt-1">12-36 mois</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Snowflake size={14} className="text-blue-500" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Cold
            </p>
          </div>
          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">{cold}</p>
          <p className="text-[10px] text-zinc-500 mt-1">&gt; 36 mois</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="text-[10px] text-emerald-700 uppercase tracking-wider">
              Mandats signés
            </p>
          </div>
          <p className="text-[24px] font-bold text-emerald-700 tabular-nums">
            {newMandates}
          </p>
          <p className="text-[10px] text-emerald-600 mt-1">
            ${totalMandatesValue.toLocaleString()} de valeur
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher entreprise, contact..."
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white focus:outline-none"
          >
            <option value="all">Tous segments</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🌡️ Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>

          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white focus:outline-none"
          >
            <option value="all">Tous owners</option>
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white focus:outline-none"
          >
            <option value="all">Tous statuts</option>
            <option value="not_contacted">Pas contacté</option>
            <option value="contacted_no_reply">Contacté sans réponse</option>
            <option value="responded">A répondu</option>
            <option value="converted">🎯 Converti en mandat</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Thermometer size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-zinc-600 mb-1">
              Aucune entreprise trouvée
            </p>
            <p className="text-[12px] text-zinc-400 max-w-md mx-auto">
              {campaigns.length === 0
                ? "Exécute AIMIO_MEGA_BATCH_SCHEMA.sql et importe ta liste de 500+ clients historiques pour démarrer."
                : "Ajuste tes filtres pour voir des résultats."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="px-5 py-4 flex items-start gap-4 hover:bg-zinc-50/50 transition-all"
              >
                {/* Segment indicator */}
                <div className="shrink-0 mt-1">
                  {c.segment === "hot" && <Flame size={16} className="text-orange-500" />}
                  {c.segment === "warm" && <Thermometer size={16} className="text-[#6C2BD9]" />}
                  {c.segment === "cold" && <Snowflake size={16} className="text-blue-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[14px] font-semibold text-zinc-900 truncate">
                      {c.company_name}
                    </p>
                    {c.outcome === "new_mandate" && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        🎯 CONVERTI
                      </span>
                    )}
                    {c.response_received && c.outcome !== "new_mandate" && (
                      <span className="text-[9px] font-bold text-[#6C2BD9] bg-[#6C2BD9]/10 px-1.5 py-0.5 rounded">
                        A RÉPONDU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                    {c.contact_name && <span>{c.contact_name}</span>}
                    {c.contact_email && (
                      <a
                        href={`mailto:${c.contact_email}`}
                        className="flex items-center gap-1 hover:text-[#6C2BD9]"
                      >
                        <Mail size={10} /> {c.contact_email}
                      </a>
                    )}
                    {c.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {c.contact_phone}
                      </span>
                    )}
                    {c.last_mandate_date && (
                      <span>
                        Dernier mandat :{" "}
                        {new Date(c.last_mandate_date).toLocaleDateString("fr-CA", {
                          month: "short",
                          year: "numeric",
                        })}
                        {c.last_mandate_role && ` (${c.last_mandate_role})`}
                      </span>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-zinc-400 mt-1.5 italic line-clamp-1">
                      {c.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.owner && (
                    <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded">
                      {c.owner}
                    </span>
                  )}
                  {!c.last_contacted_at && (
                    <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                      <Clock size={10} /> Pas contacté
                    </span>
                  )}
                  {c.last_contacted_at && !c.response_received && (
                    <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                      <Mail size={10} />
                      {new Date(c.last_contacted_at).toLocaleDateString("fr-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {campaigns.length === 0 && (
        <div className="mt-6 bg-[#6C2BD9]/5 border border-[#6C2BD9]/20 rounded-xl p-5">
          <p className="text-[13px] font-semibold text-zinc-900 mb-2">
            🚀 Pour démarrer la campagne
          </p>
          <ol className="text-[12px] text-zinc-700 space-y-1 list-decimal list-inside">
            <li>Exécute <code className="bg-white px-1 rounded">AIMIO_MEGA_BATCH_SCHEMA.sql</code> dans Supabase</li>
            <li>Exporte ta liste de 500+ clients historiques en CSV (nom, contact, email, dernier mandat)</li>
            <li>Importe dans la table <code className="bg-white px-1 rounded">reactivation_campaigns</code></li>
            <li>Assigne les owners (Oli/Will/Steph) par segment</li>
            <li>Lance les séquences email du <code className="bg-white px-1 rounded">AIMIO_REACTIVATION_CAMPAIGN.md</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}
