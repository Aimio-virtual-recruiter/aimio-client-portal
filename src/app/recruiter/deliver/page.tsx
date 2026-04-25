"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Briefcase,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  roles_hiring_for: string | null;
  plan: string;
}

interface FormData {
  client_id: string;
  first_name: string;
  last_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string;
  city: string;
  salary_expectation: string;
  availability: string;
  position_applying_for: string;
  qualification_notes: string;
  interview_notes: string;
  ai_score: number | null;
  fit_analysis: string | null;
}

function DeliverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState<FormData>({
    client_id: preselectedClientId,
    first_name: "",
    last_name: "",
    current_title: "",
    current_company: "",
    linkedin_url: "",
    city: "",
    salary_expectation: "",
    availability: "",
    position_applying_for: "",
    qualification_notes: "",
    interview_notes: "",
    ai_score: null,
    fit_analysis: null,
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/recruiter/clients");
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const selectedClient = clients.find((c) => c.id === form.client_id);

  const handleScore = async () => {
    if (!form.qualification_notes || !form.position_applying_for) {
      alert("Ajoute les notes de qualification et le poste avant de scorer.");
      return;
    }
    setScoring(true);
    try {
      const res = await fetch("/api/recruiter/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score",
          candidate: {
            first_name: form.first_name,
            last_name: form.last_name,
            current_title: form.current_title,
            current_company: form.current_company,
            qualification_notes: form.qualification_notes,
            interview_notes: form.interview_notes,
          },
          position: form.position_applying_for,
          client_context: selectedClient?.roles_hiring_for || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setForm((prev) => ({
        ...prev,
        ai_score: data.score,
        fit_analysis: data.analysis,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur scoring");
    } finally {
      setScoring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      alert("Sélectionne un client");
      return;
    }
    if (!form.ai_score) {
      if (!confirm("Tu n'as pas encore scoré le candidat. Continuer quand même ?")) return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/recruiter/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deliver",
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Livraison échouée");
      setResult({
        success: true,
        message: `Candidat livré à ${selectedClient?.company_name}. Email envoyé.`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (result?.success) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-[24px] font-bold text-zinc-900 mb-3">Candidat livré 🎉</h1>
            <p className="text-[14px] text-zinc-600 mb-8">{result.message}</p>
            <div className="flex gap-3">
              <Link
                href="/recruiter"
                className="flex-1 py-3 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold hover:bg-zinc-800 transition"
              >
                Retour dashboard
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setForm({
                    ...form,
                    first_name: "",
                    last_name: "",
                    current_title: "",
                    current_company: "",
                    linkedin_url: "",
                    city: "",
                    salary_expectation: "",
                    availability: "",
                    position_applying_for: "",
                    qualification_notes: "",
                    interview_notes: "",
                    ai_score: null,
                    fit_analysis: null,
                  });
                }}
                className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-semibold hover:bg-zinc-50 transition"
              >
                Livrer un autre candidat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft size={14} /> Retour dashboard
          </Link>
          <h1 className="text-[32px] font-bold text-zinc-900 tracking-tight">Livrer un candidat</h1>
          <p className="text-[14px] text-zinc-500 mt-2">
            Remplis les infos, score avec Claude, envoie au client. Ça prend 5 minutes.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
        >
          {/* Step 1 — Select client */}
          <div className="p-8 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                1
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Client destinataire</h2>
            </div>

            {loadingClients ? (
              <div className="flex items-center gap-2 text-[13px] text-zinc-500">
                <Loader2 size={14} className="animate-spin" /> Chargement clients...
              </div>
            ) : (
              <select
                required
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} — {c.contact_first_name} {c.contact_last_name}
                  </option>
                ))}
              </select>
            )}

            {selectedClient && selectedClient.roles_hiring_for && (
              <div className="mt-3 bg-blue-50 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider mb-1">
                  Postes à combler pour ce client
                </p>
                <p className="text-[13px] text-blue-800 whitespace-pre-line">
                  {selectedClient.roles_hiring_for}
                </p>
              </div>
            )}
          </div>

          {/* Step 2 — Candidate info */}
          <div className="p-8 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Infos candidat</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <User size={11} /> Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Jane"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Briefcase size={11} /> Titre actuel *
                </label>
                <input
                  type="text"
                  required
                  value={form.current_title}
                  onChange={(e) => setForm({ ...form, current_title: e.target.value })}
                  placeholder="Senior Software Engineer"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Entreprise actuelle
                </label>
                <input
                  type="text"
                  value={form.current_company}
                  onChange={(e) => setForm({ ...form, current_company: e.target.value })}
                  placeholder="Shopify"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <LinkIcon size={11} /> URL LinkedIn *
                </label>
                <input
                  type="url"
                  required
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Ville
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Toronto"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Attente salariale
                </label>
                <input
                  type="text"
                  value={form.salary_expectation}
                  onChange={(e) => setForm({ ...form, salary_expectation: e.target.value })}
                  placeholder="120k-140k CAD"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Disponibilité
                </label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  placeholder="2 semaines / immédiate"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Poste pour lequel on le présente *
                </label>
                <input
                  type="text"
                  required
                  value={form.position_applying_for}
                  onChange={(e) => setForm({ ...form, position_applying_for: e.target.value })}
                  placeholder="Senior Software Engineer — Backend"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3 — Qualification notes */}
          <div className="p-8 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                3
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Notes de qualification</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText size={11} /> Résumé qualification * (min 300 mots)
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.qualification_notes}
                  onChange={(e) => setForm({ ...form, qualification_notes: e.target.value })}
                  placeholder="Expérience clé : 8 ans de backend avec focus sur les microservices. Passé les 3 dernières années chez Shopify où il a mené la migration monolith → microservices pour l'équipe Checkout. Tech stack : Go, gRPC, PostgreSQL, Kafka. Pourquoi il cherche : envie d'un rôle plus senior avec plus d'impact stratégique. Red flags : aucun. Match avec les must-haves : oui sur les 3."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-y font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">
                  Notes d&apos;entrevue (30 min appel téléphonique)
                </label>
                <textarea
                  rows={4}
                  value={form.interview_notes}
                  onChange={(e) => setForm({ ...form, interview_notes: e.target.value })}
                  placeholder="Clair, structuré dans sa réflexion. Parle bien des trade-offs techniques. Motivé par les problèmes complexes. A posé 3 questions pertinentes sur la stack et la culture. Référence positive vérifiée."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-y"
                />
              </div>
            </div>
          </div>

          {/* Step 4 — AI Score */}
          <div className="p-8 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#2445EB] text-white text-[11px] font-bold flex items-center justify-center">
                4
              </div>
              <h2 className="text-[16px] font-bold text-zinc-900">Score IA Claude</h2>
            </div>

            {!form.ai_score ? (
              <div>
                <p className="text-[13px] text-zinc-500 mb-4">
                  Claude analyse la qualification + le poste et donne un score de fit sur 100.
                </p>
                <button
                  type="button"
                  onClick={handleScore}
                  disabled={scoring || !form.qualification_notes || !form.position_applying_for}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] text-white rounded-full text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-[#2445EB]/20"
                >
                  {scoring ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Scorer avec Claude
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#2445EB]/5 to-[#4B5DF5]/5 rounded-xl p-5 border border-[#2445EB]/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      Fit score
                    </p>
                    <p className="text-[36px] font-bold text-[#2445EB]">
                      {form.ai_score}
                      <span className="text-[18px] text-zinc-400">/100</span>
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      form.ai_score >= 85
                        ? "bg-emerald-100 text-emerald-700"
                        : form.ai_score >= 70
                        ? "bg-blue-100 text-blue-700"
                        : form.ai_score >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {form.ai_score >= 85
                      ? "Excellent"
                      : form.ai_score >= 70
                      ? "Strong fit"
                      : form.ai_score >= 50
                      ? "Borderline"
                      : "Weak"}
                  </div>
                </div>
                {form.fit_analysis && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Analyse Claude
                    </p>
                    <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line">
                      {form.fit_analysis}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleScore}
                  disabled={scoring}
                  className="mt-3 text-[12px] text-[#2445EB] hover:underline font-semibold"
                >
                  Rescorer
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {result && !result.success && (
            <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{result.message}</p>
            </div>
          )}

          {/* Submit */}
          <div className="p-8 bg-zinc-50 flex items-center justify-between gap-4">
            <p className="text-[12px] text-zinc-500">
              Le client recevra un email premium avec le profil + CV + notes.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-[#2445EB]/20 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={14} /> Envoyer au client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeliverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={20} />
        </div>
      }
    >
      <DeliverContent />
    </Suspense>
  );
}
