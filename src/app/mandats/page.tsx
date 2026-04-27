"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { MapPin, DollarSign, Building2, Users, ArrowRight, Loader2, Briefcase, Plus } from "lucide-react";

interface MandateRow {
  id: string;
  company_id: string;
  title: string | null;
  department: string | null;
  location: string | null;
  work_mode: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  candidates_delivered: number | null;
  search_criteria: Record<string, unknown> | null;
  created_at: string;
  clients?: { company_name: string } | null;
}

export default function MandatsPage() {
  const { t } = useI18n();
  const [mandates, setMandates] = useState<MandateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, client_company_id")
          .eq("id", user.id)
          .single();

        setUserRole(profile?.role || null);

        // Build query — admin/recruiter sees all, client sees only their own
        let query = supabase
          .from("mandates")
          .select("*, clients(company_name)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (profile?.role === "client" && profile.client_company_id) {
          query = query.eq("company_id", profile.client_company_id);
        }

        const { data } = await query;
        setMandates((data as MandateRow[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  const isAdminOrRecruiter = userRole === "admin" || userRole === "recruiter";

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{t("mandates.title")}</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {mandates.length} mandat{mandates.length > 1 ? "s" : ""} {isAdminOrRecruiter ? "(tous clients)" : ""}
          </p>
        </div>
        <Link
          href="/mandats/nouveau"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-lg text-[13px] font-semibold hover:opacity-90 transition shadow-md"
        >
          <Plus size={14} /> Nouveau mandat
        </Link>
      </div>

      {mandates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Briefcase size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-[14px] font-semibold text-zinc-700">Aucun mandat encore</p>
          <p className="text-[13px] text-zinc-500 mt-1 mb-4">Créez votre premier mandat avec critères Recruiter Lite.</p>
          <Link
            href="/mandats/nouveau"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2445EB] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1A36C4] transition"
          >
            <Plus size={12} /> Créer le 1er mandat
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mandates.map((mandate) => {
            const criteriaCount = mandate.search_criteria
              ? Object.values(mandate.search_criteria).filter((v) => Array.isArray(v) ? v.length > 0 : !!v).length
              : 0;
            const statusColor =
              mandate.status === "active" ? "bg-emerald-50 text-emerald-700" :
              mandate.status === "pending_review" ? "bg-amber-50 text-amber-700" :
              mandate.status === "filled" ? "bg-blue-50 text-blue-700" :
              "bg-zinc-100 text-zinc-700";
            const statusLabel =
              mandate.status === "active" ? "Actif" :
              mandate.status === "pending_review" ? "En revue" :
              mandate.status === "filled" ? "Comblé" :
              mandate.status === "paused" ? "Pause" :
              mandate.status;

            return (
              <Link
                key={mandate.id}
                href={`/mandats/${mandate.id}`}
                className="block bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-[#2445EB]/40 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-[15px] font-bold text-zinc-900">{mandate.title || "Sans titre"}</h2>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {criteriaCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                          ✓ {criteriaCount} critères
                        </span>
                      )}
                    </div>
                    {/* Client name — clearly visible */}
                    {isAdminOrRecruiter && mandate.clients?.company_name && (
                      <div className="inline-flex items-center gap-1 text-[12px] text-[#2445EB] font-semibold mb-1">
                        <Building2 size={11} /> {mandate.clients.company_name}
                      </div>
                    )}
                    {mandate.department && (
                      <p className="text-[11px] text-zinc-400">{mandate.department}</p>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-zinc-300 group-hover:text-[#2445EB] transition shrink-0" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mandate.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <MapPin size={11} /> {mandate.location}
                    </div>
                  )}
                  {(mandate.salary_min || mandate.salary_max) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <DollarSign size={11} />
                      {mandate.salary_min ? `${(mandate.salary_min / 1000).toFixed(0)}K` : "?"}-
                      {mandate.salary_max ? `${(mandate.salary_max / 1000).toFixed(0)}K` : "?"}$
                    </div>
                  )}
                  {mandate.work_mode && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Building2 size={11} /> {mandate.work_mode}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Users size={11} /> {mandate.candidates_delivered || 0} livrés
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
