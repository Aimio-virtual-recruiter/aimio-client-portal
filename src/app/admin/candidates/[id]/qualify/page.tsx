"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, type Candidate } from "@/lib/supabase";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  Globe2,
  Briefcase,
} from "lucide-react";

interface QualifyForm {
  qualified_by: string;
  discovery_call_notes: string;
  confirmed_salary_min: string;
  confirmed_salary_max: string;
  confirmed_start_date: string;
  notice_period_days: string;
  confirmed_work_mode: string;
  confirmed_location: string;
  english_level: string;
  french_level: string;
  currently_employed: boolean;
  actively_interviewing: boolean;
  competing_offers: string;
  recruiter_recommendation: "strong_yes" | "yes" | "maybe" | "no" | "";
  recruiter_assessment: string;
}

export default function QualifyCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    formatted_profile?: {
      client_facing_profile: string;
      client_facing_strengths: string[];
      client_facing_concerns: string[];
      client_facing_motivation: string;
    };
  } | null>(null);

  const [form, setForm] = useState<QualifyForm>({
    qualified_by: "",
    discovery_call_notes: "",
    confirmed_salary_min: "",
    confirmed_salary_max: "",
    confirmed_start_date: "",
    notice_period_days: "",
    confirmed_work_mode: "",
    confirmed_location: "",
    english_level: "",
    french_level: "",
    currently_employed: true,
    actively_interviewing: false,
    competing_offers: "",
    recruiter_recommendation: "",
    recruiter_assessment: "",
  });

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id)
        .single();
      if (err) setError(err.message);
      setCandidate(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const updateField = <K extends keyof QualifyForm>(
    field: K,
    value: QualifyForm[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.recruiter_recommendation || !form.qualified_by || !form.discovery_call_notes) {
      setError("Recruteur, notes du call et recommandation sont obligatoires");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/qualify-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: id,
          qualified_by: form.qualified_by,
          discovery_call_notes: form.discovery_call_notes,
          confirmed_salary_min: form.confirmed_salary_min ? parseFloat(form.confirmed_salary_min) : undefined,
          confirmed_salary_max: form.confirmed_salary_max ? parseFloat(form.confirmed_salary_max) : undefined,
          confirmed_start_date: form.confirmed_start_date || undefined,
          notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : undefined,
          confirmed_work_mode: form.confirmed_work_mode || undefined,
          confirmed_location: form.confirmed_location || undefined,
          english_level: form.english_level || undefined,
          french_level: form.french_level || undefined,
          currently_employed: form.currently_employed,
          actively_interviewing: form.actively_interviewing,
          competing_offers: form.competing_offers || undefined,
          recruiter_recommendation: form.recruiter_recommendation,
          recruiter_assessment: form.recruiter_assessment || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Qualification échouée");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setSubmitting(false);
  };

  const handleDeliverToClient = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          internal_status: "approved",
          status: "new",
          delivered_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="text-red-700 text-[14px]">Candidat introuvable</p>
        <Link href="/admin" className="text-red-600 underline text-[12px] mt-2 inline-block">
          ← Retour au dashboard
        </Link>
      </div>
    );
  }

  // RESULT VIEW — Claude has formatted the profile
  if (result?.formatted_profile) {
    const fp = result.formatted_profile;
    return (
      <div className="max-w-4xl">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-semibold text-emerald-900">
              Candidat qualifié avec succès
            </p>
            <p className="text-[12px] text-emerald-700 mt-1">
              Claude a généré un dossier client-facing professionnel basé sur tes notes de discovery call.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-4 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-[#6C2BD9]" />
            <h2 className="text-[14px] font-semibold text-zinc-900">
              Profil client-facing (généré par Claude)
            </h2>
          </div>
          <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50 rounded-lg p-4 border border-zinc-100">
            {fp.client_facing_profile}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider mb-3">
              Forces
            </p>
            <ul className="space-y-1.5">
              {fp.client_facing_strengths.map((s, i) => (
                <li key={i} className="text-[12px] text-zinc-700 flex gap-2">
                  <span className="text-emerald-600">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-[11px] text-zinc-600 font-semibold uppercase tracking-wider mb-3">
              Points d&apos;attention
            </p>
            <ul className="space-y-1.5">
              {fp.client_facing_concerns.map((c, i) => (
                <li key={i} className="text-[12px] text-zinc-700 flex gap-2">
                  <span className="text-zinc-500">⚠</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#6C2BD9]/5 border border-[#6C2BD9]/20 rounded-xl p-5 mb-6">
          <p className="text-[11px] text-[#6C2BD9] font-semibold uppercase tracking-wider mb-2">
            Motivation
          </p>
          <p className="text-[13px] text-zinc-800">{fp.client_facing_motivation}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeliverToClient}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold transition-premium btn-press"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Livrer au client
          </button>
          <Link
            href={`/admin/candidates/${id}/qualify`}
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="text-[12px] text-zinc-500 hover:text-zinc-900"
          >
            ← Modifier les notes
          </Link>
        </div>
      </div>
    );
  }

  // FORM VIEW
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 transition-premium"
        >
          <ArrowLeft size={14} /> Retour au dashboard
        </Link>
      </div>

      {/* Candidate header */}
      <div className="bg-zinc-900 text-white rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-[14px] font-semibold">
              {candidate.name
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-[18px] font-bold">{candidate.name}</h1>
            <p className="text-[12px] text-zinc-400">
              {candidate.current_title} · {candidate.current_company} · Score IA initial : {candidate.score}/10
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase">Qualification</p>
            <p className="text-[12px] text-amber-400 font-semibold">En cours</p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-[#6C2BD9]/5 border border-[#6C2BD9]/20 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-2">
          <Phone size={15} className="text-[#6C2BD9] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#6C2BD9] mb-1">
              Discovery call avec le candidat
            </p>
            <p className="text-[12px] text-zinc-700 leading-relaxed">
              Cette étape solidifie le lead AVANT de l&apos;envoyer au client. Fais le call (15-30 min), valide les
              attentes, capture les notes ici. Claude générera un dossier client-facing professionnel.
            </p>
          </div>
        </div>
      </div>

      {/* Recruiter info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Recruteur qui a fait le call *
        </label>
        <input
          type="text"
          value={form.qualified_by}
          onChange={(e) => updateField("qualified_by", e.target.value)}
          placeholder="ex: Frédéric Lavergne"
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
        />
      </div>

      {/* Discovery notes */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Notes du discovery call *
        </label>
        <p className="text-[11px] text-zinc-400 mb-3">
          Capture tout ce qui est important : motivations réelles, contexte personnel, signaux verbaux, niveau d&apos;intérêt, doutes, questions posées par le candidat...
        </p>
        <textarea
          value={form.discovery_call_notes}
          onChange={(e) => updateField("discovery_call_notes", e.target.value)}
          rows={6}
          placeholder="ex: Très intéressé. Cherche un environnement plus entrepreneurial. Frustré par la lenteur de décision dans son poste actuel. Demande beaucoup de questions sur la culture et l'autonomie. Mentionne avoir 1 autre offre en cours mais préférerait travailler avec nous si culture matches. Bilingue parfait. Disponible pour interview cette semaine..."
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
        />
      </div>

      {/* Validated data — 2 columns */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <h3 className="text-[13px] font-semibold text-zinc-900 mb-4">
          Données validées en call
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Salary */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <DollarSign size={11} /> Salaire confirmé (min)
            </label>
            <input
              type="number"
              value={form.confirmed_salary_min}
              onChange={(e) => updateField("confirmed_salary_min", e.target.value)}
              placeholder="120000"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <DollarSign size={11} /> Salaire confirmé (max)
            </label>
            <input
              type="number"
              value={form.confirmed_salary_max}
              onChange={(e) => updateField("confirmed_salary_max", e.target.value)}
              placeholder="140000"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          {/* Start date + notice period */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Calendar size={11} /> Date de début souhaitée
            </label>
            <input
              type="date"
              value={form.confirmed_start_date}
              onChange={(e) => updateField("confirmed_start_date", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Préavis (jours)
            </label>
            <input
              type="number"
              value={form.notice_period_days}
              onChange={(e) => updateField("notice_period_days", e.target.value)}
              placeholder="14"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          {/* Work mode + location */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Briefcase size={11} /> Mode de travail
            </label>
            <select
              value={form.confirmed_work_mode}
              onChange={(e) => updateField("confirmed_work_mode", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
            >
              <option value="">—</option>
              <option value="remote">100% Remote</option>
              <option value="hybrid">Hybride</option>
              <option value="onsite">Sur site</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <MapPin size={11} /> Localisation
            </label>
            <input
              type="text"
              value={form.confirmed_location}
              onChange={(e) => updateField("confirmed_location", e.target.value)}
              placeholder="ex: Toronto, ON"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Globe2 size={11} /> Niveau anglais
            </label>
            <select
              value={form.english_level}
              onChange={(e) => updateField("english_level", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
            >
              <option value="">—</option>
              <option value="native">Natif</option>
              <option value="fluent">Courant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="basic">Basique</option>
              <option value="none">Aucun</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Globe2 size={11} /> Niveau français
            </label>
            <select
              value={form.french_level}
              onChange={(e) => updateField("french_level", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
            >
              <option value="">—</option>
              <option value="native">Natif</option>
              <option value="fluent">Courant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="basic">Basique</option>
              <option value="none">Aucun</option>
            </select>
          </div>
        </div>

        {/* Status checkboxes */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] cursor-pointer hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={form.currently_employed}
              onChange={(e) => updateField("currently_employed", e.target.checked)}
              className="w-4 h-4 accent-[#6C2BD9]"
            />
            Actuellement en poste
          </label>
          <label className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] cursor-pointer hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={form.actively_interviewing}
              onChange={(e) => updateField("actively_interviewing", e.target.checked)}
              className="w-4 h-4 accent-[#6C2BD9]"
            />
            Interview ailleurs en parallèle
          </label>
        </div>

        {/* Competing offers */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Offres compétitrices (si applicable)
          </label>
          <input
            type="text"
            value={form.competing_offers}
            onChange={(e) => updateField("competing_offers", e.target.value)}
            placeholder="ex: 1 offre verbale d'une fintech à $135k, décision dans 2 semaines"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">
          Évaluation du recruteur *
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { value: "strong_yes", label: "🔥 Strong Yes", color: "emerald" },
            { value: "yes", label: "✅ Yes", color: "emerald" },
            { value: "maybe", label: "🟡 Maybe", color: "zinc" },
            { value: "no", label: "❌ No", color: "red" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => updateField("recruiter_recommendation", r.value as QualifyForm["recruiter_recommendation"])}
              className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-premium ${
                form.recruiter_recommendation === r.value
                  ? r.color === "emerald"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                    : r.color === "red"
                    ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                    : "bg-zinc-100 border-zinc-500 text-zinc-700 ring-1 ring-zinc-500"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Évaluation libre (ce que tu as vu/entendu pendant le call)
        </label>
        <textarea
          value={form.recruiter_assessment}
          onChange={(e) => updateField("recruiter_assessment", e.target.value)}
          rows={3}
          placeholder="ex: Profil très solide. Communication claire et structurée. Vraies motivations alignées avec le rôle. Salary flexible. Notice court. Recommande fortement de l'interviewer cette semaine."
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-[#6C2BD9]"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-4 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[14px] font-semibold transition-premium btn-press flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Claude génère le dossier client...
          </>
        ) : (
          <>
            <Sparkles size={16} /> Qualifier + Générer dossier client
          </>
        )}
      </button>
    </div>
  );
}
