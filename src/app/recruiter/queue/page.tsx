"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Loader2,
  Filter,
  Zap,
  MessageCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";

interface SourcedCandidate {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean;
  location_city: string;
  location_country: string;
  headline: string;
  ai_score: number | null;
  ai_verdict: string | null;
  ai_strengths: string[] | null;
  ai_concerns: string[] | null;
  ai_personalization_hooks: string[] | null;
  ai_outreach_angle: string | null;
  ai_likelihood_to_respond: string | null;
  salary_estimate: string | null;
  status: string;
  client_id: string;
  sourcing_run_id: string;
  client_company_name?: string;
  position_title?: string;
}

function QueuePageContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");
  const clientFilter = searchParams.get("client");

  const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreFilter, setScoreFilter] = useState<"all" | "strong" | "good" | "unscored">(
    "all"
  );
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadCandidates = async () => {
    try {
      let query = "?";
      if (runId) query += `sourcing_run_id=${runId}&`;
      if (clientFilter) query += `client_id=${clientFilter}&`;

      const res = await fetch(`/api/recruiter/queue${query}`);
      if (!res.ok) {
        console.error("[queue] fetch failed:", res.status);
        setCandidates([]);
      } else {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    // Refresh every 15 sec for new scores
    const interval = setInterval(loadCandidates, 15000);
    return () => clearInterval(interval);
  }, [runId, clientFilter]);

  const updateStatus = async (candidateId: string, newStatus: string) => {
    setProcessingIds((prev) => new Set(prev).add(candidateId));
    try {
      await fetch(`/api/recruiter/queue/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const generateOutreach = async (candidateId: string) => {
    setProcessingIds((prev) => new Set(prev).add(candidateId));
    try {
      const res = await fetch("/api/recruiter/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Move to outreach_ready status
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId ? { ...c, status: "outreach_ready" } : c
          )
        );
        toast.success("Messages générés. Va dans Outreach pour les envoyer.");
      } else {
        toast.error(`Erreur: ${data.error}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const rescoreUnscored = async () => {
    setScoring(true);
    try {
      await fetch("/api/recruiter/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score_batch",
          sourcing_run_id: runId,
          limit: 50,
        }),
      });
      await loadCandidates();
    } catch (err) {
      console.error(err);
    } finally {
      setScoring(false);
    }
  };

  // Filter by score
  const filtered = candidates.filter((c) => {
    if (scoreFilter === "all") return true;
    if (scoreFilter === "strong") return c.ai_verdict === "STRONG_MATCH";
    if (scoreFilter === "good")
      return c.ai_verdict === "STRONG_MATCH" || c.ai_verdict === "GOOD_MATCH";
    if (scoreFilter === "unscored") return !c.ai_score;
    return true;
  });

  // Sort by score DESC (unscored last)
  const sorted = [...filtered].sort((a, b) => {
    if (a.ai_score === null && b.ai_score === null) return 0;
    if (a.ai_score === null) return 1;
    if (b.ai_score === null) return -1;
    return (b.ai_score || 0) - (a.ai_score || 0);
  });

  const counts = {
    total: candidates.length,
    strong: candidates.filter((c) => c.ai_verdict === "STRONG_MATCH").length,
    good: candidates.filter(
      (c) => c.ai_verdict === "STRONG_MATCH" || c.ai_verdict === "GOOD_MATCH"
    ).length,
    unscored: candidates.filter((c) => !c.ai_score).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Queue</h1>
              <p className="text-[12px] text-zinc-500">
                {counts.total} candidats · {counts.strong} strong match · {counts.good} good+
              </p>
            </div>
            <div className="flex items-center gap-2">
              {counts.unscored > 0 && (
                <button
                  onClick={rescoreUnscored}
                  disabled={scoring}
                  className="px-3 py-2 bg-[#2445EB] text-white rounded-full text-[11px] font-semibold hover:bg-[#1A36C4] disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {scoring ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Scorer {counts.unscored}
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-3">
            <Filter size={11} className="text-zinc-400" />
            <FilterPill
              active={scoreFilter === "all"}
              onClick={() => setScoreFilter("all")}
              label="Tous"
              count={counts.total}
            />
            <FilterPill
              active={scoreFilter === "strong"}
              onClick={() => setScoreFilter("strong")}
              label="Strong match"
              count={counts.strong}
              color="emerald"
            />
            <FilterPill
              active={scoreFilter === "good"}
              onClick={() => setScoreFilter("good")}
              label="Good+"
              count={counts.good}
              color="blue"
            />
            <FilterPill
              active={scoreFilter === "unscored"}
              onClick={() => setScoreFilter("unscored")}
              label="Non scorés"
              count={counts.unscored}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-3">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <p className="text-[14px] text-zinc-500">Aucun candidat dans cette vue.</p>
            <Link
              href="/recruiter/source"
              className="inline-flex mt-4 px-4 py-2 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition"
            >
              Lancer un nouveau sourcing
            </Link>
          </div>
        ) : (
          sorted.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              processing={processingIds.has(candidate.id)}
              onKeep={() => updateStatus(candidate.id, "kept")}
              onReject={() => updateStatus(candidate.id, "rejected")}
              onGenerateOutreach={() => generateOutreach(candidate.id)}
            />
          ))
        )}
      </main>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: "emerald" | "blue";
}) {
  const activeColor =
    color === "emerald"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : color === "blue"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-zinc-900 text-white border-zinc-900";

  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
        active ? activeColor : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
      }`}
    >
      {label} · {count}
    </button>
  );
}

function CandidateCard({
  candidate,
  processing,
  onKeep,
  onReject,
  onGenerateOutreach,
}: {
  candidate: SourcedCandidate;
  processing: boolean;
  onKeep: () => void;
  onReject: () => void;
  onGenerateOutreach: () => void;
}) {
  const score = candidate.ai_score;
  const verdict = candidate.ai_verdict;

  const verdictColor =
    verdict === "STRONG_MATCH"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : verdict === "GOOD_MATCH"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : verdict === "BORDERLINE"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : verdict === "NOT_MATCH"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 transition">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[16px] font-bold text-zinc-900 truncate">
              {candidate.full_name}
            </h3>
            {candidate.email_verified && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-semibold">
                Email ✓
              </span>
            )}
            {candidate.status === "outreach_ready" && (
              <span className="text-[10px] bg-purple-100 text-purple-700 rounded px-1.5 py-0.5 font-semibold">
                Outreach prêt
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-600 mb-1">
            {candidate.current_title}
            {candidate.current_company ? ` · ${candidate.current_company}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
            {candidate.location_city && <span>📍 {candidate.location_city}</span>}
            {candidate.salary_estimate && <span>💰 ~{candidate.salary_estimate}</span>}
            {candidate.ai_likelihood_to_respond && (
              <span>⚡ {candidate.ai_likelihood_to_respond.split(" —")[0]}</span>
            )}
            {candidate.client_company_name && (
              <span className="font-semibold text-[#2445EB]">
                → {candidate.client_company_name}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="shrink-0 text-right">
          {score !== null ? (
            <>
              <p className="text-[28px] font-bold text-[#2445EB] leading-none">
                {score}
                <span className="text-[14px] text-zinc-400">/100</span>
              </p>
              {verdict && (
                <span
                  className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border ${verdictColor}`}
                >
                  {verdict.replace("_", " ")}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-400">Non scoré</span>
          )}
        </div>
      </div>

      {/* AI analysis */}
      {(candidate.ai_strengths?.length ||
        candidate.ai_concerns?.length ||
        candidate.ai_personalization_hooks?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Strengths
              </p>
              <ul className="space-y-0.5 text-[11px] text-emerald-800">
                {candidate.ai_strengths.slice(0, 3).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {candidate.ai_concerns && candidate.ai_concerns.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                Concerns
              </p>
              <ul className="space-y-0.5 text-[11px] text-amber-800">
                {candidate.ai_concerns.slice(0, 3).map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
          {candidate.ai_personalization_hooks &&
            candidate.ai_personalization_hooks.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1.5">
                  Hooks
                </p>
                <ul className="space-y-0.5 text-[11px] text-blue-800">
                  {candidate.ai_personalization_hooks.slice(0, 3).map((h, i) => (
                    <li key={i}>• {h}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition"
          >
            <ExternalLink size={10} /> LinkedIn
          </a>
        )}

        <div className="ml-auto flex items-center gap-2">
          {candidate.status === "new" && (
            <>
              <button
                onClick={onReject}
                disabled={processing}
                className="px-3 py-1.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition flex items-center gap-1"
              >
                <X size={11} /> Rejeter
              </button>
              <button
                onClick={onKeep}
                disabled={processing}
                className="px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition flex items-center gap-1"
              >
                <Check size={11} /> Garder
              </button>
            </>
          )}
          {(candidate.status === "kept" || candidate.status === "new") && (
            <button
              onClick={onGenerateOutreach}
              disabled={processing}
              className="px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-[#2445EB] to-[#4B5DF5] rounded-full hover:opacity-90 transition flex items-center gap-1 shadow-md shadow-[#2445EB]/20"
            >
              {processing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Zap size={11} />
              )}
              Générer outreach
            </button>
          )}
          {candidate.status === "outreach_ready" && (
            <Link
              href={`/recruiter/outreach?candidate=${candidate.id}`}
              className="px-3 py-1.5 text-[11px] font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700 transition flex items-center gap-1"
            >
              <MessageCircle size={11} /> Review outreach
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={20} />
        </div>
      }
    >
      <QueuePageContent />
    </Suspense>
  );
}
