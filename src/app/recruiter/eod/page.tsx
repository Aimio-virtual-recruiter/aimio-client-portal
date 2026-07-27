"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  Send,
  PhoneCall,
  UserCheck,
  Users,
  CalendarCheck,
  FileSignature,
  BadgeCheck,
  Trophy,
  Megaphone,
  Clock,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

// Les 8 chiffres du funnel — l'ordre = le parcours réel du candidat.
const QUICK = [
  { key: "prescreenings", label: "Prescreenings", icon: UserCheck, hint: "réalisés" },
  { key: "calls", label: "Appels", icon: PhoneCall, hint: "passés" },
  { key: "submissions", label: "Soumissions", icon: Send, hint: "au client" },
  { key: "interviews_held", label: "Entrevues", icon: CalendarCheck, hint: "client tenues" },
  { key: "offers", label: "Offres", icon: FileSignature, hint: "faites" },
  { key: "offers_accepted", label: "Offres acceptées", icon: BadgeCheck, hint: "par le candidat" },
  { key: "placements", label: "Placements", icon: Trophy, hint: "closés" },
  { key: "postings", label: "Affichages", icon: Megaphone, hint: "publiés" },
] as const;

const DETAIL = [
  { key: "candidates_sourced", label: "Candidats sourcés" },
  { key: "calls_connected", label: "Appels connectés" },
  { key: "linkedin_messages", label: "Messages LinkedIn" },
  { key: "linkedin_replies", label: "Réponses LinkedIn" },
  { key: "inmails_sent", label: "InMails envoyés" },
  { key: "inmails_replies", label: "Réponses InMail" },
  { key: "cold_emails", label: "Cold emails" },
  { key: "email_replies", label: "Réponses email" },
] as const;

type QuickState = Record<(typeof QUICK)[number]["key"], number>;
type DetailState = Record<(typeof DETAIL)[number]["key"], string>;

const emptyQuick = (): QuickState =>
  QUICK.reduce((acc, f) => ({ ...acc, [f.key]: 0 }), {} as QuickState);
const emptyDetail = (): DetailState =>
  DETAIL.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {} as DetailState);

