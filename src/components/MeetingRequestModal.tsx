"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const DEMO_COMPANY_ID = "11111111-1111-1111-1111-111111111111";

export function MeetingRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    requested_by_name: "",
    requested_by_email: "",
    topic: "Discovery call",
    preferred_date: "",
    preferred_time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const { error } = await supabase.from("meeting_requests").insert({
        company_id: DEMO_COMPANY_ID,
        requested_by_name: form.requested_by_name,
        requested_by_email: form.requested_by_email,
        topic: form.topic,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        notes: form.notes || null,
        status: "pending",
      });

      if (error) throw error;

      setResult({
        success: true,
        message:
          "Demande reçue! Votre recruteur va vous contacter dans les prochaines heures pour confirmer l'horaire.",
      });
      setForm({
        requested_by_name: "",
        requested_by_email: "",
        topic: "Discovery call",
        preferred_date: "",
        preferred_time: "",
        notes: "",
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6C2BD9]/10 rounded-xl flex items-center justify-center">
              <Calendar size={18} className="text-[#6C2BD9]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">
                Demander une rencontre
              </h2>
              <p className="text-[11px] text-zinc-500">
                Votre recruteur confirmera un créneau sous peu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900"
          >
            <X size={16} />
          </button>
        </div>

        {/* Success state */}
        {result?.success ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">
              Demande envoyée!
            </h3>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              {result.message}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Topic */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Sujet de la rencontre
              </label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
              >
                <option value="Discovery call">Discovery call (1er contact)</option>
                <option value="Weekly sync">Suivi hebdomadaire</option>
                <option value="Nouveau mandat">Discussion nouveau mandat</option>
                <option value="Évaluation candidats">Évaluation candidats livrés</option>
                <option value="Urgent">Question urgente</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Name + email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Votre nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.requested_by_name}
                  onChange={(e) => setForm({ ...form, requested_by_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Courriel *
                </label>
                <input
                  type="email"
                  required
                  value={form.requested_by_email}
                  onChange={(e) => setForm({ ...form, requested_by_email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
            </div>

            {/* Preferred date + time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Plage horaire
                </label>
                <select
                  value={form.preferred_time}
                  onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
                >
                  <option value="">—</option>
                  <option value="Matin (8-11h)">Matin (8-11h)</option>
                  <option value="Midi (11-14h)">Midi (11-14h)</option>
                  <option value="Après-midi (14-17h)">Après-midi (14-17h)</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Notes / contexte (optionnel)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Ex: On veut discuter des nouveaux mandats construction pour le T2..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
              />
            </div>

            {result && !result.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[12px] text-red-700">{result.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Envoi...
                  </>
                ) : (
                  <>Envoyer la demande</>
                )}
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 text-center pt-2">
              Votre recruteur confirmera un horaire précis dans les 4 heures ouvrables
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
