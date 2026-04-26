"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Briefcase,
  Sparkles,
  Loader2,
  ExternalLink,
  Mail,
  AlertCircle,
} from "lucide-react";

interface SourcedCandidate {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  location_city: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean | null;
  ai_score: number | null;
  ai_verdict: string | null;
  ai_strengths: string[] | null;
  ai_concerns: string[] | null;
  ai_personalization_hooks: string[] | null;
  qualification_notes: string | null;
  salary_expectation: string | null;
  availability: string | null;
  status: string;
  delivered_at: string | null;
  client_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  delivered: { label: "À examiner", color: "bg-blue-50 text-blue-700" },
  client_interested: { label: "Intéressé — entrevue planifiée", color: "bg-emerald-50 text-emerald-700" },
  client_not_interested: { label: "Pas intéressé", color: "bg-red-50 text-red-700" },
  hired: { label: "Embauché", color: "bg-emerald-100 text-emerald-800" },
  qualifying: { label: "En qualification", color: "bg-amber-50 text-amber-700" },
  qualified: { label: "Qualifié", color: "bg-amber-50 text-amber-700" },
  outreached: { label: "Approché", color: "bg-zinc-100 text-zinc-700" },
};

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<SourcedCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"interested" | "not_interested" | "viewed" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.id) return;
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: fetchError } = await supabase
          .from("sourced_candidates")
          .select("*")
          .eq("id", params.id as string)
          .single();
        if (fetchError) {
          setError("Ce candidat n'existe pas ou vous n'y avez pas accès.");
        } else {
          setCandidate(data as SourcedCandidate);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleDecision = async (newDecision: "interested" | "not_interested" | "viewed") => {
    if (!candidate) return;
    setDecision(newDecision);
    if (newDecision === "viewed") {
      // Just open the contact compositor — no DB write
      return;
    }
  };

  const handleSubmit = async () => {
    if (!candidate || !decision) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const newStatus = decision === "interested" ? "client_interested" : "client_not_interested";
      const { error: updateError } = await supabase
        .from("sourced_candidates")
        .update({
          status: newStatus,
          client_feedback_reason: decision === "not_interested" ? reason : null,
          client_feedback_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);

      if (updateError) throw updateError;

      // Log activity for the recruiter to see
      await supabase.from("activities").insert({
        client_id: candidate.client_id,
        candidate_id: candidate.id,
        type: decision === "interested" ? "client_interested" : "client_not_interested",
        details: decision === "not_interested" ? reason : null,
        created_at: new Date().toISOString(),
      }).then(() => null, () => null); // best-effort

      setSubmitted(true);
      setCandidate({ ...candidate, status: newStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-zinc-300" />
        </main>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 max-w-3xl">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-600 mb-6">
            <ArrowLeft size={13} /> Retour
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-red-800">Candidat introuvable</p>
              <p className="text-[13px] text-red-700 mt-1">{error || "Ce candidat n'existe plus dans votre portail."}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fullName = candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Sans nom";
  const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
  const score = candidate.ai_score || 0;
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-zinc-500";
  const statusBadge = STATUS_LABELS[candidate.status] || { label: candidate.status, color: "bg-zinc-100 text-zinc-700" };
  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(", ");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 max-w-5xl">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-600 transition mb-6">
          <ArrowLeft size={13} /> Retour aux candidats
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] flex items-center justify-center ring-2 ring-white shadow-sm shrink-0 text-white font-semibold">
              {initials}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight">{fullName}</h1>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[13px] text-zinc-600">
                {candidate.current_title || "—"}
                {candidate.current_company && <> · {candidate.current_company}</>}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                {location && <span className="flex items-center gap-1 text-[11px] text-zinc-500"><MapPin size={11} />{location}</span>}
                {candidate.salary_expectation && <span className="flex items-center gap-1 text-[11px] text-zinc-500"><DollarSign size={11} />{candidate.salary_expectation}</span>}
                {candidate.availability && <span className="flex items-center gap-1 text-[11px] text-zinc-500"><CalendarCheck size={11} />{candidate.availability}</span>}
                {candidate.delivered_at && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Clock size={11} />Livré le {new Date(candidate.delivered_at).toLocaleDateString("fr-CA")}</span>}
              </div>
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#2445EB] hover:text-[#1A36C4] font-medium"
                >
                  Voir profil LinkedIn <ExternalLink size={10} />
                </a>
              )}
            </div>

            {score > 0 && (
              <div className="text-center shrink-0">
                <div className={`text-[32px] font-bold tracking-tight tabular-nums ${scoreColor}`}>{score}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Fit score</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left — 2/3 */}
          <div className="col-span-2 space-y-4">
            {candidate.ai_verdict && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-[#2445EB]" />
                  <h2 className="text-[13px] font-semibold text-zinc-900">Évaluation IA</h2>
                </div>
                <p className="text-[13px] text-zinc-700 leading-relaxed">{candidate.ai_verdict}</p>
              </div>
            )}

            {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pourquoi cela colle</p>
                </div>
                <ul className="space-y-2">
                  {candidate.ai_strengths.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-zinc-700 leading-relaxed">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidate.ai_concerns && candidate.ai_concerns.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Points d'attention</p>
                </div>
                <ul className="space-y-2">
                  {candidate.ai_concerns.map((c, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-zinc-700 leading-relaxed">
                      <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidate.qualification_notes && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={14} className="text-zinc-400" />
                  <h2 className="text-[13px] font-semibold text-zinc-900">Notes du recruteur</h2>
                </div>
                <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line">
                  {candidate.qualification_notes}
                </p>
              </div>
            )}
          </div>

          {/* Right — 1/3 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Votre décision</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-emerald-800">Décision enregistrée</p>
                    <p className="text-[12px] text-emerald-700 mt-1">Votre recruteur va prendre les prochaines étapes.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDecision("interested")}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium transition ${
                        decision === "interested"
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-50 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 border border-zinc-100 hover:border-emerald-200"
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      Intéressé — planifier entrevue
                    </button>
                    <button
                      onClick={() => handleDecision("not_interested")}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium transition ${
                        decision === "not_interested"
                          ? "bg-red-500 text-white"
                          : "bg-zinc-50 text-zinc-700 hover:bg-red-50 hover:text-red-600 border border-zinc-100 hover:border-red-200"
                      }`}
                    >
                      <XCircle size={15} />
                      Pas intéressé
                    </button>
                    <Link
                      href={`/messages?candidate=${candidate.id}`}
                      className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border border-zinc-100 transition"
                    >
                      <MessageSquare size={15} />
                      Question au recruteur
                    </Link>
                  </div>

                  {decision === "interested" && (
                    <div className="mt-4 space-y-3">
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <p className="text-[12px] text-emerald-700 leading-relaxed">
                          Confirmez et votre recruteur planifiera une entrevue cette semaine avec {fullName.split(" ")[0]}.
                        </p>
                      </div>
                      {error && <p className="text-[12px] text-red-700">{error}</p>}
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Confirmer
                      </button>
                    </div>
                  )}

                  {decision === "not_interested" && (
                    <div className="mt-4 space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Raison (aide à mieux cibler)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Manque d'expérience, mauvaise localisation, salaire trop élevé…"
                        rows={3}
                        className="w-full p-3 border border-zinc-200 rounded-lg text-[12px] resize-none focus:border-[#2445EB] focus:ring-1 focus:ring-[#2445EB]/10 outline-none text-zinc-700 placeholder:text-zinc-300"
                      />
                      {error && <p className="text-[12px] text-red-700">{error}</p>}
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-[12px] font-medium hover:bg-zinc-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                        Envoyer le feedback
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {candidate.email && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Contact</p>
                <a
                  href={`mailto:${candidate.email}`}
                  className="flex items-center gap-2 text-[12px] text-zinc-700 hover:text-[#2445EB]"
                >
                  <Mail size={12} />
                  {candidate.email}
                  {candidate.email_verified && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 rounded px-1 py-0.5">vérifié</span>
                  )}
                </a>
              </div>
            )}

            {candidate.ai_personalization_hooks && candidate.ai_personalization_hooks.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Pour briser la glace</p>
                <ul className="space-y-2">
                  {candidate.ai_personalization_hooks.map((hook, i) => (
                    <li key={i} className="text-[12px] text-zinc-600 leading-relaxed">
                      • {hook}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Cette information est confidentielle et destinée uniquement à votre prise de décision d'embauche.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