export default function QuickEodPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [quick, setQuick] = useState<QuickState>(emptyQuick);
  const [detail, setDetail] = useState<DetailState>(emptyDetail);
  const [helpNeeded, setHelpNeeded] = useState("");
  const [dayFeedback, setDayFeedback] = useState("");
  const [hours, setHours] = useState("8");
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  // Pré-remplir avec l'EOD du jour s'il existe déjà (correction).
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.getUser();
        const res = await fetch(`/api/recruiter/eod?date=${today}`);
        if (res.ok) {
          const { eod } = await res.json();
          if (eod) {
            setAlreadySaved(true);
            setQuick(
              QUICK.reduce(
                (acc, f) => ({ ...acc, [f.key]: eod[f.key] ?? 0 }),
                {} as QuickState
              )
            );
            setDetail(
              DETAIL.reduce(
                (acc, f) => ({ ...acc, [f.key]: eod[f.key] != null ? String(eod[f.key]) : "" }),
                {} as DetailState
              )
            );
            setHelpNeeded(eod.help_needed || "");
            setDayFeedback(eod.day_feedback || "");
            if (eod.hours_worked != null) setHours(String(eod.hours_worked));
            if (DETAIL.some((f) => eod[f.key] != null)) setShowDetail(true);
          }
        }
      } catch {
        // silencieux — formulaire vierge si l'appel échoue
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  const step = (key: (typeof QUICK)[number]["key"], delta: number) =>
    setQuick((q) => ({ ...q, [key]: Math.max(0, (q[key] || 0) + delta) }));

  const setQuickValue = (key: (typeof QUICK)[number]["key"], raw: string) =>
    setQuick((q) => ({ ...q, [key]: Math.max(0, Math.round(Number(raw) || 0)) }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        eod_date: today,
        ...quick,
        help_needed: helpNeeded,
        day_feedback: dayFeedback,
        hours_worked: hours === "" ? null : Number(hours),
      };
      for (const f of DETAIL) {
        payload[f.key] = detail[f.key] === "" ? null : Number(detail[f.key]);
      }

      const res = await fetch("/api/recruiter/eod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Erreur");
      }
      setAlreadySaved(true);
      toast.success(
        alreadySaved ? "EOD mis à jour ✓" : "EOD envoyé — bonne fin de journée ! 🎉"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
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

  const dateLisible = new Date(today + "T00:00:00").toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/recruiter"
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-[16px] font-bold text-zinc-900">Rapport de fin de journée</h1>
              <p className="text-[11px] text-zinc-500 capitalize">{dateLisible}</p>
            </div>
          </div>
          {alreadySaved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
              <Check size={11} /> Saisi
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Mode rapide — les 8 chiffres */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">
              Ta journée en 8 chiffres
            </h2>
            <span className="text-[11px] text-zinc-400">30 secondes ⏱️</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.key}
                  className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col"
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon size={13} className="text-[#2445EB]" />
                    <span className="text-[12px] font-semibold text-zinc-700">{f.label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => step(f.key, -1)}
                      className="w-9 h-9 shrink-0 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 flex items-center justify-center transition active:scale-95"
                      aria-label={`Diminuer ${f.label}`}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={quick[f.key]}
                      onChange={(e) => setQuickValue(f.key, e.target.value)}
                      className="w-full text-center text-[24px] font-bold text-zinc-900 tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => step(f.key, 1)}
                      className="w-9 h-9 shrink-0 rounded-full bg-[#2445EB] text-white hover:bg-[#1A36C4] flex items-center justify-center transition active:scale-95"
                      aria-label={`Augmenter ${f.label}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-2 text-center">{f.hint}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Note + heures */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700 mb-2">
              <LifeBuoy size={13} className="text-amber-500" /> Aide dont j&apos;ai besoin
            </label>
            <textarea
              value={helpNeeded}
              onChange={(e) => setHelpNeeded(e.target.value)}
              rows={2}
              placeholder="Un blocage ? Un mandat difficile ? Écris-le — on est là. (optionnel)"
              className="w-full text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:border-[#2445EB] resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700 mb-2">
              <MessageSquare size={13} className="text-zinc-400" /> Feedback de la journée
            </label>
            <textarea
              value={dayFeedback}
              onChange={(e) => setDayFeedback(e.target.value)}
              rows={2}
              placeholder="Une victoire, une frustration, une idée. (optionnel)"
              className="w-full text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:border-[#2445EB] resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700">
              <Clock size={13} className="text-zinc-400" /> Heures travaillées
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={24}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-20 text-center text-[16px] font-bold text-zinc-900 tabular-nums bg-zinc-50 rounded-xl border border-zinc-200 px-2 py-1.5 focus:outline-none focus:border-[#2445EB]"
            />
          </div>
        </section>

        {/* Mode détail — optionnel, replié par défaut */}
        <section>
          <button
            type="button"
            onClick={() => setShowDetail((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-zinc-200 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 transition"
          >
            <span className="flex items-center gap-2">
              {showDetail ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Détail sourcing (optionnel)
            </span>
            <span className="text-[10px] text-zinc-400">jamais obligatoire</span>
          </button>
          {showDetail && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {DETAIL.map((f) => (
                <div key={f.key} className="bg-white rounded-xl border border-zinc-200 p-3">
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={detail[f.key]}
                    onChange={(e) =>
                      setDetail((d) => ({ ...d, [f.key]: e.target.value }))
                    }
                    placeholder="—"
                    className="w-full text-[15px] font-semibold text-zinc-900 tabular-nums bg-zinc-50 rounded-lg border border-zinc-200 px-2 py-1.5 focus:outline-none focus:border-[#2445EB]"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Barre de soumission fixe */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-zinc-200 px-6 py-3">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3.5 bg-[#2445EB] text-white rounded-full text-[14px] font-semibold hover:bg-[#1A36C4] transition flex items-center justify-center gap-2 shadow-lg shadow-[#2445EB]/20 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Enregistrement...
              </>
            ) : (
              <>
                <Check size={16} /> {alreadySaved ? "Mettre à jour mon EOD" : "Envoyer mon EOD"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
