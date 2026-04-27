"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  Send,
  Edit3,
  Tag,
  Plus,
  X,
  Trash2,
  Briefcase,
  DollarSign,
  Calendar,
  Rocket,
  History,
} from "lucide-react";

interface CandidateRow {
  id: string;
  client_id: string | null;
  mandate_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  headline: string | null;
  location_city: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean | null;
  phone: string | null;
  ai_score: number | null;
  ai_verdict: string | null;
  ai_strengths: string[] | null;
  ai_concerns: string[] | null;
  ai_personalization_hooks: string[] | null;
  ai_likelihood_to_respond: string | null;
  qualification_notes: string | null;
  salary_expectation: string | null;
  availability: string | null;
  status: string;
  source: string | null;
  source_raw: Record<string, unknown> | null;
  delivered_at: string | null;
  hired_at: string | null;
  client_feedback_at: string | null;
  client_feedback_reason: string | null;
  created_at: string;
  tags: string[] | null;
  clients?: { id: string; company_name: string } | null;
  mandates?: { id: string; title: string } | null;
}

interface OutreachMessage {
  id: string;
  channel: string;
  touch_number: number;
  subject: string | null;
  body: string;
  status: string;
  sent_at: string | null;
  reply_received_at: string | null;
  reply_body: string | null;
  created_at: string;
}

interface Note {
  id: number;
  candidate_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Nouveau (à valider)", color: "bg-blue-100 text-blue-800" },
  kept: { label: "Gardé", color: "bg-purple-100 text-purple-800" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  outreach_ready: { label: "Outreach prêt", color: "bg-purple-100 text-purple-800" },
  outreached: { label: "Outreaché", color: "bg-amber-100 text-amber-800" },
  replied_interested: { label: "Répondu — intéressé 🎯", color: "bg-emerald-100 text-emerald-800" },
  replied_not_interested: { label: "Répondu — pas intéressé", color: "bg-red-100 text-red-700" },
  qualifying: { label: "En qualification", color: "bg-amber-100 text-amber-800" },
  qualified: { label: "Qualifié", color: "bg-amber-100 text-amber-800" },
  delivered: { label: "Livré au client", color: "bg-blue-100 text-blue-800" },
  client_interested: { label: "Client intéressé 🎯", color: "bg-emerald-100 text-emerald-800" },
  client_not_interested: { label: "Client pas intéressé", color: "bg-red-100 text-red-700" },
  hired: { label: "Embauché 🎉", color: "bg-emerald-200 text-emerald-900" },
};

export default function CandidateCRMProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateRow | null>(null);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [user, setUser] = useState<{ id: string; first_name: string; last_name: string } | null>(null);

  const loadAll = async () => {
    if (!params.id) return;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", authUser.id)
          .single();
        setUser({ id: authUser.id, first_name: profile?.first_name || "", last_name: profile?.last_name || "" });
      }

      const { data: c, error: cErr } = await supabase
        .from("sourced_candidates")
        .select("*, clients(id, company_name), mandates(id, title)")
        .eq("id", params.id as string)
        .single();
      if (cErr) {
        setError("Candidat introuvable");
        setLoading(false);
        return;
      }
      setCandidate(c as CandidateRow);

      // Outreach messages history
      const { data: msgs } = await supabase
        .from("outreach_messages")
        .select("*")
        .eq("candidate_id", params.id as string)
        .order("created_at", { ascending: true });
      setMessages((msgs as OutreachMessage[]) || []);

