"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  ChevronRight,
  Star,
  Activity,
  FileText,
  TrendingUp,
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

// PIPELINE STAGES — Salesforce-style horizontal path
const PIPELINE_STAGES = [
  { key: "new", label: "Sourcé", short: "Sourcé" },
  { key: "kept", label: "Validé", short: "Validé" },
  { key: "outreach_ready", label: "Message prêt", short: "Msg" },
  { key: "outreached", label: "Outreaché", short: "Out." },
  { key: "replied_interested", label: "A répondu", short: "Rép." },
  { key: "qualified", label: "Qualifié", short: "Qual." },
  { key: "delivered", label: "Livré client", short: "Livré" },
  { key: "client_interested", label: "Client OK", short: "OK" },
  { key: "hired", label: "Embauché 🎉", short: "Hire" },
];

// Map "secondary" statuses to a stage index
const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  new: 0,
  rejected: 0,
  kept: 1,
  outreach_ready: 2,
  outreached: 3,
  replied_not_interested: 3,
  replied_interested: 4,
  qualifying: 5,
  qualified: 5,
  delivered: 6,
  client_not_interested: 6,
  client_interested: 7,
  hired: 8,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new: { label: "Nouveau", color: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  kept: { label: "Validé", color: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  rejected: { label: "Rejeté", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  outreach_ready: { label: "Outreach prêt", color: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  outreached: { label: "Outreaché", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  replied_interested: { label: "Répondu — intéressé", color: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  replied_not_interested: { label: "Répondu — non", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  qualifying: { label: "En qualification", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  qualified: { label: "Qualifié", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  delivered: { label: "Livré client", color: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  client_interested: { label: "Client intéressé", color: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  client_not_interested: { label: "Client non", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  hired: { label: "Embauché 🎉", color: "bg-emerald-100 text-emerald-900 border-emerald-300", dot: "bg-emerald-600" },
};

type Tab = "overview" | "activity" | "outreach" | "notes" | "details";

export default function CandidateCRMProfilePage() {
  const params = useParams();
  const [candidate, setCandidate] = useState<CandidateRow | null>(null);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
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

      const { data: msgs } = await supabase
        .from("outreach_messages")
        .select("*")
        .eq("candidate_id", params.id as string)
        .order("created_at", { ascending: true });
      setMessages((msgs as OutreachMessage[]) || []);

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
      toast.info("Génération outreach…");
      const res = await fetch("/api/recruiter/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Messages générés. Voir l'onglet Outreach.");
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
  const statusInfo = STATUS_CONFIG[candidate.status] || { label: candidate.status, color: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" };
  const location = [candidate.location_city, candidate.location_country].filter(Boolean).join(", ");
  const currentStageIndex = STATUS_TO_STAGE_INDEX[candidate.status] ?? 0;
  const isRejectedFlow = candidate.status === "rejected" || candidate.status === "replied_not_interested" || candidate.status === "client_not_interested";

  // Build timeline
  const timeline: { date: string; type: string; label: string; icon: React.ReactNode; color: string }[] = [];
  timeline.push({ date: candidate.created_at, type: "sourced", label: `Sourcé via ${candidate.source || "?"}`, icon: <Sparkles size={11} />, color: "text-zinc-600" });
  if (score !== null) {
    timeline.push({ date: candidate.created_at, type: "scored", label: `Scoré IA : ${score}/100 (${candidate.ai_verdict?.replace(/_/g, " ") || "—"})`, icon: <Star size={11} />, color: "text-purple-600" });
  }
  messages.forEach((m) => {
    if (m.sent_at) timeline.push({ date: m.sent_at, type: "sent", label: `Envoyé : ${m.channel.replace(/_/g, " ")}`, icon: <Send size={11} />, color: "text-blue-600" });
    if (m.reply_received_at) timeline.push({ date: m.reply_received_at, type: "replied", label: `Réponse : ${m.channel.replace(/_/g, " ")}`, icon: <MessageSquare size={11} />, color: "text-emerald-600" });
  });
  if (candidate.delivered_at) timeline.push({ date: candidate.delivered_at, type: "delivered", label: "Livré au client", icon: <Rocket size={11} />, color: "text-blue-600" });
  if (candidate.client_feedback_at) timeline.push({ date: candidate.client_feedback_at, type: "feedback", label: candidate.status === "client_interested" ? "Client intéressé" : "Feedback client", icon: <CheckCircle2 size={11} />, color: "text-emerald-600" });
  if (candidate.hired_at) timeline.push({ date: candidate.hired_at, type: "hired", label: "Embauché 🎉", icon: <CheckCircle2 size={11} />, color: "text-emerald-700" });
  notes.forEach((n) => timeline.push({ date: n.created_at, type: "note", label: `Note de ${n.author_name || "Recruteur"}: ${n.content.slice(0, 80)}${n.content.length > 80 ? "…" : ""}`, icon: <Edit3 size={11} />, color: "text-zinc-600" }));
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* ════════════════════════════════════════════════════════════════
          TOP BAR — breadcrumb + actions (Salesforce-style)
          ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <Link href="/recruiter/candidates" className="hover:text-[#2445EB]">Candidats</Link>
            <ChevronRight size={12} />
            <span className="text-zinc-900 font-semibold">{fullName}</span>
          </div>
          <div className="flex items-center gap-2">
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[12px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 inline-flex items-center gap-1.5">
                <ExternalLink size={11} /> LinkedIn
              </a>
            )}
            {candidate.email && (
              <a href={`mailto:${candidate.email}`} className="px-3 py-1.5 text-[12px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 inline-flex items-center gap-1.5">
                <Mail size={11} /> Email
              </a>
            )}
            {(candidate.status === "kept" || candidate.status === "new") && (
              <button onClick={generateOutreach} className="px-3 py-1.5 text-[12px] font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-flex items-center gap-1.5">
                <Sparkles size={11} /> Générer outreach
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          PROFILE HEADER — Salesforce highlights panel
          ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white text-[24px] font-bold flex items-center justify-center shrink-0 ring-4 ring-white shadow-md">
              {initials}
            </div>

            {/* Identity + key info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[22px] font-bold text-zinc-900">{fullName}</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusInfo.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
                {candidate.email_verified && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-bold uppercase">✓ Email</span>
                )}
                {candidate.source === "manual_recruiter" && (
                  <span className="text-[9px] bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 font-bold uppercase">Manuel</span>
                )}
              </div>
              <p className="text-[14px] text-zinc-700 font-medium">
                {candidate.current_title || "—"}
                {candidate.current_company && <span className="text-zinc-500"> · {candidate.current_company}</span>}
              </p>
              {candidate.headline && (
                <p className="text-[12px] text-zinc-500 italic mt-1 line-clamp-1">{candidate.headline}</p>
              )}

              {/* Quick info grid — Salesforce-dense */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-zinc-100">
                <InfoCell icon={<MapPin size={11} />} label="Lieu" value={location || "—"} />
                <InfoCell icon={<Mail size={11} />} label="Email" value={candidate.email || "—"} link={candidate.email ? `mailto:${candidate.email}` : undefined} />
                <InfoCell icon={<Phone size={11} />} label="Tél." value={candidate.phone || "—"} link={candidate.phone ? `tel:${candidate.phone}` : undefined} />
                <InfoCell icon={<DollarSign size={11} />} label="Salaire" value={candidate.salary_expectation || "—"} />
                <InfoCell icon={<Calendar size={11} />} label="Disponibilité" value={candidate.availability || "—"} />
                <InfoCell icon={<Building2 size={11} />} label="Client" value={candidate.clients?.company_name || "—"} link={candidate.clients ? `/recruiter/clients/${candidate.clients.id}` : undefined} />
                <InfoCell icon={<Briefcase size={11} />} label="Mandat" value={candidate.mandates?.title || "—"} link={candidate.mandates ? `/mandats/${candidate.mandates.id}` : undefined} />
                <InfoCell icon={<Sparkles size={11} />} label="Source" value={candidate.source || "—"} />
              </div>
            </div>

            {/* Score panel */}
            {score !== null && (
              <div className="shrink-0 text-center bg-gradient-to-br from-[#2445EB]/5 to-[#4B5DF5]/5 border border-[#2445EB]/20 rounded-xl px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Fit Score</p>
                <div className="text-[36px] font-bold text-[#2445EB] leading-none my-1 tabular-nums">{score}</div>
                <p className="text-[10px] text-zinc-500">/100</p>
                {candidate.ai_verdict && (
                  <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#2445EB] border border-[#2445EB]/20">
                    {candidate.ai_verdict.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════
              SALESFORCE PATH — pipeline stage stepper
              ════════════════════════════════════════════════════════════ */}
          <div className="mt-5">
            <SalesPath
              stages={PIPELINE_STAGES}
              currentIndex={currentStageIndex}
              isRejected={isRejectedFlow}
              onChange={(stageKey) => updateStatus(stageKey)}
              disabled={updatingStatus}
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TABS — Overview / Activity / Outreach / Notes / Details
          ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Sparkles size={13} />} label="Overview" />
          <TabButton active={activeTab === "activity"} onClick={() => setActiveTab("activity")} icon={<Activity size={13} />} label="Activité" badge={timeline.length} />
          <TabButton active={activeTab === "outreach"} onClick={() => setActiveTab("outreach")} icon={<Send size={13} />} label="Outreach" badge={messages.length} />
          <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")} icon={<Edit3 size={13} />} label="Notes" badge={notes.length} />
          <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")} icon={<FileText size={13} />} label="Détails" />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB CONTENT
          ════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main column (3/4) */}
          <div className="lg:col-span-3 space-y-3">
            {activeTab === "overview" && (
              <>
                {/* AI Analysis cards */}
                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
                  <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center gap-2">
                    <Sparkles size={13} className="text-[#2445EB]" />
                    <h2 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider">Analyse IA Claude</h2>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <AnalysisCard color="emerald" title="Forces" items={candidate.ai_strengths || []} icon={<TrendingUp size={11} />} />
                    <AnalysisCard color="amber" title="Points d'attention" items={candidate.ai_concerns || []} icon={<AlertCircle size={11} />} />
                    <AnalysisCard color="blue" title="Hooks outreach" items={candidate.ai_personalization_hooks || []} icon={<Star size={11} />} />
                  </div>
                  {candidate.ai_likelihood_to_respond && (
                    <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-600">
                      <strong>⚡ Probabilité de réponse :</strong> {candidate.ai_likelihood_to_respond}
                    </div>
                  )}
                </div>

                {/* Quick Notes (compact) */}
                <Card title="Notes récentes" icon={<Edit3 size={13} className="text-[#2445EB]" />} count={notes.length} action={notes.length > 3 ? <button onClick={() => setActiveTab("notes")} className="text-[11px] text-[#2445EB] font-semibold">Voir tout →</button> : undefined}>
                  <div className="p-3">
                    <div className="flex gap-2 mb-3">
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNote())}
                        placeholder="Ajouter une note rapide…"
                        className="flex-1 px-3 py-1.5 rounded border border-zinc-200 text-[12px] focus:border-[#2445EB] outline-none"
                      />
                      <button onClick={addNote} disabled={!newNote.trim() || savingNote} className="px-3 bg-[#2445EB] text-white rounded text-[12px] font-semibold hover:bg-[#1A36C4] disabled:opacity-40">
                        {savingNote ? <Loader2 size={11} className="animate-spin" /> : "+"}
                      </button>
                    </div>
                    {notes.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic text-center py-2">Aucune note. Ajoute des observations au fil de tes interactions.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.slice(0, 3).map((n) => (
                          <NoteRow key={n.id} note={n} onDelete={() => deleteNote(n.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {activeTab === "activity" && (
              <Card title="Timeline d'activités" icon={<History size={13} className="text-[#2445EB]" />} count={timeline.length}>
                <div className="p-4">
                  {timeline.length === 0 ? (
                    <p className="text-[12px] text-zinc-400 italic text-center py-8">Aucune activité.</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-zinc-200" />
                      <div className="space-y-3">
                        {timeline.map((t, i) => (
                          <div key={i} className="flex items-start gap-3 relative">
                            <div className={`w-6 h-6 rounded-full bg-white border-2 border-zinc-200 ${t.color} flex items-center justify-center shrink-0 z-10`}>
                              {t.icon}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <p className="text-[12px] font-medium text-zinc-800 leading-snug">{t.label}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {new Date(t.date).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "outreach" && (
              <Card title="Historique outreach" icon={<Send size={13} className="text-[#2445EB]" />} count={messages.length}>
                <div className="p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[12px] text-zinc-400 italic mb-3">Aucun message généré encore.</p>
                      <button onClick={generateOutreach} className="px-3 py-1.5 bg-purple-600 text-white rounded text-[12px] font-semibold hover:bg-purple-700 inline-flex items-center gap-1.5">
                        <Sparkles size={11} /> Générer 4 messages personnalisés
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => (
                        <div key={m.id} className="border border-zinc-200 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                            <p className="text-[12px] font-bold text-zinc-700 capitalize">
                              {m.channel.replace(/_/g, " ")} <span className="text-zinc-400 font-normal">· Touch #{m.touch_number}</span>
                            </p>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              m.status === "sent" ? "bg-blue-100 text-blue-700" :
                              m.status === "replied" ? "bg-emerald-100 text-emerald-700" :
                              "bg-zinc-100 text-zinc-600"
                            }`}>
                              {m.status}
                            </span>
                          </div>
                          <div className="p-3">
                            {m.subject && <p className="text-[12px] font-semibold text-zinc-900 mb-1">{m.subject}</p>}
                            <p className="text-[12px] text-zinc-700 whitespace-pre-line leading-relaxed">{m.body}</p>
                            {m.reply_body && (
                              <div className="mt-3 pt-3 border-t border-zinc-200 bg-emerald-50 -mx-3 -mb-3 px-3 pb-3 pt-3 rounded-b-lg">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1 tracking-wider">↩ Réponse reçue</p>
                                <p className="text-[12px] text-zinc-800 whitespace-pre-line italic">{m.reply_body}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "notes" && (
              <Card title="Notes du recruteur" icon={<Edit3 size={13} className="text-[#2445EB]" />} count={notes.length}>
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ex: Appel de qualif fait — très intéressé, dispo dans 4 semaines, salaire OK…"
                      rows={2}
                      className="flex-1 px-3 py-2 rounded border border-zinc-200 text-[12px] focus:border-[#2445EB] outline-none resize-none"
                    />
                    <button onClick={addNote} disabled={!newNote.trim() || savingNote} className="px-4 bg-[#2445EB] text-white rounded text-[12px] font-semibold hover:bg-[#1A36C4] disabled:opacity-40 inline-flex items-center gap-1.5">
                      {savingNote ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Ajouter
                    </button>
                  </div>
                  {notes.length === 0 ? (
                    <p className="text-[12px] text-zinc-400 italic text-center py-8">Aucune note encore.</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((n) => <NoteRow key={n.id} note={n} onDelete={() => deleteNote(n.id)} />)}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "details" && (
              <Card title="Détails complets" icon={<FileText size={13} className="text-[#2445EB]" />}>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                  <DetailRow label="ID" value={candidate.id} mono />
                  <DetailRow label="Source" value={candidate.source || "—"} />
                  <DetailRow label="Status" value={statusInfo.label} />
                  <DetailRow label="Verdict IA" value={candidate.ai_verdict || "—"} />
                  <DetailRow label="Score IA" value={score !== null ? `${score}/100` : "Non scoré"} />
                  <DetailRow label="Email vérifié" value={candidate.email_verified ? "Oui ✓" : "Non"} />
                  <DetailRow label="Créé le" value={new Date(candidate.created_at).toLocaleString("fr-CA")} />
                  <DetailRow label="Livré le" value={candidate.delivered_at ? new Date(candidate.delivered_at).toLocaleString("fr-CA") : "—"} />
                  <DetailRow label="Embauché le" value={candidate.hired_at ? new Date(candidate.hired_at).toLocaleString("fr-CA") : "—"} />
                  <DetailRow label="Feedback client" value={candidate.client_feedback_at ? new Date(candidate.client_feedback_at).toLocaleString("fr-CA") : "—"} />
                  <div className="md:col-span-2 mt-2">
                    <DetailRow label="Raison feedback" value={candidate.client_feedback_reason || "—"} />
                  </div>
                  <div className="md:col-span-2">
                    <DetailRow label="Notes initiales" value={candidate.qualification_notes || "—"} multiline />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right rail (1/4) — Tags + Quick stats */}
          <div className="space-y-3">
            <Card title="Tags" icon={<Tag size={13} className="text-[#2445EB]" />} count={(candidate.tags || []).length}>
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(candidate.tags || []).map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><X size={9} /></button>
                    </span>
                  ))}
                  {(candidate.tags || []).length === 0 && (
                    <p className="text-[11px] text-zinc-400 italic">Aucun tag.</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Ajouter un tag…"
                    className="flex-1 px-2 py-1 rounded border border-zinc-200 text-[11px] focus:border-[#2445EB] outline-none"
                  />
                  <button onClick={addTag} className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-[11px] font-semibold text-zinc-700">+</button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 italic leading-snug">
                  Ex: priorité, hot-lead, à-recontacter-q4, top-talent
                </p>
              </div>
            </Card>

            <Card title="Pipeline rapide" icon={<TrendingUp size={13} className="text-[#2445EB]" />}>
              <div className="p-3 space-y-1">
                {PIPELINE_STAGES.map((stage, i) => (
                  <button
                    key={stage.key}
                    onClick={() => updateStatus(stage.key)}
                    disabled={updatingStatus}
                    className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-medium flex items-center gap-2 transition ${
                      i === currentStageIndex
                        ? "bg-[#2445EB] text-white"
                        : i < currentStageIndex
                        ? "text-emerald-700 hover:bg-emerald-50"
                        : "text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {i < currentStageIndex ? <CheckCircle2 size={11} /> : i === currentStageIndex ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <span className="w-2 h-2 rounded-full border border-zinc-300" />}
                    {stage.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS — Salesforce style
// ════════════════════════════════════════════════════════════════════════

function SalesPath({
  stages,
  currentIndex,
  isRejected,
  onChange,
  disabled,
}: {
  stages: { key: string; label: string; short: string }[];
  currentIndex: number;
  isRejected: boolean;
  onChange: (key: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center w-full">
      {stages.map((stage, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onChange(stage.key)}
              disabled={disabled}
              className={`flex-1 min-w-0 text-left px-3 py-2 transition relative group ${
                isCurrent && !isRejected
                  ? "bg-[#2445EB] text-white"
                  : isCurrent && isRejected
                  ? "bg-red-500 text-white"
                  : isPast
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              } ${i === 0 ? "rounded-l-md" : ""} ${i === stages.length - 1 ? "rounded-r-md" : ""}`}
              style={
                i < stages.length - 1
                  ? { clipPath: i === 0 ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)" : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)" }
                  : i > 0
                  ? { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)" }
                  : {}
              }
            >
              <div className="flex items-center gap-1.5 truncate">
                {isPast && <CheckCircle2 size={10} className="shrink-0" />}
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />}
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">{stage.short}</span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-[12px] font-semibold border-b-2 transition flex items-center gap-2 ${
        active ? "border-[#2445EB] text-[#2445EB]" : "border-transparent text-zinc-500 hover:text-zinc-900"
      }`}
    >
      {icon} {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-[#2445EB] text-white" : "bg-zinc-200 text-zinc-700"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Card({ title, icon, count, action, children }: { title: string; icon?: React.ReactNode; count?: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
      <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider">{title}</h2>
          {count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full font-bold">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoCell({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) {
  const content = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">{icon} {label}</p>
      <p className={`text-[12px] mt-0.5 truncate ${link ? "text-[#2445EB] hover:underline" : "text-zinc-800"}`}>{value}</p>
    </>
  );
  if (link) return <Link href={link}>{content}</Link>;
  return <div>{content}</div>;
}

function AnalysisCard({ color, title, items, icon }: { color: "emerald" | "amber" | "blue"; title: string; items: string[]; icon: React.ReactNode }) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    blue: "bg-blue-50 border-blue-100 text-blue-900",
  };
  if (items.length === 0) {
    return (
      <div className={`rounded-md border p-3 ${styles[color]} opacity-50`}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">{icon} {title}</p>
        <p className="text-[11px] italic">Aucune donnée IA</p>
      </div>
    );
  }
  return (
    <div className={`rounded-md border p-3 ${styles[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">{icon} {title}</p>
      <ul className="space-y-1 text-[11px]">
        {items.map((s, i) => <li key={i}>• {s}</li>)}
      </ul>
    </div>
  );
}

function NoteRow({ note, onDelete }: { note: Note; onDelete: () => void }) {
  return (
    <div className="bg-zinc-50 rounded p-2.5 border border-zinc-100 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[12px] text-zinc-800 whitespace-pre-line leading-relaxed">{note.content}</p>
          <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
            <Clock size={9} />
            <strong className="text-zinc-600 font-semibold">{note.author_name || "Recruteur"}</strong>
            <span>·</span>
            {new Date(note.created_at).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded">
          <Trash2 size={11} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, multiline }: { label: string; value: string; mono?: boolean; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`text-[12px] mt-0.5 text-zinc-800 ${mono ? "font-mono text-[11px]" : ""} ${multiline ? "whitespace-pre-line" : "truncate"}`}>{value}</p>
    </div>
  );
}
