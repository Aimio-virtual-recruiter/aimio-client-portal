"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface OutreachMessage {
  id: string;
  candidate_id: string;
  channel: "linkedin_connection" | "linkedin_inmail" | "email" | "linkedin_followup";
  touch_number: number;
  subject: string | null;
  body: string;
  status: string;
}

interface CandidateWithMessages {
  id: string;
  full_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean;
  ai_score: number | null;
  ai_verdict: string | null;
  status: string;
  messages: OutreachMessage[];
  client_company_name?: string;
  position_title?: string;
}

function OutreachPageContent() {
  const searchParams = useSearchParams();
  const focusCandidateId = searchParams.get("candidate");

  const [candidates, setCandidates] = useState<CandidateWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [editedMessages, setEditedMessages] = useState<Record<string, Partial<OutreachMessage>>>(
    {}
  );

  const loadCandidates = async () => {
    try {
      const res = await fetch("/api/recruiter/queue?status=outreach_ready");
      const data = await res.json();
      const queueCandidates = data.candidates || [];

      // Load messages for each candidate
      const withMessages = await Promise.all(
        queueCandidates.map(async (c: CandidateWithMessages) => {
          const detailRes = await fetch(`/api/recruiter/queue/${c.id}`);
          const detailData = await detailRes.json();
          return {
            ...c,
            messages: detailData.outreach_messages || [],
          };
        })
      );

      setCandidates(withMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const updateMessage = (messageId: string, field: "subject" | "body", value: string) => {
    setEditedMessages((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], [field]: value },
    }));
  };

  const getMessageValue = (msg: OutreachMessage, field: "subject" | "body") => {
    return editedMessages[msg.id]?.[field] ?? msg[field] ?? "";
  };

  const sendLinkedIn = async (candidate: CandidateWithMessages) => {
    setSendingIds((prev) => new Set(prev).add(candidate.id));
    try {
      const linkedInMessages = candidate.messages.filter(
        (m) => m.channel === "linkedin_connection" || m.channel === "linkedin_inmail"
      );
      if (linkedInMessages.length === 0) return;

      // Apply any edits first
      for (const msg of linkedInMessages) {
        if (editedMessages[msg.id]) {
          await fetch(`/api/recruiter/outreach-messages/${msg.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedMessages[msg.id]),
          });
        }
      }

      const res = await fetch("/api/recruiter/send-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: linkedInMessages.map((m) => m.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✓ ${data.launches?.length || 0} Phantoms lancés`);
      await loadCandidates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    }
  };

  const sendEmail = async (candidate: CandidateWithMessages) => {
    setSendingIds((prev) => new Set(prev).add(candidate.id));
    try {
      const emailMessages = candidate.messages.filter((m) => m.channel === "email");
      if (emailMessages.length === 0) return;

      const res = await fetch("/api/recruiter/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: emailMessages.map((m) => m.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✓ ${data.sent || 0} emails envoyés via ${data.provider}`);
      await loadCandidates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    }
  };

  const regenerateOutreach = async (candidateId: string) => {
    setSendingIds((prev) => new Set(prev).add(candidateId));
    try {
      await fetch("/api/recruiter/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      await loadCandidates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={20} />
      </div>
    );
  }

  const sorted = focusCandidateId
    ? [
        ...candidates.filter((c) => c.id === focusCandidateId),
        ...candidates.filter((c) => c.id !== focusCandidateId),
      ]
    : candidates;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Outreach</h1>
          <p className="text-[12px] text-zinc-500">
            {candidates.length} candidats prêts · Review, ajuste, envoie
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <p className="text-[14px] text-zinc-500 mb-4">Aucun candidat en outreach ready.</p>
            <Link
              href="/recruiter/queue"
              className="inline-flex px-4 py-2 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition"
            >
              Aller à la queue
            </Link>
          </div>
        ) : (
          sorted.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[16px] font-bold text-zinc-900 truncate">
                      {candidate.full_name}
                    </h2>
                    {candidate.ai_score && (
                      <span className="text-[11px] bg-[#2445EB]/10 text-[#2445EB] rounded px-1.5 py-0.5 font-bold">
                        {candidate.ai_score}/100
                      </span>
                    )}
                    {candidate.email_verified && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-semibold">
                        ✓ Email
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-zinc-600">
                    {candidate.current_title} · {candidate.current_company}
                  </p>
                  {candidate.client_company_name && (
                    <p className="text-[11px] text-[#2445EB] font-semibold mt-1">
                      → Pour {candidate.client_company_name} · {candidate.position_title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-100 rounded-full hover:bg-zinc-200 transition"
                    >
                      <ExternalLink size={10} /> Profile
                    </a>
                  )}
                  <button
                    onClick={() => regenerateOutreach(candidate.id)}
                    disabled={sendingIds.has(candidate.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-[#2445EB] bg-[#2445EB]/10 rounded-full hover:bg-[#2445EB]/20 transition"
                  >
                    <Sparkles size={10} /> Regénérer
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="divide-y divide-zinc-100">
                {candidate.messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    subject={getMessageValue(msg, "subject")}
                    body={getMessageValue(msg, "body")}
                    onSubjectChange={(v) => updateMessage(msg.id, "subject", v)}
                    onBodyChange={(v) => updateMessage(msg.id, "body", v)}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="p-5 bg-zinc-50 flex items-center justify-end gap-2">
                <button
                  onClick={() => sendLinkedIn(candidate)}
                  disabled={sendingIds.has(candidate.id) || !candidate.linkedin_url}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-[#0A66C2] rounded-full hover:bg-[#084d8f] disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {sendingIds.has(candidate.id) ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <LinkedInIcon />
                  )}
                  Envoyer LinkedIn
                </button>
                <button
                  onClick={() => sendEmail(candidate)}
                  disabled={sendingIds.has(candidate.id) || !candidate.email}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-[#2445EB] rounded-full hover:bg-[#1A36C4] disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {sendingIds.has(candidate.id) ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Mail size={12} />
                  )}
                  Envoyer Email
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

function MessageRow({
  message,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: {
  message: OutreachMessage;
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}) {
  const channelConfig = {
    linkedin_connection: {
      label: "LinkedIn — Connection Request",
      color: "bg-[#0A66C2]/10 text-[#0A66C2]",
      maxChars: 300,
      showSubject: false,
    },
    linkedin_inmail: {
      label: "LinkedIn — InMail",
      color: "bg-[#0A66C2]/10 text-[#0A66C2]",
      maxChars: null,
      showSubject: true,
    },
    email: {
      label: "Email — Cold outreach",
      color: "bg-[#2445EB]/10 text-[#2445EB]",
      maxChars: null,
      showSubject: true,
    },
    linkedin_followup: {
      label: "LinkedIn — Follow-up",
      color: "bg-[#0A66C2]/10 text-[#0A66C2]",
      maxChars: null,
      showSubject: false,
    },
  };

  const config = channelConfig[message.channel];
  const charCount = body.length;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 ${config.color}`}>
            Touch {message.touch_number}
          </span>
          <span className="text-[12px] font-semibold text-zinc-700">{config.label}</span>
          {message.status === "sent" && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-semibold">
              <CheckCircle2 size={9} /> Envoyé
            </span>
          )}
        </div>
        {config.maxChars && (
          <span
            className={`text-[10px] font-mono ${
              charCount > config.maxChars ? "text-red-600" : "text-zinc-400"
            }`}
          >
            {charCount}/{config.maxChars}
          </span>
        )}
      </div>

      {config.showSubject && (
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Subject..."
          className="w-full mb-2 px-3 py-2 text-[13px] font-semibold border border-zinc-200 rounded-lg focus:border-[#2445EB] outline-none"
        />
      )}
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={message.channel === "linkedin_connection" ? 3 : 5}
        className={`w-full px-3 py-2 text-[13px] border rounded-lg outline-none resize-y ${
          config.maxChars && charCount > config.maxChars
            ? "border-red-300 focus:border-red-500"
            : "border-zinc-200 focus:border-[#2445EB]"
        }`}
      />
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function OutreachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={20} />
        </div>
      }
    >
      <OutreachPageContent />
    </Suspense>
  );
}
