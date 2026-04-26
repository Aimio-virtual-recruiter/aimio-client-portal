"use client";
import { useEffect, useState } from "react";
import { supabase, getCurrentClientId } from "@/lib/supabase";
import { Mail, Phone, Calendar, MessageCircle } from "lucide-react";

interface Recruiter {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  specialty: string | null;
  is_online: boolean;
  calendly_url: string | null;
  linkedin_url: string | null;
}

export function AimioTeamWidget({ compact = false }: { compact?: boolean }) {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const clientId = await getCurrentClientId();
      // Get the company's assigned recruiters (skip if not authed — fallback below)
      const { data: company } = clientId
        ? await supabase
            .from("companies")
            .select("primary_recruiter_id, secondary_recruiter_id, account_manager_id")
            .eq("id", clientId)
            .single()
        : { data: null };

      if (company) {
        const ids = [
          company.account_manager_id,
          company.primary_recruiter_id,
          company.secondary_recruiter_id,
        ].filter(Boolean);

        if (ids.length > 0) {
          const { data } = await supabase
            .from("recruiters")
            .select("*")
            .in("id", ids);
          setRecruiters(data ?? []);
        }
      }

      // Fallback: show first 3 active recruiters
      if (recruiters.length === 0) {
        const { data } = await supabase
          .from("recruiters")
          .select("*")
          .eq("is_active", true)
          .limit(3);
        setRecruiters(data ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || recruiters.length === 0) {
    return null; // Silently hide if no data yet
  }

  const mainRecruiter = recruiters[0];
  const additionalRecruiters = recruiters.slice(1, 3);

  if (compact) {
    // Compact: just avatars + name for sidebar
    return (
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
          Votre équipe Aimio
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            {mainRecruiter.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainRecruiter.photo_url}
                alt={mainRecruiter.name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6C2BD9] flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white">
                  {mainRecruiter.name
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")}
                </span>
              </div>
            )}
            {mainRecruiter.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-zinc-900 truncate">
              {mainRecruiter.name}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">{mainRecruiter.title}</p>
          </div>
        </div>
      </div>
    );
  }

  // Full widget
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
            Votre équipe Aimio
          </p>
          <p className="text-[13px] font-semibold text-zinc-900">
            Dédiée à votre succès
          </p>
        </div>
        <div className="flex -space-x-2">
          {additionalRecruiters.map((r) => (
            <div
              key={r.id}
              className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center"
              title={r.name}
            >
              <span className="text-[9px] font-semibold text-white">
                {r.name
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main recruiter card */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative shrink-0">
          {mainRecruiter.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainRecruiter.photo_url}
              alt={mainRecruiter.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-zinc-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6C2BD9] flex items-center justify-center">
              <span className="text-[16px] font-semibold text-white">
                {mainRecruiter.name
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
          )}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full ${
              mainRecruiter.is_online ? "bg-emerald-500" : "bg-zinc-300"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-zinc-900">
            {mainRecruiter.name}
          </h3>
          <p className="text-[12px] text-zinc-500">{mainRecruiter.title}</p>
          {mainRecruiter.specialty && (
            <p className="text-[11px] text-[#6C2BD9] mt-1 font-medium">
              {mainRecruiter.specialty}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            {mainRecruiter.is_online ? (
              <>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-medium">
                  En ligne maintenant
                </span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                <span className="text-[10px] text-zinc-400">Répond sous 4h</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {mainRecruiter.email && (
          <a
            href={`mailto:${mainRecruiter.email}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <Mail size={12} />
            Courriel
          </a>
        )}
        {mainRecruiter.phone && (
          <a
            href={`tel:${mainRecruiter.phone}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <Phone size={12} />
            Appeler
          </a>
        )}
        <a
          href="/messages"
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
        >
          <MessageCircle size={12} />
          Chat
        </a>
        <a
          href="#request-meeting"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#6C2BD9] text-white rounded-lg text-[11px] font-semibold hover:bg-[#5521B5] transition-all"
        >
          <Calendar size={12} />
          Rencontre
        </a>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-zinc-400 mt-4 text-center">
        Support 24/7 · Réponse garantie sous 4h
      </p>
    </div>
  );
}
