"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, CheckCircle2, Clock, Building2, TrendingUp, Loader2, Rocket, ListChecks, MessageCircle, BarChart3, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Client {
  id: string;
  company_name: string;
  country: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  plan: "starter" | "pro" | "enterprise";
  mrr_usd: number;
  roles_hiring_for: string | null;
  recruteur_lead: string | null;
  status: string;
  first_shortlist_delivered_at: string | null;
  kickoff_call_completed_at: string | null;
  candidates_delivered_count?: number;
  last_delivery_at?: string | null;
}

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("id", user.id)
            .single();
          setUserName(profile?.first_name || user.email || "");
        }

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
    init();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-[14px]">Chargement...</span>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.status === "active" || c.status === "onboarding");
  const totalMrr = activeClients.reduce((sum, c) => sum + (c.mrr_usd || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2445EB] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-[16px]">A</span>
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-zinc-900">Espace Recruteur</h1>
              <p className="text-[11px] text-zinc-500">Aimio Virtual Recruiter — livraison candidats</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userName && (
              <span className="hidden sm:inline text-[12px] text-zinc-500">
                Hi {userName.split(" ")[0]}
              </span>
            )}
            <Link
              href="/recruiter/deliver"
              className="px-5 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition flex items-center gap-2 shadow-lg shadow-[#2445EB]/20"
            >
              <Plus size={14} /> Livrer un candidat
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
        {/* Sub-navigation */}
        <div className="max-w-6xl mx-auto px-6 py-2 border-t border-zinc-100 flex items-center gap-1 overflow-x-auto">
          <NavLink href="/recruiter" label="Dashboard" icon={<Building2 size={12} />} active />
          <NavLink href="/recruiter/source" label="Sourcing auto" icon={<Rocket size={12} />} />
          <NavLink href="/recruiter/queue" label="Queue" icon={<ListChecks size={12} />} />
          <NavLink href="/recruiter/outreach" label="Outreach" icon={<MessageCircle size={12} />} />
          <NavLink href="/recruiter/analytics" label="Analytics" icon={<BarChart3 size={12} />} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-zinc-400" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Clients actifs</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 tracking-tight">{activeClients.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-zinc-400" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">MRR total</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 tracking-tight">${totalMrr.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-zinc-400" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Candidats livrés</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 tracking-tight">
              {activeClients.reduce((sum, c) => sum + (c.candidates_delivered_count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Clients list */}
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-zinc-900 mb-1">Vos clients RV</h2>
          <p className="text-[13px] text-zinc-500">
            Cliquez sur &laquo; Livrer &raquo; pour envoyer un nouveau candidat à un client.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {activeClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={22} className="text-zinc-400" />
            </div>
            <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">Aucun client actif</h3>
            <p className="text-[13px] text-zinc-500 mb-6">Les clients RV onboardés apparaîtront ici.</p>
            <Link
              href="/admin/clients/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-full text-[13px] font-semibold hover:bg-zinc-800 transition"
            >
              Onboarder un client
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 transition"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[17px] font-bold text-zinc-900 truncate">{client.company_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          client.plan === "enterprise"
                            ? "bg-purple-100 text-purple-700"
                            : client.plan === "pro"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {client.plan}
                      </span>
                      {client.status === "onboarding" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Clock size={9} /> Onboarding
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-500 mb-3">
                      <span>
                        📍 {client.country}
                      </span>
                      <span>
                        👤 {client.contact_first_name} {client.contact_last_name}
                      </span>
                      <span>💰 ${client.mrr_usd?.toLocaleString()}/mo</span>
                      {client.recruteur_lead && <span>🎯 {client.recruteur_lead}</span>}
                    </div>

                    {client.roles_hiring_for && (
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                          Postes à combler
                        </p>
                        <p className="text-[13px] text-zinc-700 whitespace-pre-line line-clamp-3">
                          {client.roles_hiring_for}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[12px]">
                      {client.candidates_delivered_count !== undefined && (
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span className="font-semibold">
                            {client.candidates_delivered_count || 0}
                          </span>
                          <span className="text-zinc-500">candidats livrés</span>
                        </div>
                      )}
                      {client.last_delivery_at && (
                        <span className="text-zinc-500">
                          Dernière livraison :{" "}
                          {new Date(client.last_delivery_at).toLocaleDateString("fr-CA")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col gap-2">
                    <Link
                      href={`/recruiter/source?client=${client.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-full text-[12px] font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-md shadow-[#2445EB]/20"
                    >
                      <Rocket size={12} /> Source auto
                    </Link>
                    <Link
                      href={`/recruiter/deliver?client=${client.id}`}
                      className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-full text-[12px] font-semibold hover:bg-zinc-50 transition flex items-center gap-2"
                    >
                      <Plus size={12} /> Livrer
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer help */}
        <div className="mt-10 bg-white rounded-2xl border border-zinc-200 p-6" id="help-footer">
          <h3 className="text-[14px] font-bold text-zinc-900 mb-3">Besoin d&apos;aide ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
            <div>
              <p className="font-semibold text-zinc-700 mb-1">📖 Playbook complet</p>
              <p className="text-zinc-500">
                Voir AIMIO_RV_RECRUITER_ENABLEMENT.md sur le Desktop partagé
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-700 mb-1">❓ Questions</p>
              <p className="text-zinc-500">Slack #rv-delivery ou marc@aimiorecrutement.com</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-700 mb-1">🚨 Escalade client</p>
              <p className="text-zinc-500">Direct à Marc-Antoine pour les 30 premiers jours</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition whitespace-nowrap ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
