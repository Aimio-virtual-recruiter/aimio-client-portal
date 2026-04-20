"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Trophy,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Mandate {
  id: string;
  title: string;
  company_id: string;
}

interface Candidate {
  id: string;
  name: string;
  current_title: string;
  mandate_id: string;
}

interface Recruiter {
  id: string;
  name: string;
}

export default function NewPlacementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);

  const [form, setForm] = useState({
    candidate_id: "",
    mandate_id: "",
    recruiter_id: "",
    placement_date: new Date().toISOString().substring(0, 10),
    salary_placed: "",
    fee_percentage: "18",
    invoice_date: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      const [m, c, r] = await Promise.all([
        supabase.from("mandates").select("id, title, company_id").order("created_at", { ascending: false }),
        supabase.from("candidates").select("id, name, current_title, mandate_id").order("created_at", { ascending: false }),
        supabase.from("recruiters").select("id, name").eq("is_active", true),
      ]);
      setMandates(m.data ?? []);
      setCandidates(c.data ?? []);
      setRecruiters(r.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Filter candidates by selected mandate
  const availableCandidates = form.mandate_id
    ? candidates.filter((c) => c.mandate_id === form.mandate_id)
    : candidates;

  // Auto-calc fee
  const salary = parseFloat(form.salary_placed) || 0;
  const feePercent = parseFloat(form.fee_percentage) || 0;
  const feeAmount = Math.round(salary * (feePercent / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidate_id || !form.mandate_id || !form.placement_date || !form.salary_placed) {
      setResult({ success: false, message: "Candidat, mandat, date et salaire sont obligatoires" });
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      // Get company_id from mandate
      const mandate = mandates.find((m) => m.id === form.mandate_id);

      const { error } = await supabase.from("placements").insert({
        candidate_id: form.candidate_id,
        mandate_id: form.mandate_id,
        company_id: mandate?.company_id ?? null,
        recruiter_id: form.recruiter_id || null,
        placement_date: form.placement_date,
        salary_placed: salary,
        fee_percentage: feePercent,
        fee_amount: feeAmount,
        invoice_date: form.invoice_date || null,
        notes: form.notes || null,
        payment_received: false,
        retention_check_date: new Date(
          new Date(form.placement_date).getTime() + 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .substring(0, 10),
        retention_status: "active",
      });

      if (error) throw error;

      // Update candidate status to 'placed'
      await supabase
        .from("candidates")
        .update({ status: "placed" })
        .eq("id", form.candidate_id);

      // Mark mandate as filled
      await supabase
        .from("mandates")
        .update({ status: "filled" })
        .eq("id", form.mandate_id);

      setResult({
        success: true,
        message: `🎉 Placement enregistré! Fee de $${feeAmount.toLocaleString()} ajouté au dashboard pilotage. Le candidat passe en "placed" et le mandat en "filled".`,
      });

      // Reset form after success
      setTimeout(() => {
        router.push("/admin/pilotage");
      }, 2500);
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/pilotage" className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6">
        <ArrowLeft size={14} /> Retour au pilotage
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={18} className="text-[#6C2BD9]" />
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
            Enregistrer un placement
          </h1>
        </div>
        <p className="text-[13px] text-zinc-500">
          Félicitations! 🎉 Enregistre ce placement pour mettre à jour ton dashboard et suivre la garantie 12 mois.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mandate + Candidate */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
          <h2 className="text-[13px] font-semibold text-zinc-900 mb-4">
            Le placement
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Mandat * ({mandates.length} disponibles)
              </label>
              <select
                required
                value={form.mandate_id}
                onChange={(e) => setForm({ ...form, mandate_id: e.target.value, candidate_id: "" })}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
              >
                <option value="">— Choisir un mandat —</option>
                {mandates.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Candidat placé * ({availableCandidates.length} {form.mandate_id ? "pour ce mandat" : "en total"})
              </label>
              <select
                required
                value={form.candidate_id}
                onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
              >
                <option value="">— Choisir un candidat —</option>
                {availableCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.current_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Recruteur qui a fermé le deal
              </label>
              <select
                value={form.recruiter_id}
                onChange={(e) => setForm({ ...form, recruiter_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
              >
                <option value="">— Choisir un recruteur —</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Date du placement *
                </label>
                <input
                  type="date"
                  required
                  value={form.placement_date}
                  onChange={(e) => setForm({ ...form, placement_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Date d&apos;émission facture
                </label>
                <input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={14} className="text-emerald-600" />
            <h2 className="text-[13px] font-semibold text-zinc-900">
              Montants
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Salaire placé * (CAD/an)
                </label>
                <input
                  type="number"
                  required
                  value={form.salary_placed}
                  onChange={(e) => setForm({ ...form, salary_placed: e.target.value })}
                  placeholder="140000"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Plan / Fee %
                </label>
                <select
                  value={form.fee_percentage}
                  onChange={(e) => setForm({ ...form, fee_percentage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
                >
                  <option value="18">STANDARD · 18%</option>
                  <option value="20">ESSENTIEL · 20%</option>
                  <option value="22">ÉLITE · 22%</option>
                </select>
              </div>
            </div>

            {/* Live calculation */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-emerald-700 uppercase tracking-wider font-semibold mb-1">
                    Fee calculé (avant taxes)
                  </p>
                  <p className="text-[32px] font-bold text-emerald-700 tabular-nums">
                    ${feeAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-700">
                    ${salary.toLocaleString()} × {feePercent}%
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    + taxes TPS/TVQ (~14.975%) = ~${Math.round(feeAmount * 1.14975).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Notes (optionnel)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="ex: Candidat idéal, a commencé avant fin du préavis. Client super content..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
          />
        </div>

        {result && (
          <div className={`rounded-xl p-4 flex items-start gap-2 ${
            result.success ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
          }`}>
            {result.success ? (
              <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
            )}
            <p className={`text-[13px] ${result.success ? "text-emerald-800" : "text-red-700"}`}>
              {result.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/pilotage"
            className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting || result?.success}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Trophy size={15} /> Enregistrer le placement · ${feeAmount.toLocaleString()}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
