"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getCurrentClientId } from "@/lib/supabase";
import { SearchCriteriaForm, type SearchCriteria, emptyCriteria } from "@/components/SearchCriteriaForm";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Rocket,
} from "lucide-react";

function NewMandatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client") || "";
  const editMandateId = searchParams.get("edit") || "";
  const isEditMode = !!editMandateId;

  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    must_haves: "",
    nice_to_haves: "",
    salary_min: "",
    salary_max: "",
    location: "",
    work_mode: "",
    urgency: "normal",
    team_size: "",
    reporting_to: "",
    start_date: "",
    additional_context: "",
  });
  const [criteria, setCriteria] = useState<SearchCriteria>(emptyCriteria());
  const [submitting, setSubmitting] = useState(false);
  const [loadingMandate, setLoadingMandate] = useState(isEditMode);
  const [clientName, setClientName] = useState<string>("");
  const [result, setResult] = useState<{ success: boolean; message: string; mandate_id?: string; client_id?: string } | null>(null);

  // EDIT MODE: load existing mandate
  useEffect(() => {
    if (!isEditMode) {
      // For new mandate, optionally load client name to display
      if (preselectedClientId) {
        supabase
          .from("clients")
          .select("company_name")
          .eq("id", preselectedClientId)
          .single()
          .then(({ data }) => setClientName(data?.company_name || ""));
      }
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("mandates")
        .select("*, clients(company_name)")
        .eq("id", editMandateId)
        .single();
      if (error || !data) {
        setLoadingMandate(false);
        return;
      }
      // Pre-fill form with existing mandate data
      setForm({
        title: data.title || "",
        department: data.department || "",
        description: data.description || "",
        must_haves: (data.scoring_criteria || [])
          .filter((c: { weight: number }) => c.weight === 10)
          .map((c: { criteria: string }) => c.criteria)
          .join("\n"),
        nice_to_haves: (data.scoring_criteria || [])
          .filter((c: { weight: number }) => c.weight === 5)
          .map((c: { criteria: string }) => c.criteria)
          .join("\n"),
        salary_min: data.salary_min ? String(data.salary_min) : "",
        salary_max: data.salary_max ? String(data.salary_max) : "",
        location: data.location || "",
        work_mode: data.work_mode || "",
        urgency: "normal",
        team_size: "",
        reporting_to: "",
        start_date: "",
        additional_context: "",
      });
      if (data.search_criteria) {
        setCriteria({ ...emptyCriteria(), ...data.search_criteria });
      }
      // Type-cast clients data — Supabase select with relation returns nested object
      const clientsData = data.clients as { company_name?: string } | { company_name?: string }[] | null;
      const cName = Array.isArray(clientsData) ? clientsData[0]?.company_name : clientsData?.company_name;
      setClientName(cName || "");
      setLoadingMandate(false);
    })();
  }, [isEditMode, editMandateId, preselectedClientId]);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      // Use preselected client_id from URL (admin/recruiter creating for a client)
      // OR fall back to auth-resolved client (client creating their own mandate)
      let clientId = preselectedClientId;
      if (!clientId) {
        clientId = (await getCurrentClientId()) || "";
      }
      if (!clientId) {
        setResult({
          success: false,
          message: "Vous devez être connecté ou avoir un client sélectionné pour créer un mandat.",
        });
        setSubmitting(false);
        return;
      }

      // Convert must_haves and nice_to_haves to scoring_criteria array
      const mustHavesArr = form.must_haves
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((criteria) => ({ criteria, weight: 10, score: 0 }));

      const niceToHavesArr = form.nice_to_haves
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((criteria) => ({ criteria, weight: 5, score: 0 }));

      const description = [
        form.description,
        form.team_size ? `\n\nTaille d'équipe : ${form.team_size}` : "",
        form.reporting_to ? `\nRelève de : ${form.reporting_to}` : "",
        form.start_date ? `\nDate de début souhaitée : ${form.start_date}` : "",
        form.urgency !== "normal" ? `\nUrgence : ${form.urgency}` : "",
        form.additional_context ? `\n\nContexte additionnel :\n${form.additional_context}` : "",
      ]
        .filter(Boolean)
        .join("");

      const mandatePayload = {
        company_id: clientId,
        title: form.title,
        department: form.department || null,
        description,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        location: form.location || null,
        work_mode: form.work_mode || null,
        scoring_criteria: [...mustHavesArr, ...niceToHavesArr],
        search_criteria: criteria,
        criteria_updated_at: new Date().toISOString(),
      };

      const { data, error } = isEditMode
        ? await supabase
            .from("mandates")
            .update(mandatePayload)
            .eq("id", editMandateId)
            .select()
            .single()
        : await supabase
            .from("mandates")
            .insert({
              ...mandatePayload,
              status: "pending_review",
              candidates_delivered: 0,
            })
            .select()
            .single();

      if (error) throw error;

      // Send notification to admin via API
      try {
        await fetch("/api/mandates/notify-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandate_id: data.id,
            title: form.title,
            company_id: clientId,
            urgency: form.urgency,
            salary_max: form.salary_max,
          }),
        });
      } catch (notifyError) {
        console.warn("Notification failed:", notifyError);
        // Don't fail the whole submission
      }

      setResult({
        success: true,
        message: isEditMode
          ? "Mandat mis à jour avec succès. Les critères raffinés s'appliqueront aux prochains sourcings."
          : preselectedClientId
          ? "Mandat créé avec critères Recruiter Lite. Tu peux maintenant lancer un sourcing."
          : "Votre mandat a été transmis à votre recruteur dédié. Vous recevrez une confirmation dans les 4 prochaines heures.",
        mandate_id: data.id,
        client_id: clientId,
      });

      // Reset form
      setForm({
        title: "",
        department: "",
        description: "",
        must_haves: "",
        nice_to_haves: "",
        salary_min: "",
        salary_max: "",
        location: "",
        work_mode: "",
        urgency: "normal",
        team_size: "",
        reporting_to: "",
        start_date: "",
        additional_context: "",
      });
      setCriteria(emptyCriteria());
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <Link
        href="/mandats"
        className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6 transition-premium"
      >
        <ArrowLeft size={14} /> Retour aux mandats
      </Link>

      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">
          {isEditMode ? "Modifier le mandat" : "Nouveau mandat"}
        </h1>
        {clientName ? (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#2445EB]/10 border border-[#2445EB]/20 rounded-lg">
            <Briefcase size={12} className="text-[#2445EB]" />
            <span className="text-[12px] text-[#2445EB] font-semibold">Pour le client : {clientName}</span>
          </div>
        ) : (
          <p className="text-[14px] text-zinc-500 mt-2">
            {isEditMode
              ? "Modifiez les critères pour optimiser le sourcing — vos changements s'appliqueront au prochain run."
              : "Votre recruteur dédié prendra contact sous 4 heures."}
          </p>
        )}
      </div>

      {loadingMandate && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex items-center justify-center mb-4">
          <Loader2 size={20} className="animate-spin text-zinc-300" />
          <span className="ml-3 text-[13px] text-zinc-500">Chargement du mandat…</span>
        </div>
      )}

      {result?.success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
            Mandat créé ✓
          </h2>
          <p className="text-[14px] text-zinc-600 leading-relaxed max-w-lg mx-auto mb-6">
            {result.message}
          </p>
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            {preselectedClientId && (
              <Link
                href={`/recruiter/source?client=${result.client_id}&mandate=${result.mandate_id}`}
                className="w-full py-3 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-lg text-[14px] font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-[#2445EB]/20"
              >
                <Rocket size={14} /> Lancer le sourcing maintenant
              </Link>
            )}
            <div className="flex gap-3">
              <Link
                href={`/mandats/${result.mandate_id}`}
                className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
              >
                Voir le mandat
              </Link>
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
              >
                Créer un autre mandat
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Core info */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={14} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">Information principale</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Titre du poste *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="ex: Directeur·trice financier"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    Département
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    placeholder="ex: Finance"
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    Relève de (titre)
                  </label>
                  <input
                    type="text"
                    value={form.reporting_to}
                    onChange={(e) => updateField("reporting_to", e.target.value)}
                    placeholder="ex: VP Finance"
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Description du poste *
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="Décrivez la mission principale, les responsabilités clés, et le contexte de ce poste..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
            </div>
          </div>

          {/* Compensation + Location */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">
                Ce que le client offre <span className="text-zinc-400 font-normal">(infos internes — non utilisé pour le sourcing)</span>
              </h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ℹ️ <strong>Important :</strong> Ces champs (salaire, mode de travail) ne sont <strong>PAS utilisés pour filtrer les candidats LinkedIn</strong> —
                LinkedIn n&apos;expose pas ces infos sur les profils. Ils servent au recruteur pour qualifier le candidat
                (matcher l&apos;offre du client à ses attentes) et apparaissent dans la fiche du candidat livré au client.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Salaire offert min (CAD)
                </label>
                <input
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => updateField("salary_min", e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Salaire offert max (CAD)
                </label>
                <input
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => updateField("salary_max", e.target.value)}
                  placeholder="130000"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  <MapPin size={10} className="inline mr-1" />
                  Lieu du poste
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="ex: Montréal, QC (où sera basé le poste)"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Pour filtrer les candidats par ville, utilise « Géographie » dans Recruiter Lite ↓
                </p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Mode de travail offert
                </label>
                <select
                  value={form.work_mode}
                  onChange={(e) => updateField("work_mode", e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
                >
                  <option value="">—</option>
                  <option value="onsite">100% sur site</option>
                  <option value="hybrid">Hybride</option>
                  <option value="remote">100% Remote</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Pour filtrer les candidats ouverts au remote, coche « Ouvert au télétravail » dans Recruiter Lite ↓
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">Critères</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Must-haves * (1 par ligne)
                </label>
                <textarea
                  required
                  value={form.must_haves}
                  onChange={(e) => updateField("must_haves", e.target.value)}
                  rows={4}
                  placeholder={"ex:\n10+ ans d'expérience en finance corporative\nCPA actif\nBilingue FR/EN\nExpérience PME 50-200 employés"}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9] font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Nice-to-haves (1 par ligne, optionnel)
                </label>
                <textarea
                  value={form.nice_to_haves}
                  onChange={(e) => updateField("nice_to_haves", e.target.value)}
                  rows={3}
                  placeholder={"ex:\nExpérience secteur construction\nMBA\nConnaissance de NetSuite"}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">Contexte additionnel</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Urgence
                </label>
                <select
                  value={form.urgency}
                  onChange={(e) => updateField("urgency", e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
                >
                  <option value="normal">Standard (3-5 sem)</option>
                  <option value="priority">Prioritaire (2-3 sem)</option>
                  <option value="urgent">🔥 Urgent (1-2 sem)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Date de début souhaitée
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Taille d&apos;équipe qu&apos;il/elle gérera
                </label>
                <input
                  type="text"
                  value={form.team_size}
                  onChange={(e) => updateField("team_size", e.target.value)}
                  placeholder="ex: 5-8 personnes"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Contexte additionnel (culture, défis spéciaux, etc.)
                </label>
                <textarea
                  value={form.additional_context}
                  onChange={(e) => updateField("additional_context", e.target.value)}
                  rows={3}
                  placeholder="Ex: Culture très entrepreneuriale, beaucoup d'autonomie demandée. Scale-up en hyper-croissance..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
                />
              </div>
            </div>
          </div>

          {/* Recruiter Lite Filters — same as LinkedIn Recruiter Lite */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-[#2445EB]/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">🎯 Critères Recruiter Lite (40+ filtres)</h2>
                <p className="text-[13px] text-zinc-700 mt-1 leading-relaxed">
                  Mêmes filtres que LinkedIn Recruiter Lite : titres d&apos;emploi, langues, écoles, employeurs cibles, certifications,
                  signaux Open to Work, etc. <strong>Plus tu remplis, meilleur est le sourcing</strong> dès le 1er jour.
                </p>
                <p className="text-[12px] text-[#2445EB] mt-2 font-semibold">
                  {isEditMode
                    ? "↓ Sections ouvertes : modifie les critères et sauve"
                    : "↓ Clique pour ouvrir chaque section et remplir ce qui s'applique"}
                </p>
              </div>
            </div>
          </div>

          <SearchCriteriaForm
            criteria={criteria}
            onChange={setCriteria}
            startStep={1}
            defaultOpen={isEditMode}
          />

          {result && !result.success && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{result.message}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/mandats"
              className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> {isEditMode ? "Sauvegarde..." : "Création..."}
                </>
              ) : isEditMode ? (
                <>
                  <CheckCircle2 size={15} /> Sauvegarder les modifications
                </>
              ) : (
                <>
                  <Send size={15} /> {clientName ? "Créer le mandat" : "Soumettre le mandat"}
                </>
              )}
            </button>
          </div>

          {!isEditMode && !clientName && (
            <p className="text-[11px] text-zinc-400 text-center pt-2">
              Votre recruteur vous contactera sous 4 heures pour un call de briefing.
              Premier shortlist livré en 5-7 jours.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function NewMandatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>}>
      <NewMandatContent />
    </Suspense>
  );
}
