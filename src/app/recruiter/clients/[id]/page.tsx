"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Sparkles,
  Plus,
  MessageCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Send,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Client {
  id: string;
  company_name: string;
  country: string;
  company_size: string | null;
  industry: string | null;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_role: string | null;
  plan: string;
  mrr_usd: number;
  billing_start_date: string;
  status: string;
  roles_hiring_for: string | null;
  recruteur_lead: string | null;
  notes: string | null;
  first_shortlist_delivered_at: string | null;
  kickoff_call_completed_at: string | null;
}

interface Candidate {
  id: string;
  full_name: string;
  current_title: string;
  current_company: string;
  ai_score: number | null;
  ai_verdict: string | null;
  status: string;
  delivered_at: string | null;
}

interface SourcingRun {
  id: string;
  position_title: string;
  candidates_found: number;
  candidates_after_dedupe: number;
  status: string;
  started_at: string;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sourcingRuns, setSourcingRuns] = useState<SourcingRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        const { data: c } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .single();
        setClient(c as Client);

        const { data: cands } = await supabase
          .from("sourced_candidates")
          .select("id, full_name, current_title, current_company, ai_score, ai_verdict, status, delivered_at")
          .eq("client_id", id)
          .order("ai_score", { ascending: false, nullsFirst: false });
        setCandidates((cands as Candidate[]) || []);

        const { data: runs } = await supabase
          .from("sourcing_runs")
          .select("id, position_title, candidates_found, candidates_after_dedupe, status, started_at")
          .eq("client_id", id)
          .order("started_at", { ascending: false });
        setSourcingRuns((runs as SourcingRun[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl">
        <Link href="/recruiter" className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-4">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <p className="text-zinc-500">Client not found.</p>
      </div>
    );
  }

  const startDate = new Date(client.billing_start_date);
  const daysActive = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Pipeline counts
  const pipeline = {
    sourced: candidates.length,
    outreached: candidates.filter((c) => c.status === "outreached").length,
    interested: candidates.filter((c) => c.status === "replied_interested").length,
    qualified: candidates.filter((c) => ["qualifying", "qualified"].includes(c.status)).length,
    delivered: candidates.filter((c) => c.status === "delivered").length,
    hired: candidates.filter((c) => c.status === "hired").length,
  };

  return (
    <div className="max-w-6xl">
      <Link
        href="/recruiter"
        className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-4"
      >
        <ArrowLeft size={12} /> Back to clients
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                  {client.plan}
                </span>
                <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5 font-semibold">
                  Day {daysActive}
                </span>
                <span className="text-[10px] bg-emerald-500/90 rounded-full px-2 py-0.5 font-semibold">
                  {client.status}
                </span>
              </div>
              <h1 className="text-[28px] font-bold tracking-tight">{client.company_name}</h1>
              <p className="text-[14px] text-white/80 mt-1">
                {client.industry} · {client.country}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/recruiter/source?client=${client.id}`}
                className="px-4 py-2.5 bg-white text-[#2445EB] rounded-full text-[12px] font-bold hover:bg-zinc-100 transition flex items-center gap-2"
              >
                <Sparkles size={12} /> Source new
              </Link>
              <Link
                href={`/recruiter/deliver?client=${client.id}`}
                className="px-4 py-2.5 bg-white/10 backdrop-blur text-white border border-white/20 rounded-full text-[12px] font-semibold hover:bg-white/20 transition flex items-center gap-2"
              >
                <Plus size={12} /> Deliver candidate
              </Link>
            </div>
          </div>

          {/* Pipeline mini */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-3">
            <PipelineMini label="Sourced" value={pipeline.sourced} />
            <PipelineMini label="Outreached" value={pipeline.outreached} />
            <PipelineMini label="Interested" value={pipeline.interested} />
            <PipelineMini label="Qualified" value={pipeline.qualified} />
            <PipelineMini label="Delivered" value={pipeline.delivered} highlight />
            <PipelineMini label="Hired" value={pipeline.hired} highlight />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roles */}
          {client.roles_hiring_for && (
            <Section title="Roles hiring for" icon={<Building2 size={14} />}>
              <p className="text-[14px] text-zinc-700 whitespace-pre-line leading-relaxed">
                {client.roles_hiring_for}
              </p>
            </Section>
          )}

          {/* Notes */}
          {client.notes && (
            <Section title="Internal notes" icon={<Sparkles size={14} />}>
              <p className="text-[13px] text-zinc-600 italic leading-relaxed">{client.notes}</p>
            </Section>
          )}

          {/* Candidates list */}
          <Section
            title={`Candidates (${candidates.length})`}
            icon={<Users size={14} />}
            action={
              <Link
                href={`/recruiter/queue?client=${client.id}`}
                className="text-[11px] text-[#2445EB] font-semibold hover:underline flex items-center gap-1"
              >
                Full queue <ExternalLink size={10} />
              </Link>
            }
          >
            {candidates.length === 0 ? (
              <p className="text-[13px] text-zinc-500 text-center py-6">
                No candidates yet. Launch a sourcing run to start.
              </p>
            ) : (
              <div className="space-y-2">
                {candidates.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    href={`/recruiter/queue?client=${client.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 transition group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-[11px] font-bold text-zinc-700 shrink-0">
                      {c.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">
                        {c.full_name}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {c.current_title}
                      </p>
                    </div>
                    {c.ai_score && (
                      <span
                        className={`text-[11px] font-bold rounded px-1.5 py-0.5 ${
                          c.ai_score >= 85
                            ? "bg-emerald-100 text-emerald-700"
                            : c.ai_score >= 70
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.ai_score}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 capitalize w-20 text-right">
                      {c.status?.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          {/* Sourcing history */}
          <Section title={`Sourcing history (${sourcingRuns.length})`} icon={<Sparkles size={14} />}>
            {sourcingRuns.length === 0 ? (
              <p className="text-[13px] text-zinc-500 text-center py-6">No sourcing runs yet.</p>
            ) : (
              <div className="space-y-2">
                {sourcingRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-50"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">
                        {run.position_title}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {new Date(run.started_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-zinc-900">
                        {run.candidates_after_dedupe}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        ({run.candidates_found} raw)
                      </p>
                    </div>
                    <span
                      className={`ml-3 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                        run.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <Section title="Primary contact" icon={<Users size={14} />}>
            <div className="space-y-3">
              <div>
                <p className="text-[14px] font-semibold text-zinc-900">
                  {client.contact_first_name} {client.contact_last_name}
                </p>
                {client.contact_role && (
                  <p className="text-[11px] text-zinc-500">{client.contact_role}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <a
                  href={`mailto:${client.contact_email}`}
                  className="flex items-center gap-2 text-[12px] text-[#2445EB] hover:underline"
                >
                  <Send size={11} /> {client.contact_email}
                </a>
                {client.contact_phone && (
                  <p className="flex items-center gap-2 text-[12px] text-zinc-700">
                    📞 {client.contact_phone}
                  </p>
                )}
              </div>
              <Link
                href={`/recruiter/messages`}
                className="block w-full text-center py-2 bg-[#2445EB]/10 text-[#2445EB] rounded-lg text-[12px] font-semibold hover:bg-[#2445EB]/20 transition"
              >
                <MessageCircle size={11} className="inline mr-1" />
                Open chat
              </Link>
            </div>
          </Section>

          {/* Subscription */}
          <Section title="Subscription" icon={<DollarSign size={14} />}>
            <div className="space-y-3">
              <KPI label="MRR" value={`$${client.mrr_usd.toLocaleString()}`} />
              <KPI label="Plan" value={client.plan?.toUpperCase()} />
              <KPI label="Started" value={startDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} />
              <KPI label="Days active" value={`${daysActive}d`} />
            </div>
          </Section>

          {/* Health checks */}
          <Section title="Onboarding milestones" icon={<CheckCircle2 size={14} />}>
            <div className="space-y-2">
              <Milestone
                label="Kickoff call"
                done={!!client.kickoff_call_completed_at}
                date={client.kickoff_call_completed_at}
              />
              <Milestone
                label="First shortlist delivered"
                done={!!client.first_shortlist_delivered_at}
                date={client.first_shortlist_delivered_at}
              />
              <Milestone
                label="First hire confirmed"
                done={pipeline.hired > 0}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function PipelineMini({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-white/15" : "bg-white/5"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">{label}</p>
      <p className="text-[20px] font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <h3 className="text-[13px] font-bold text-zinc-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className="text-[13px] font-semibold text-zinc-900 tabular-nums">{value}</span>
    </div>
  );
}

function Milestone({ label, done, date }: { label: string; done: boolean; date?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-emerald-100" : "bg-zinc-100"
        }`}
      >
        {done ? (
          <CheckCircle2 size={11} className="text-emerald-600" />
        ) : (
          <Clock size={10} className="text-zinc-400" />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-[12px] ${done ? "text-zinc-900 font-semibold" : "text-zinc-500"}`}>
          {label}
        </p>
        {date && (
          <p className="text-[10px] text-zinc-400">
            {new Date(date).toLocaleDateString([], { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
