"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Clock, CheckCircle2, XCircle, MessageSquare, ArrowRight, Send, RefreshCw } from "lucide-react";

interface OutreachEmail {
  id: string;
  candidate_id: string;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  sequence_step: number;
  sent_at: string;
  replied_at: string | null;
  candidates?: { name: string; current_title: string };
}

export default function OutreachPage() {
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('outreach_emails')
        .select('*, candidates(name, current_title)')
        .order('sent_at', { ascending: false });
      setEmails(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const stepLabel = (step: number) => {
    if (step === 1) return "Initial outreach";
    if (step === 2) return "Follow-up #1 (Day 3)";
    return "Final follow-up (Day 7)";
  };

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    replied: emails.filter(e => e.replied_at).length,
    pending: emails.filter(e => !e.replied_at && e.status === 'sent').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-300">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Outreach tracking</h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">All emails sent to candidates and their status</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium btn-press">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total emails sent", value: stats.total, icon: Send, color: "#6C2BD9" },
          { label: "Awaiting response", value: stats.pending, icon: Clock, color: "#6C2BD9" },
          { label: "Replied", value: stats.replied, icon: MessageSquare, color: "#10B981" },
          { label: "Response rate", value: stats.total > 0 ? `${Math.round((stats.replied / stats.total) * 100)}%` : "—", icon: CheckCircle2, color: "#3B82F6" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} style={{ color: stat.color }} strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
              <p className="label mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Email list */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[13px] font-semibold text-zinc-900">All outreach emails</h2>
        </div>

        {emails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={24} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-400">No emails sent yet</p>
            <p className="text-[11px] text-zinc-300 mt-1">Process a candidate to send the first outreach</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {emails.map((email) => (
              <div key={email.id} className="px-5 py-4 hover:bg-zinc-50/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center ring-2 ring-white">
                      <span className="text-[9px] font-semibold text-zinc-500">
                        {email.candidates?.name?.split(" ").map(n => n[0]).join("") || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-zinc-900">{email.candidates?.name || "Unknown"}</p>
                      <p className="text-[11px] text-zinc-400">{email.to_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">{stepLabel(email.sequence_step)}</span>
                    {email.replied_at ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold">
                        <CheckCircle2 size={10} /> Replied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-[#6C2BD9]/10 text-[#6C2BD9] rounded-md text-[10px] font-semibold">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-11">
                  <p className="text-[11px] text-zinc-500"><strong>Subject:</strong> {email.subject}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Sent {new Date(email.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
