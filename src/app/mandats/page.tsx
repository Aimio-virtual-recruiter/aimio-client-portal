"use client";
import Link from "next/link";
import { mockMandates } from "@/lib/mock-data";
import { useI18n } from "@/i18n/provider";
import { MapPin, DollarSign, Building2, Users, ArrowRight } from "lucide-react";

export default function MandatsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2332]">{t("mandates.title")}</h1>
        <p className="text-gray-400 text-sm mt-1">{t("mandates.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {mockMandates.map((mandate) => (
          <Link
            key={mandate.id}
            href={`/mandats/${mandate.id}`}
            className="block bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6 hover:border-[#6C2BD9]/20 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6C2BD9]/10 to-[#8B5CF6]/10 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-[#6C2BD9]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1a2332]">{mandate.title}</h2>
                  <p className="text-xs text-gray-400">{mandate.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold">
                  {t("mandates.active")}
                </span>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-[#6C2BD9] transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin size={13} /> {mandate.location}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <DollarSign size={13} /> {(mandate.salary_min / 1000).toFixed(0)}-{(mandate.salary_max / 1000).toFixed(0)}K$/an
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Building2 size={13} /> {mandate.work_mode}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Users size={13} /> {mandate.candidates_delivered} {t("mandates.candidates").toLowerCase()}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all"
                  style={{ width: `${Math.min((mandate.candidates_delivered / 20) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400 font-medium">{mandate.candidates_delivered}/20</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
