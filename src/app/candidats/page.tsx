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
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase,
  Award,
  ArrowRight,
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
  ai_personalization_hooks: string[] | null;
  status: string;
  qualification_notes: string | null;
  salary_expectation: string | null;
  availability: string | null;
  delivered_at: string | null;
  location_city: string | null;
  email: string | null;
  email_verified: boolean | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  delivered: {
    label: "Awaiting your review",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  client_interested: {
    label: "Interview scheduled",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  hired: {
    label: "Hired",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  qualifying: {
    label: "In qualification",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  qualified: {
    label: "Just qualified",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  replied_interested: {
    label: "Candidate interested",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  outreached: {
    label: "Reaching out",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    dot: "bg-zinc-400",
  },
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "delivered" | "interview" | "hired">("delivered");
  const [userName, setUserName] = useState<string>("");

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
          .select("first_name, client_company_id, role")
          .eq("id", user.id)
          .single();

        setUserName(profile?.first_name || "");

        let query = supabase.from("sourced_candidates").select("*");

        if (profile?.role === "client" && profile.client_company_id) {
          query = query.eq("client_id", profile.client_company_id);
        }

        query = query
          .in("status", [
            "delivered",
            "client_interested",
            "qualifying",
            "qualified",
            "hired",
            "replied_interested",
            "outreached",
          ])
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

  const filtered = candidates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "delivered") return c.status === "delivered";
    if (filter === "interview") return ["client_interested", "qualifying", "qualified"].includes(c.status);
    if (filter === "hired") return c.status === "hired";
    return true;
  });

  const counts = {
    all: candidates.length,
    delivered: candidates.filter((c) => c.status === "delivered").length,
    interview: candidates.filter((c) => ["client_interested", "qualifying", "qualified"].includes(c.status)).length,
    hired: candidates.filter((c) => c.status === "hired").length,
  };

  return (
    <div className="max-w-6xl">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">
          Your candidates
          {userName && (
            <span className="text-zinc-400 font-normal">, {userName}</span>
          )}
        </h1>
        <p className="text-[14px] text-zinc-500 mt-1.5">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} in your hiring pipeline ·{" "}
          <span className="text-emerald-600 font-semibold">{counts.delivered}</span> awaiting your decision
        </p>
      </div>

      {/* Quick stats — glanceable summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile
          label="Awaiting review"
          value={counts.delivered}
          icon={<Sparkles size={14} />}
          color="blue"
          highlight
        />
        <StatTile
          label="In interviews"
          value={counts.interview}
          icon={<Calendar size={14} />}
          color="purple"
        />
        <StatTile
          label="Hired"
          value={counts.hired}
          icon={<Award size={14} />}
          color="emerald"
        />
        <StatTile
          label="Total pipeline"
          value={counts.all}
          icon={<TrendingUp size={14} />}
          color="zinc"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-zinc-200">
        <Tab
          active={filter === "delivered"}
          onClick={() => setFilter("delivered")}
          label="To review"
          count={counts.delivered}
          color="blue"
        />
        <Tab
          active={filter === "interview"}
          onClick={() => setFilter("interview")}
          label="In interviews"
          count={counts.interview}
          color="purple"
        />
        <Tab
          active={filter === "hired"}
          onClick={() => setFilter("hired")}
          label="Hired"
          count={counts.hired}
          color="emerald"
        />
        <Tab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={counts.all}
        />
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ STAT TILE ============
function StatTile({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "purple" | "emerald" | "zinc";
  highlight?: boolean;
}) {
  const colors = {
    blue: highlight
      ? "bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white"
      : "bg-blue-50 text-blue-700 border border-blue-100",
    purple: "bg-purple-50 text-purple-700 border border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    zinc: "bg-white border border-zinc-200 text-zinc-700",
  };
  return (
    <div className={`rounded-2xl p-4 transition ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-2 opacity-90">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-[28px] font-bold tracking-tight tabular-nums ${highlight ? "text-white" : ""}`}>
        {value}
      </p>
    </div>
  );
}

// ============ TAB ============
function Tab({
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
  const activeBorder =
    color === "blue"
      ? "border-blue-600 text-blue-700"
      : color === "purple"
      ? "border-purple-600 text-purple-700"
      : color === "emerald"
      ? "border-emerald-600 text-emerald-700"
      : "border-zinc-900 text-zinc-900";

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition relative -mb-px ${
        active ? activeBorder : "border-transparent text-zinc-500 hover:text-zinc-900"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-[11px] tabular-nums ${
          active ? "opacity-80" : "opacity-50"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ============ CANDIDATE CARD — PREMIUM REDESIGN ============
function CandidateCard({ candidate }: { candidate: Candidate }) {
  const score = candidate.ai_score || 0;
  const status = STATUS_CONFIG[candidate.status] || {
    label: candidate.status,
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    dot: "bg-zinc-400",
  };

  // Get initials for avatar
  const initials = candidate.full_name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Color gradient for avatar based on score
  const avatarGradient =
    score >= 85
      ? "from-emerald-400 to-emerald-600"
      : score >= 70
      ? "from-blue-400 to-blue-600"
      : "from-amber-400 to-amber-600";

  // Score color
  const scoreRingColor =
    score >= 85
      ? "stroke-emerald-500"
      : score >= 70
      ? "stroke-blue-500"
      : "stroke-amber-500";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all duration-200 group">
      {/* Header with avatar + score */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-[18px] shadow-sm shrink-0`}
          >
            {initials}
          </div>

          {/* Name + Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-zinc-900 leading-tight">
              {candidate.full_name}
            </h3>
            <p className="text-[13px] text-zinc-600 mt-0.5 truncate">
              {candidate.current_title}
            </p>
            {candidate.current_company && (
              <div className="flex items-center gap-1 text-[12px] text-zinc-500 mt-1">
                <Briefcase size={11} />
                <span className="truncate">{candidate.current_company}</span>
              </div>
            )}
          </div>

          {/* Score circle */}
          {score > 0 && (
            <div className="shrink-0 relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  className="stroke-zinc-100"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  className={scoreRingColor}
                  strokeWidth="4"
                  strokeDasharray={`${(score / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[16px] font-bold text-zinc-900 leading-none tabular-nums">
                  {score}
                </span>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                  fit
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status pill + meta */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
            {status.label}
          </div>

          {candidate.location_city && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <MapPin size={10} />
              {candidate.location_city}
            </span>
          )}
          {candidate.salary_expectation && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <DollarSign size={10} />
              {candidate.salary_expectation}
            </span>
          )}
          {candidate.availability && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock size={10} />
              {candidate.availability}
            </span>
          )}
        </div>
      </div>

      {/* Why a fit (strengths) */}
      {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Why she&apos;s a fit
          </p>
          <ul className="space-y-1.5">
            {candidate.ai_strengths.slice(0, 3).map((s, i) => (
              <li
                key={i}
                className="text-[12px] text-zinc-700 flex items-start gap-2 leading-relaxed"
              >
                <CheckCircle2
                  size={12}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recruiter notes */}
      {candidate.qualification_notes && (
        <div className="px-5 pb-5">
          <div className="bg-gradient-to-br from-zinc-50 to-white border border-zinc-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Recruiter notes
            </p>
            <p className="text-[12px] text-zinc-700 leading-relaxed line-clamp-3">
              {candidate.qualification_notes}
            </p>
          </div>
        </div>
      )}

      {/* Action footer */}
      <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {candidate.linkedin_url && (
            <a
              href={candidate.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-[#0A66C2] hover:bg-white transition"
              title="View LinkedIn"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <Link
            href="/messages"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white transition"
            title="Ask a question"
          >
            <MessageCircle size={13} />
          </Link>
        </div>

        <Link
          href={`/candidats/${candidate.id}?action=interview`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#2445EB] rounded-full hover:bg-[#1A36C4] transition group-hover:gap-2"
        >
          Schedule interview
          <ArrowRight size={11} className="transition" />
        </Link>
      </div>
    </div>
  );
}

// ============ EMPTY STATE ============
function EmptyState({ filter }: { filter: string }) {
  const messages = {
    delivered: {
      icon: <Sparkles size={32} className="text-blue-300" />,
      title: "No candidates to review yet",
      sub: "Your dedicated recruiter is sourcing now. First batch usually delivered within 5-7 days of kickoff call.",
    },
    interview: {
      icon: <Calendar size={32} className="text-purple-300" />,
      title: "No interviews in progress",
      sub: "Once you schedule interviews with delivered candidates, they'll appear here.",
    },
    hired: {
      icon: <Award size={32} className="text-emerald-300" />,
      title: "No hires yet",
      sub: "Your first hire will be celebrated here when confirmed.",
    },
    all: {
      icon: <Users size={32} className="text-zinc-300" />,
      title: "Pipeline is empty",
      sub: "Candidates will appear here as they're sourced and qualified.",
    },
  };

  const msg = messages[filter as keyof typeof messages] || messages.all;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
      <div className="flex justify-center mb-4">{msg.icon}</div>
      <h3 className="text-[16px] font-bold text-zinc-900 mb-2">{msg.title}</h3>
      <p className="text-[13px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
        {msg.sub}
      </p>
    </div>
  );
}
