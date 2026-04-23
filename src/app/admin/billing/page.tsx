"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Send, CheckCircle2, ExternalLink, Loader2, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  country: string;
  plan: "starter" | "pro" | "enterprise";
  mrr_usd: number;
  billing_start_date: string;
  billing_status: string;
  stripe_customer_id: string | null;
  status: string;
  recruteur_lead: string | null;
  created_at: string;
}

export default function BillingAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicing, setInvoicing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string; invoice_url?: string }>>({});

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .in("status", ["onboarding", "active"])
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const sendInvoice = async (clientId: string) => {
    setInvoicing(clientId);
    try {
      const res = await fetch("/api/billing/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults({
          ...results,
          [clientId]: { success: true, message: data.message, invoice_url: data.invoice_url },
        });
        setTimeout(loadClients, 1000);
      } else {
        setResults({
          ...results,
          [clientId]: { success: false, message: data.error || "Erreur" },
        });
      }
    } catch (err) {
      setResults({
        ...results,
        [clientId]: { success: false, message: err instanceof Error ? err.message : "Erreur" },
      });
    }
    setInvoicing(null);
  };

  // Metrics
  const totalMRR = clients.reduce((sum, c) => sum + c.mrr_usd, 0);
  const totalARR = totalMRR * 12;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const onboardingCount = clients.filter((c) => c.status === "onboarding").length;

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
              <ArrowLeft size={14} /> Retour admin
            </Link>
            <h1 className="text-[32px] font-bold text-zinc-900 tracking-tight">Billing & Invoices</h1>
            <p className="text-[14px] text-zinc-500 mt-2">
              Gestion des factures mensuelles clients RV via Stripe.
            </p>
          </div>
          <Link
            href="/admin/clients/new"
            className="px-5 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition"
          >
            + Nouveau client
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-[#2445EB]" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">MRR actuel</p>
            </div>
            <p className="text-[28px] font-bold text-zinc-900">${totalMRR.toLocaleString()}</p>
            <p className="text-[12px] text-zinc-500 mt-1">USD / mois</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ARR</p>
            </div>
            <p className="text-[28px] font-bold text-zinc-900">${totalARR.toLocaleString()}</p>
            <p className="text-[12px] text-zinc-500 mt-1">USD / an</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-purple-600" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Clients actifs</p>
            </div>
            <p className="text-[28px] font-bold text-zinc-900">{activeCount}</p>
            <p className="text-[12px] text-zinc-500 mt-1">+ {onboardingCount} en onboarding</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-orange-500" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Progression $72M</p>
            </div>
            <p className="text-[28px] font-bold text-zinc-900">{((totalARR / 72_000_000) * 100).toFixed(4)}%</p>
            <p className="text-[12px] text-zinc-500 mt-1">de l&apos;objectif 3 ans</p>
          </div>
        </div>

        {/* Clients list */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-zinc-900">Clients</h2>
            <span className="text-[12px] text-zinc-500">{clients.length} client{clients.length > 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={24} className="animate-spin text-zinc-400 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-500">Chargement...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[14px] text-zinc-500 mb-4">Aucun client actif pour le moment.</p>
              <Link
                href="/admin/clients/new"
                className="inline-block px-5 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition"
              >
                Onboarder le premier client
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {clients.map((client) => {
                const result = results[client.id];
                const isInvoicing = invoicing === client.id;
                const daysSinceStart = Math.floor((Date.now() - new Date(client.billing_start_date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={client.id} className="p-6 hover:bg-zinc-50 transition">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Client info */}
                      <div className="md:col-span-4">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-[15px] font-bold text-zinc-900">{client.company_name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            client.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                            client.plan === "pro" ? "bg-[#2445EB]/10 text-[#2445EB]" :
                            "bg-zinc-100 text-zinc-700"
                          }`}>
                            {client.plan}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-600">
                          {client.contact_first_name} {client.contact_last_name}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {client.contact_email} · {client.country}
                        </p>
                      </div>

                      {/* MRR */}
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">MRR</p>
                        <p className="text-[18px] font-bold text-zinc-900">${client.mrr_usd}</p>
                      </div>

                      {/* Billing start */}
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Billing start</p>
                        <p className="text-[12px] text-zinc-700">
                          {new Date(client.billing_start_date).toLocaleDateString("fr-CA")}
                        </p>
                        <p className="text-[10px] text-zinc-400">Il y a {daysSinceStart} jours</p>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                          client.status === "active" ? "bg-emerald-100 text-emerald-700" :
                          client.status === "onboarding" ? "bg-amber-100 text-amber-700" :
                          "bg-zinc-100 text-zinc-700"
                        }`}>
                          {client.status}
                        </span>
                        {client.stripe_customer_id && (
                          <p className="text-[10px] text-zinc-400 mt-1">
                            Stripe: {client.stripe_customer_id.substring(0, 10)}...
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <div className="md:col-span-2 text-right">
                        {result?.success ? (
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end text-emerald-600 mb-1">
                              <CheckCircle2 size={14} />
                              <span className="text-[11px] font-semibold">Envoyée</span>
                            </div>
                            {result.invoice_url && (
                              <a
                                href={result.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#2445EB] hover:underline inline-flex items-center gap-1"
                              >
                                Voir invoice <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => sendInvoice(client.id)}
                            disabled={isInvoicing}
                            className="px-4 py-2 bg-[#2445EB] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1A36C4] disabled:opacity-50 transition inline-flex items-center gap-2"
                          >
                            {isInvoicing ? (
                              <><Loader2 size={12} className="animate-spin" /> Envoi...</>
                            ) : (
                              <><Send size={12} /> Envoyer facture</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {result && !result.success && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-red-700">{result.message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-[13px] font-bold text-blue-900 mb-2">💡 Comment ça marche</p>
          <ul className="text-[13px] text-blue-800 space-y-1 ml-4 list-disc">
            <li>Clique <strong>&ldquo;Envoyer facture&rdquo;</strong> → Stripe crée un Customer (si pas déjà), génère la facture, et l&apos;envoie par email au client automatiquement</li>
            <li>Payment terms : Net 7 (client a 7 jours pour payer)</li>
            <li>Le client reçoit un lien Stripe sécurisé pour payer en 2 clics</li>
            <li>Une fois payé, le webhook Stripe update automatiquement le status dans la DB</li>
            <li>Répéter mensuellement (ou automatiser avec un cron plus tard)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
