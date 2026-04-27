"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Sparkles,
  Link2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
} from "lucide-react";

interface Client {
  id: string;
  company_name: string;
}

interface Mandate {
  id: string;
  title: string;
  company_id: string;
}

function ManualSourceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client") || "";
  const preselectedMandateId = searchParams.get("mandate") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [mandateId, setMandateId] = useState(preselectedMandateId);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    current_title: "",
    current_company: "",
    headline: "",
    location_city: "",
    location_country: "",
    linkedin_url: "",
    email: "",
    phone: "",
    salary_expectation: "",
    availability: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [autoScore, setAutoScore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients
  useEffect(() => {
    fetch("/api/recruiter/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []));
  }, []);

  // Load mandates when client changes
  useEffect(() => {
    if (!clientId) {
      setMandates([]);
      return;
    }
    fetch(`/api/mandates?client_id=${clientId}`)
      .then((r) => r.json())
      .then((data) => setMandates(data.mandates || []));
  }, [clientId]);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Sélectionne un client");
      return;
    }
    if (!form.first_name || !form.last_name) {
      setError("Prénom et nom requis");
      return;
    }
    if (!form.linkedin_url && !form.email) {
      setError("Au moins un moyen de contact requis (LinkedIn URL ou email)");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const fullName = `${form.first_name} ${form.last_name}`.trim();

      const { data: candidate, error: insertError } = await supabase
        .from("sourced_candidates")
        .insert({
          client_id: clientId,
          mandate_id: mandateId || null,
          first_name: form.first_name,
          last_name: form.last_name,
          full_name: fullName,
          current_title: form.current_title || null,
          current_company: form.current_company || null,
          headline: form.headline || null,
          location_city: form.location_city || null,
          location_country: form.location_country || null,
          linkedin_url: form.linkedin_url || null,
          email: form.email ? form.email.toLowerCase() : null,
          email_verified: false,
          phone: form.phone || null,
          salary_expectation: form.salary_expectation || null,
          availability: form.availability || null,
          qualification_notes: form.notes || null,
          source: "manual_recruiter",
          status: "new",
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast.success(`${fullName} ajouté à la queue`);

      // Optionally trigger AI scoring in background
      if (autoScore && candidate?.id) {
        fetch("/api/recruiter/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "score_single",
            candidate_id: candidate.id,
          }),
        }).catch(() => {
          // Best effort — don't block the flow
        });
      }

      // Redirect to queue
      router.push(`/recruiter/queue?client_id=${clientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedMandate = mandates.find((m) => m.id === mandateId);

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href={preselectedClientId ? `/recruiter/source?client=${preselectedClientId}${preselectedMandateId ? `&mandate=${preselectedMandateId}` : ""}` : "/recruiter/source"}
          className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4"
        >
          <ArrowLeft size={14} /> Retour au sourcing
        </Link>

        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus size={16} className="opacity-80" />
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ajout manuel</p>
            </div>
            <h1 className="text-[24px] font-bold tracking-tight mb-2">Ajouter un candidat manuellement</h1>
            <p className="text-[13px] opacity-90">
              Pour les candidats trouvés par référence, réseau, conférence, ou tout candidat hors-sourcing automatique.
              L&apos;IA peut quand même scorer + générer un message d&apos;outreach après.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Client + mandate */}
          <Section title="Mandat" desc="À quel client/mandat associer ce candidat">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Client *">
                <select
                  required
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setMandateId("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mandat (recommandé)">
                <select
                  value={mandateId}
                  onChange={(e) => setMandateId(e.target.value)}
                  disabled={!clientId || mandates.length === 0}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">{mandates.length === 0 ? "Aucun mandat" : "Sélectionner"}</option>
                  {mandates.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </Field>
            </div>
            {selectedClient && selectedMandate && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#2445EB]/10 border border-[#2445EB]/20 rounded-lg">
                <Briefcase size={11} className="text-[#2445EB]" />
                <span className="text-[12px] text-[#2445EB] font-semibold">
                  {selectedClient.company_name} → {selectedMandate.title}
                </span>
              </div>
            )}
          </Section>

          {/* Identity */}
          <Section title="Identité du candidat" desc="Au minimum : prénom, nom, et un moyen de contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Prénom *">
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="Jane"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <Field label="Nom *">
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <Field label="Titre actuel">
                <input
                  type="text"
                  value={form.current_title}
                  onChange={(e) => updateField("current_title", e.target.value)}
                  placeholder="Ex: Senior Accountant"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <Field label="Entreprise actuelle">
                <input
                  type="text"
                  value={form.current_company}
                  onChange={(e) => updateField("current_company", e.target.value)}
                  placeholder="Ex: Deloitte"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Headline / mini-bio (optionnel)">
                  <input
                    type="text"
                    value={form.headline}
                    onChange={(e) => updateField("headline", e.target.value)}
                    placeholder="Ex: Senior Construction Project Manager · 12+ years · LEED certified"
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Coordonnées" desc="Au moins LinkedIn URL OU email pour pouvoir le contacter">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="LinkedIn URL">
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="url"
                      value={form.linkedin_url}
                      onChange={(e) => updateField("linkedin_url", e.target.value)}
                      placeholder="https://linkedin.com/in/jane-doe"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                    />
                  </div>
                </Field>
              </div>
              <Field label="Email">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane.doe@company.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                  />
                </div>
              </Field>
              <Field label="Téléphone">
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 514 555-1234"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Location + Other */}
          <Section title="Localisation & autres" desc="Optionnel — aide à mieux qualifier">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ville">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={form.location_city}
                    onChange={(e) => updateField("location_city", e.target.value)}
                    placeholder="Montréal"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                  />
                </div>
              </Field>
              <Field label="Pays">
                <input
                  type="text"
                  value={form.location_country}
                  onChange={(e) => updateField("location_country", e.target.value)}
                  placeholder="Canada"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <Field label="Salaire attendu">
                <input
                  type="text"
                  value={form.salary_expectation}
                  onChange={(e) => updateField("salary_expectation", e.target.value)}
                  placeholder="Ex: 95K-110K CAD"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
              <Field label="Disponibilité">
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => updateField("availability", e.target.value)}
                  placeholder="Ex: 4 semaines / Immédiate"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </Field>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes du recruteur" desc="Pourquoi tu ajoutes ce candidat ? D'où vient-il ?">
            <Field label="Notes (visibles seulement par toi et l'équipe Aimio)">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                placeholder="Ex: Référé par un de mes contacts. A 12 ans d'expérience en gestion de projet construction. Disponible pour interview cette semaine."
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
              />
            </Field>
          </Section>

          {/* Auto-score option */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScore}
                onChange={(e) => setAutoScore(e.target.checked)}
                className="mt-0.5 accent-[#2445EB]"
              />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={12} /> Scorer automatiquement avec Claude IA
                </p>
                <p className="text-[12px] text-blue-700 mt-0.5">
                  Claude va analyser ce candidat contre les critères du mandat et générer un score 0-100, des points forts/faibles, et des hooks de personnalisation pour l&apos;outreach. Action en background — n&apos;impacte pas l&apos;ajout.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 mb-4">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={preselectedClientId ? `/recruiter/source?client=${preselectedClientId}` : "/recruiter/source"}
              className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-semibold hover:bg-zinc-50 transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-[14px] font-bold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Ajout...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Ajouter à la queue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2">
          <Building2 size={14} className="text-[#2445EB]" />
          {title}
        </h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ManualSourcePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-zinc-400" />
        </div>
      }
    >
      <ManualSourceContent />
    </Suspense>
  );
}
