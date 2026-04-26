"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ExternalLink,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  Filter,
  Award,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Candidate {
  id: string;
  full_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string | null;
  ai_score: number | null;
  ai_verdict: string | null;
  ai_strengths: string[] | null;
  ai_concerns: string[] | null;
  status: string;
  qualification_notes: string | null;
  salary_expectation: string | null;
  availability: string | null;
  delivered_at: string | null;
  location_city: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  delivered: { label: "Delivered to you", color: "bg-blue-100 text-blue-700 border-blue-200" },
  client_interested: { label: "You're interested", color: "bg-purple-100 text-purple-700 border-purple-200" },
  hired: { label: "Hired", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  qualifying: { label: "Being qualified", color: "bg-amber-100 text-amber-700 border-amber-200" },
  qualified: { label: "Qualified", color: "bg-amber-100 text-amber-700 border-amber-200" },
  replied_interested: { label: "Replied interested", color: "bg-purple-100 text-purple-700 border-purple-200" },
  outreached: { label: "Outreached", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "delivered" | "hired" | "interested">("delivered");

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("client_company_id, role")
          .eq("id", user.id)
          .single();

        let query = supabase.from("sourced_candidates").select("*");

        // If client, filter by their company; if admin/recruiter, show all
        if (profile?.role === "client" && profile.client_company_id) {
          query = query.eq("client_id", profile.client_company_id);
        }

        // Show delivered + later stages by default
        query = query
          .in("status", ["delivered", "client_interested", "qualifying", "qualified", "hired", "replied_interested", "outreached"])
          .order("delivered_at", { ascending: false, nullsFirst: false });

        const { data } = await query;
        setCandidates((data as Candidate[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  // Filter
  const filtered = candidates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "delivered") return ["delivered", "client_interested"].includes(c.status);
    if (filter === "hired") return c.status === "hired";
    if (filter === "interested") return ["client_interested", "qualifying", "qualified"].includes(c.status);
    return true;
  });

  const counts = {
    all: candidates.length,
    delivered: candidates.filter((c) => ["delivered", "client_interested"].includes(c.status)).length,
    interested: candidates.filter((c) => ["client_interested", "qualifying", "qualified"].includes(c.status)).length,
    hired: candidates.filter((c) => c.status === "hired").length,
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-zinc-900 tracking-tight">Candidates</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} in your pipeline
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className="text-zinc-400" />
        <FilterPill active={filter === "delivered"} onClick={() => setFilter("delivered")} label="Delivered" count={counts.delivered} color="blue" />
        <FilterPill active={filter === "interested"} onClick={() => setFilter("interested")} label="Interested" count={counts.interested} color="purple" />
        <FilterPill active={filter === "hired"} onClick={() => setFilter("hired")} label="Hired" count={counts.hired} color="emerald" />
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" count={counts.all} />
      </div>

      {/* Candidates list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Users size={28} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-zinc-900 mb-1">No candidates yet</p>
          <p className="text-[12px] text-zinc-500 max-w-sm mx-auto">
            Your dedicated recruiter is sourcing now. First batch delivered within 5-7 days
            of kickoff call.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
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
  color?: "blue" | "purple" | "emerald";
}) {
  const activeColor =
    color === "blue"
      ? "bg-blue-600 text-white border-blue-600"
      : color === "purple"
      ? "bg-purple-600 text-white border-purple-600"
      : color === "emerald"
      ? "bg-emerald-600 text-white border-emerald-600"
      : "bg-zinc-900 text-white border-zinc-900";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
        active ? activeColor : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
      }`}
    >
      {label} · {count}
    </button>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const score = candidate.ai_score || 0;
  const verdict = candidate.ai_verdict;
  const status = STATUS_LABELS[candidate.status] || { label: candidate.status, color: "bg-zinc-100 text-zinc-700 border-zinc-200" };

  const scoreColor =
    score >= 85
      ? "text-emerald-700 bg-emerald-100 border-emerald-200"
      : score >= 70
      ? "text-blue-700 bg-blue-100 border-blue-200"
      : "text-amber-700 bg-amber-100 border-amber-200";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-[16px] font-bold text-zinc-900">{candidate.full_name}</h3>
            <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[13px] text-zinc-600">
            {candidate.current_title}
            {candidate.current_company ? ` · ${candidate.current_company}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 mt-1">
            {candidate.location_city && <span>📍 {candidate.location_city}</span>}
            {candidate.salary_expectation && <span>💰 {candidate.salary_expectation}</span>}
            {candidate.availability && <span>⏱️ {candidate.availability}</span>}
            {candidate.delivered_at && (
              <span>
                Delivered {new Date(candidate.delivered_at).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {score > 0 && (
          <div className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-bold border ${scoreColor}`}>
            {score}/100
          </div>
        )}
      </div>

      {/* Why a fit + concerns */}
      {(candidate.ai_strengths?.length || candidate.qualification_notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 mt-4">
          {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                Why she&apos;s a fit
              </p>
              <ul className="space-y-1">
                {candidate.ai_strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[12px] text-emerald-800 flex items-start gap-1.5">
                    <CheckCircle2 size={11} className="mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {candidate.qualification_notes && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                Recruiter notes
              </p>
              <p className="text-[12px] text-blue-800 line-clamp-3">{candidate.qualification_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition"
          >
            <ExternalLink size={11} /> LinkedIn
          </a>
        )}
        <Link
          href={`/candidats/${candidate.id}?action=interview`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#2445EB] rounded-full hover:bg-[#1A36C4] transition ml-auto"
        >
          <Calendar size={11} /> Schedule interview
        </Link>
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition"
        >
          <MessageCircle size={11} /> Question
        </Link>
      </div>
    </div>
  );
}