      // Notes
      const { data: noteList } = await supabase
        .from("candidate_notes")
        .select("*")
        .eq("candidate_id", params.id as string)
        .order("created_at", { ascending: false });
      setNotes((noteList as Note[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const addNote = async () => {
    if (!newNote.trim() || !candidate) return;
    setSavingNote(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const authorName = user ? `${user.first_name} ${user.last_name}`.trim() : "Recruteur";
      const { error: insErr } = await supabase.from("candidate_notes").insert({
        candidate_id: candidate.id,
        author_id: user?.id || null,
        author_name: authorName,
        content: newNote.trim(),
      });
      if (insErr) throw insErr;
      setNewNote("");
      toast.success("Note ajoutée");
      loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("candidate_notes").delete().eq("id", id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !candidate) return;
    const tag = newTag.trim().toLowerCase();
    if (candidate.tags?.includes(tag)) return;
    const newTags = [...(candidate.tags || []), tag];
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("sourced_candidates").update({ tags: newTags }).eq("id", candidate.id);
      setCandidate({ ...candidate, tags: newTags });
      setNewTag("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const removeTag = async (tag: string) => {
    if (!candidate) return;
    const newTags = (candidate.tags || []).filter((t) => t !== tag);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("sourced_candidates").update({ tags: newTags }).eq("id", candidate.id);
      setCandidate({ ...candidate, tags: newTags });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!candidate) return;
    setUpdatingStatus(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("sourced_candidates").update({ status: newStatus }).eq("id", candidate.id);
      setCandidate({ ...candidate, status: newStatus });
      toast.success(`Status: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const generateOutreach = async () => {
    if (!candidate) return;
    try {
      toast.info("Génération outreach en cours...");
      const res = await fetch("/api/recruiter/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Messages générés. Voir Outreach.");
      loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <Link href="/recruiter/candidates" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
          <ArrowLeft size={14} /> Retour
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-[14px] text-red-800">{error || "Candidat introuvable"}</p>
        </div>
      </div>
    );
  }

  const fullName = candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Sans nom";
  const initials = fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");
  const score = candidate.ai_score;
  const statusInfo = STATUS_CONFIG[candidate.status] || { label: candidate.status, color: "bg-zinc-100 text-zinc-700" };
  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(", ");

  // Build activity timeline from existing fields
  const timeline: { date: string; type: string; label: string; icon: React.ReactNode; color: string }[] = [];
  timeline.push({
    date: candidate.created_at,
    type: "sourced",
    label: `Sourcé via ${candidate.source || "?"}`,
    icon: <Sparkles size={11} />,
    color: "bg-zinc-100 text-zinc-700",
  });
  if (score !== null) {
    timeline.push({
      date: candidate.created_at, // we don't track ai_scored_at separately
      type: "scored",
      label: `Scoré par IA : ${score}/100 (${candidate.ai_verdict?.replace(/_/g, " ") || "—"})`,
      icon: <Sparkles size={11} />,
      color: "bg-purple-100 text-purple-700",
    });
  }
  messages.forEach((m) => {
    if (m.sent_at) {
      timeline.push({
        date: m.sent_at,
        type: "sent",
        label: `Envoyé : ${m.channel.replace(/_/g, " ")}`,
        icon: <Send size={11} />,
        color: "bg-blue-100 text-blue-700",
      });
    }
    if (m.reply_received_at) {
      timeline.push({
        date: m.reply_received_at,
        type: "replied",
        label: `Réponse reçue : ${m.channel.replace(/_/g, " ")}`,
        icon: <MessageSquare size={11} />,
        color: "bg-emerald-100 text-emerald-700",
      });
    }
  });
  if (candidate.delivered_at) {
    timeline.push({
      date: candidate.delivered_at,
      type: "delivered",
      label: "Livré au client",
      icon: <CheckCircle2 size={11} />,
      color: "bg-blue-100 text-blue-700",
    });
  }
  if (candidate.client_feedback_at) {
    timeline.push({
      date: candidate.client_feedback_at,
      type: "client_feedback",
      label: candidate.status === "client_interested" ? "Client intéressé" : "Feedback client reçu",
      icon: <CheckCircle2 size={11} />,
      color: "bg-emerald-100 text-emerald-700",
    });
  }
  if (candidate.hired_at) {
    timeline.push({
      date: candidate.hired_at,
      type: "hired",
      label: "Embauché 🎉",
      icon: <CheckCircle2 size={11} />,
      color: "bg-emerald-200 text-emerald-900",
    });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-6xl mx-auto py-6 px-6">
      <Link href="/recruiter/candidates" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft size={14} /> Retour à la banque de candidats
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[20px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{fullName}</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {candidate.email_verified && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-bold">
                  ✓ EMAIL
                </span>
              )}
              {candidate.source === "manual_recruiter" && (
                <span className="text-[10px] bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 font-bold">
                  AJOUT MANUEL
                </span>
              )}
            </div>
            <p className="text-[14px] text-zinc-700">
              {candidate.current_title}
              {candidate.current_company && <> · {candidate.current_company}</>}
            </p>
            {candidate.headline && (
              <p className="text-[12px] text-zinc-500 italic mt-1">{candidate.headline}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
              {location && <Pill icon={<MapPin size={11} />}>{location}</Pill>}
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="text-[12px] text-[#2445EB] hover:underline inline-flex items-center gap-1">
                  <Mail size={11} /> {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="text-[12px] text-[#2445EB] hover:underline inline-flex items-center gap-1">
                  <Phone size={11} /> {candidate.phone}
                </a>
              )}
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#2445EB] hover:underline inline-flex items-center gap-1">
                  <ExternalLink size={11} /> LinkedIn
                </a>
              )}
              {candidate.salary_expectation && <Pill icon={<DollarSign size={11} />}>{candidate.salary_expectation}</Pill>}
              {candidate.availability && <Pill icon={<Calendar size={11} />}>{candidate.availability}</Pill>}
            </div>
          </div>
          {/* Score */}
          {score !== null && (
            <div className="shrink-0 text-center">
              <div className="text-[36px] font-bold text-[#2445EB] leading-none tabular-nums">
                {score}<span className="text-[16px] text-zinc-400">/100</span>
              </div>
              {candidate.ai_verdict && (
                <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                  {candidate.ai_verdict.replace(/_/g, " ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client + Mandate */}
      {(candidate.clients || candidate.mandates) && (
        <div className="bg-gradient-to-r from-[#2445EB]/5 to-[#4B5DF5]/5 border border-[#2445EB]/20 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 size={16} className="text-[#2445EB]" />
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pour le mandat</p>
              <p className="text-[14px] font-semibold text-zinc-900">
                {candidate.clients?.company_name && (
                  <Link href={`/recruiter/clients/${candidate.clients.id}`} className="text-[#2445EB] hover:underline">
                    {candidate.clients.company_name}
                  </Link>
                )}
                {candidate.mandates?.title && (
                  <>
                    {" → "}
                    <Link href={`/mandats/${candidate.mandates.id}`} className="text-zinc-900 hover:text-[#2445EB]">
                      {candidate.mandates.title}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Actions rapides</p>
        <div className="flex flex-wrap gap-2">
          {candidate.status === "new" && (
            <>
              <button
                onClick={() => updateStatus("kept")}
                disabled={updatingStatus}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[12px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
              >
                <CheckCircle2 size={12} /> Garder
              </button>
              <button
                onClick={() => updateStatus("rejected")}
                disabled={updatingStatus}
                className="px-3 py-1.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-[12px] font-semibold hover:bg-zinc-200 transition flex items-center gap-1"
              >
                <XCircle size={12} /> Rejeter
              </button>
            </>
          )}
          {(candidate.status === "kept" || candidate.status === "new") && (
            <button
              onClick={generateOutreach}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[12px] font-semibold hover:bg-purple-100 transition flex items-center gap-1"
            >
              <Sparkles size={12} /> Générer outreach IA
            </button>
          )}
          {candidate.status === "outreach_ready" && (
            <Link
              href={`/recruiter/outreach?candidate=${candidate.id}`}
              className="px-3 py-1.5 bg-[#2445EB] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1A36C4] transition flex items-center gap-1"
            >
              <Send size={12} /> Aller à Outreach
            </Link>
          )}
          {candidate.status !== "delivered" && candidate.status !== "hired" && (
            <Link
              href={`/recruiter/deliver?client=${candidate.client_id}&candidate=${candidate.id}`}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold hover:bg-blue-100 transition flex items-center gap-1"
            >
              <Rocket size={12} /> Livrer au client
            </Link>
          )}
          <select
            value={candidate.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updatingStatus}
            className="px-2 py-1.5 border border-zinc-200 rounded-lg text-[12px] bg-white"
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — AI analysis + tags + notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI analysis */}
          {(candidate.ai_strengths?.length || candidate.ai_concerns?.length || candidate.ai_personalization_hooks?.length) && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[#2445EB]" /> Analyse IA Claude
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-emerald-900 uppercase mb-2">✓ Forces</p>
                    <ul className="space-y-1 text-[12px] text-emerald-800">
                      {candidate.ai_strengths.map((s, i) => (<li key={i}>• {s}</li>))}
                    </ul>
                  </div>
                )}
                {candidate.ai_concerns && candidate.ai_concerns.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-amber-900 uppercase mb-2">⚠ Points d&apos;attention</p>
                    <ul className="space-y-1 text-[12px] text-amber-800">
                      {candidate.ai_concerns.map((c, i) => (<li key={i}>• {c}</li>))}
                    </ul>
                  </div>
                )}
                {candidate.ai_personalization_hooks && candidate.ai_personalization_hooks.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-blue-900 uppercase mb-2">🎯 Hooks outreach</p>
                    <ul className="space-y-1 text-[12px] text-blue-800">
                      {candidate.ai_personalization_hooks.map((h, i) => (<li key={i}>• {h}</li>))}
                    </ul>
                  </div>
                )}
              </div>
              {candidate.ai_likelihood_to_respond && (
                <p className="text-[11px] text-zinc-500 mt-3 italic">
                  ⚡ Probabilité de réponse : {candidate.ai_likelihood_to_respond}
                </p>
              )}
            </div>
          )}

          {/* Outreach messages history */}
          {messages.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <MessageSquare size={14} className="text-[#2445EB]" /> Historique outreach ({messages.length})
              </h2>
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] font-bold text-zinc-700 capitalize">
                        {m.channel.replace(/_/g, " ")} · Touch #{m.touch_number}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        m.status === "sent" ? "bg-blue-100 text-blue-700" :
                        m.status === "replied" ? "bg-emerald-100 text-emerald-700" :
                        "bg-zinc-100 text-zinc-600"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    {m.subject && <p className="text-[12px] font-semibold text-zinc-800 mb-1">{m.subject}</p>}
                    <p className="text-[12px] text-zinc-600 whitespace-pre-line">{m.body}</p>
                    {m.reply_body && (
                      <div className="mt-2 pt-2 border-t border-zinc-200">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">↩ Réponse</p>
                        <p className="text-[12px] text-zinc-700 whitespace-pre-line italic">{m.reply_body}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Edit3 size={14} className="text-[#2445EB]" /> Notes du recruteur ({notes.length})
            </h2>
            <div className="flex gap-2 mb-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ex: Appel de qualif fait — très intéressé, dispo dans 4 semaines, salaire OK..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || savingNote}
                className="px-3 bg-[#2445EB] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1A36C4] disabled:opacity-40 transition flex items-center gap-1"
              >
                {savingNote ? <Loader2 size={11} className="animate-spin" /> : <Plus size={12} />}
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="text-[12px] text-zinc-400 italic text-center py-4">
                Aucune note encore. Ajoute des notes au fil de tes interactions.
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line">{n.content}</p>
                        <p className="text-[10px] text-zinc-400 mt-2">
                          <strong className="text-zinc-600">{n.author_name || "Recruteur"}</strong>
                          {" · "}
                          {new Date(n.created_at).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Qualification notes (legacy field) */}
          {candidate.qualification_notes && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-zinc-400" /> Notes de qualification (initiale)
              </h2>
              <p className="text-[13px] text-zinc-700 whitespace-pre-line leading-relaxed">{candidate.qualification_notes}</p>
            </div>
          )}
        </div>

        {/* Right column — timeline + tags */}
        <div className="space-y-4">
          {/* Tags */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Tag size={14} className="text-[#2445EB]" /> Tags
            </h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(candidate.tags || []).map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-700 rounded-md text-[11px]">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:bg-zinc-200 rounded p-0.5">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Ajouter un tag..."
                className="flex-1 px-2 py-1.5 rounded border border-zinc-200 text-[12px] focus:border-[#2445EB] outline-none"
              />
              <button onClick={addTag} className="px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded text-[12px] font-semibold text-zinc-700">
                +
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 italic">
              Ex: priorité, à-recontacter-q4, hot-lead, refus-temporaire, top-talent
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="text-[14px] font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <History size={14} className="text-[#2445EB]" /> Timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="text-[12px] text-zinc-400 italic">Aucune activité.</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.color}`}>
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-700 leading-tight">{t.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        <Clock size={9} className="inline mr-0.5" />
                        {new Date(t.date).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-zinc-600">
      {icon} {children}
    </span>
  );
}
