"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, type Mandate } from "@/lib/supabase";
import { Sparkles, Loader2, ArrowLeft, Plus, Trash2, CheckCircle2, Send, Copy, Mail, Link2, AlertCircle } from "lucide-react";

export default function NewCandidateWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>}>
      <NewCandidatePage />
    </Suspense>
  );
}

function NewCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params from sourcing (Apollo) or elsewhere
  const preselectedMandate = searchParams.get('mandate');
  const prefillName = searchParams.get('name');
  const prefillTitle = searchParams.get('title');
  const prefillCompany = searchParams.get('company');
  const prefillLocation = searchParams.get('location');
  const prefillEmail = searchParams.get('email');
  const prefillLinkedIn = searchParams.get('linkedin');

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const [form, setForm] = useState({
    mandate_id: preselectedMandate || '',
    name: prefillName || '',
    current_title: prefillTitle || '',
    current_company: prefillCompany || '',
    location: prefillLocation || '',
    experience_years: '',
    education: '',
    languages: 'English',
    salary_expectations: '',
    availability: '',
    candidate_email: prefillEmail || '',
    notes: prefillLinkedIn ? `LinkedIn: ${prefillLinkedIn}` : '',
    career_history: [{ title: '', company: '', period: '' }],
  });

  useEffect(() => {
    async function loadMandates() {
      const { data } = await supabase.from('mandates').select('*').eq('status', 'active');
      setMandates(data || []);
      if (preselectedMandate) setForm(prev => ({ ...prev, mandate_id: preselectedMandate }));
    }
    loadMandates();
  }, [preselectedMandate]);

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const addCareerEntry = () => setForm(prev => ({ ...prev, career_history: [...prev.career_history, { title: '', company: '', period: '' }] }));

  const removeCareerEntry = (index: number) => setForm(prev => ({ ...prev, career_history: prev.career_history.filter((_, i) => i !== index) }));

  const updateCareerEntry = (index: number, field: string, value: string) => {
    setForm(prev => ({ ...prev, career_history: prev.career_history.map((entry, i) => i === index ? { ...entry, [field]: value } : entry) }));
  };

  // FULL PIPELINE — Score + Email + InMail in 1 click
  const handleProcessCandidate = async () => {
    if (!form.mandate_id || !form.name || !form.current_title) {
      alert('Please fill in at least the mandate, name, and current title.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/process-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: form.mandate_id,
          to_email: form.candidate_email || null,
          candidate: {
            name: form.name,
            current_title: form.current_title,
            current_company: form.current_company,
            location: form.location,
            experience_years: parseInt(form.experience_years) || 0,
            education: form.education,
            languages: form.languages.split(',').map(l => l.trim()),
            salary_expectations: form.salary_expectations,
            availability: form.availability,
            notes: form.notes,
            career_history: form.career_history.filter(e => e.title),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep('results');
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Server connection error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const candidate = result.candidate as Record<string, unknown>;
      await fetch('/api/approve-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidate.id, action: 'approve', approved_by: 'Admin' }),
      });
      router.push('/admin');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkedIn(true);
    setTimeout(() => setCopiedLinkedIn(false), 2000);
  };

  const scoring = result?.scoring as Record<string, unknown> | undefined;
  const outreach = result?.outreach as Record<string, unknown> | undefined;

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-600 transition-all mb-6">
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          {step === 'form' ? 'New candidate' : 'Pipeline results'}
        </h1>
        <p className="text-zinc-400 text-[13px] mt-0.5">
          {step === 'form' ? 'Enter candidate info — AI handles the rest' : 'Scoring, email, and LinkedIn message — all done automatically'}
        </p>
      </div>

      {step === 'form' ? (
        <div className="space-y-4">
          {/* Mandate */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <p className="label mb-3">Mandate</p>
            <select value={form.mandate_id} onChange={(e) => updateField('mandate_id', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] text-zinc-900 bg-white focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none">
              <option value="">Select a mandate...</option>
              {mandates.map(m => <option key={m.id} value={m.id}>{m.title} — {m.location}</option>)}
            </select>
          </div>

          {/* Candidate info */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <p className="label mb-4">Candidate information</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full name *", field: "name", placeholder: "James Richardson" },
                { label: "Location", field: "location", placeholder: "Toronto, ON" },
                { label: "Current title *", field: "current_title", placeholder: "Senior Estimator" },
                { label: "Current company", field: "current_company", placeholder: "EllisDon" },
                { label: "Years of experience", field: "experience_years", placeholder: "9", type: "number" },
                { label: "Education", field: "education", placeholder: "B.Eng Civil — University of Toronto" },
                { label: "Languages", field: "languages", placeholder: "English, French" },
                { label: "Salary expectations", field: "salary_expectations", placeholder: "$110,000 - $125,000" },
                { label: "Availability", field: "availability", placeholder: "Available in 3-4 weeks" },
                { label: "Candidate email", field: "candidate_email", placeholder: "james@email.com" },
              ].map((input) => (
                <div key={input.field}>
                  <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">{input.label}</label>
                  <input
                    type={input.type || "text"}
                    value={form[input.field as keyof typeof form] as string}
                    onChange={(e) => updateField(input.field, e.target.value)}
                    placeholder={input.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Career history */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="label">Career history</p>
              <button onClick={addCareerEntry} className="flex items-center gap-1 text-[11px] text-[#6C2BD9] font-medium hover:text-[#5521B5]">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.career_history.map((entry, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input type="text" value={entry.title} onChange={(e) => updateCareerEntry(i, 'title', e.target.value)}
                      placeholder="Title" className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] outline-none placeholder:text-zinc-300" />
                    <input type="text" value={entry.company} onChange={(e) => updateCareerEntry(i, 'company', e.target.value)}
                      placeholder="Company" className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] outline-none placeholder:text-zinc-300" />
                    <input type="text" value={entry.period} onChange={(e) => updateCareerEntry(i, 'period', e.target.value)}
                      placeholder="2020 - Present" className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] outline-none placeholder:text-zinc-300" />
                  </div>
                  {form.career_history.length > 1 && (
                    <button onClick={() => removeCareerEntry(i)} className="mt-2 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <p className="label mb-3">Qualification notes (optional)</p>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes from the qualification call, impressions, additional details..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] resize-none h-20 focus:border-[#6C2BD9] outline-none placeholder:text-zinc-300" />
          </div>

          {/* Email notice */}
          {form.candidate_email && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
              <Mail size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-blue-700">An outreach email will be sent automatically to <strong>{form.candidate_email}</strong> when you process this candidate.</p>
            </div>
          )}

          {!form.candidate_email && (
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex items-start gap-3">
              <AlertCircle size={15} className="text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-zinc-700">No email provided. The candidate will be scored and a LinkedIn message will be generated, but no email will be sent automatically.</p>
            </div>
          )}

          {/* Process button */}
          <button onClick={handleProcessCandidate} disabled={loading}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 btn-press">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing with AI...</>
            ) : (
              <><Sparkles size={16} /> Process candidate — Score + Email + LinkedIn</>
            )}
          </button>
        </div>
      ) : (
        /* RESULTS */
        <div className="space-y-4">
          {/* Score */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={15} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">AI Scoring Result</h2>
              <span className="ml-auto text-[32px] font-bold text-zinc-900">{scoring?.score as number}<span className="text-[14px] text-zinc-300 font-normal">/10</span></span>
            </div>
            <div className="space-y-2 mb-5">
              {(scoring?.score_details as Array<{criteria: string; score: number}>)?.map((d) => (
                <div key={d.criteria} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 w-[150px] shrink-0">{d.criteria}</span>
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full"><div className="h-full rounded-full bg-[#6C2BD9]" style={{ width: `${d.score * 10}%` }} /></div>
                  <span className="text-[11px] font-semibold text-zinc-700 w-5 text-right">{d.score}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                <p className="label text-emerald-700 mb-2">Strengths</p>
                {(scoring?.strengths as string[])?.map((s, i) => (
                  <p key={i} className="text-[11px] text-zinc-600 mb-1">• {s}</p>
                ))}
              </div>
              <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                <p className="label text-zinc-600 mb-2">Concerns</p>
                {(scoring?.concerns as string[])?.map((c, i) => (
                  <p key={i} className="text-[11px] text-zinc-600 mb-1">• {c}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Email sent */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={15} className="text-zinc-400" />
              <h2 className="text-[13px] font-semibold text-zinc-900">Email outreach</h2>
              {outreach?.email_sent ? (
                <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold">
                  <CheckCircle2 size={11} /> Sent automatically
                </span>
              ) : (
                <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-semibold">
                  <AlertCircle size={11} /> No email provided
                </span>
              )}
            </div>
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
              <p className="text-[11px] text-zinc-500 mb-1">Subject: <strong className="text-zinc-700">{outreach?.email_subject as string}</strong></p>
              <p className="text-[12px] text-zinc-600 leading-relaxed mt-2">{outreach?.email_body as string}</p>
            </div>
            {Boolean(outreach?.email_sent) && (
              <p className="text-[10px] text-zinc-400 mt-2">Auto follow-up in 3 days if no reply. Final follow-up at day 7.</p>
            )}
          </div>

          {/* LinkedIn InMail */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Link2 size={15} className="text-[#0A66C2]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">LinkedIn InMail</h2>
              <span className="ml-auto label text-zinc-400">Copy & paste to LinkedIn</span>
            </div>
            <div className="bg-[#0A66C2]/5 rounded-lg p-4 border border-[#0A66C2]/10">
              <p className="text-[13px] text-zinc-700 leading-relaxed">{outreach?.linkedin_message as string}</p>
            </div>
            <button onClick={() => copyToClipboard(outreach?.linkedin_message as string)}
              className="mt-3 w-full py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg text-[12px] font-medium flex items-center justify-center gap-2 btn-press">
              {copiedLinkedIn ? <><CheckCircle2 size={13} /> Copied!</> : <><Copy size={13} /> Copy LinkedIn message</>}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleApprove} disabled={loading}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 btn-press disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Approve & deliver to client
            </button>
            <button onClick={() => router.push('/admin')}
              className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[13px] font-medium btn-press">
              Keep as draft
            </button>
            <button onClick={() => { setStep('form'); setResult(null); }}
              className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[13px] font-medium btn-press">
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
