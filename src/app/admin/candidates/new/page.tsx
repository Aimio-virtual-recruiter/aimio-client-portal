"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, type Mandate } from "@/lib/supabase";
import { Sparkles, Loader2, ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function NewCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMandate = searchParams.get('mandate');

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [scored, setScored] = useState(false);
  const [scoringResult, setScoringResult] = useState<Record<string, unknown> | null>(null);

  const [form, setForm] = useState({
    mandate_id: preselectedMandate || '',
    name: '',
    current_title: '',
    current_company: '',
    location: '',
    experience_years: '',
    education: '',
    languages: ['Français', 'Anglais'],
    salary_expectations: '',
    availability: '',
    notes: '',
    career_history: [
      { title: '', company: '', period: '' }
    ],
  });

  useEffect(() => {
    async function loadMandates() {
      const { data } = await supabase.from('mandates').select('*').eq('status', 'active');
      setMandates(data || []);
      if (preselectedMandate && data) {
        setForm(prev => ({ ...prev, mandate_id: preselectedMandate }));
      }
    }
    loadMandates();
  }, [preselectedMandate]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addCareerEntry = () => {
    setForm(prev => ({
      ...prev,
      career_history: [...prev.career_history, { title: '', company: '', period: '' }]
    }));
  };

  const removeCareerEntry = (index: number) => {
    setForm(prev => ({
      ...prev,
      career_history: prev.career_history.filter((_, i) => i !== index)
    }));
  };

  const updateCareerEntry = (index: number, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      career_history: prev.career_history.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const handleScore = async () => {
    if (!form.mandate_id || !form.name || !form.current_title) {
      alert('Veuillez remplir au minimum le mandat, le nom et le poste actuel.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/score-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: form.mandate_id,
          candidate: {
            name: form.name,
            current_title: form.current_title,
            current_company: form.current_company,
            location: form.location,
            experience_years: parseInt(form.experience_years) || 0,
            education: form.education,
            languages: form.languages,
            salary_expectations: form.salary_expectations,
            availability: form.availability,
            notes: form.notes,
            career_history: form.career_history.filter(e => e.title),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScoringResult(data.scoring);
        setScored(true);
      } else {
        alert('Erreur: ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndDeliver = async () => {
    if (!scoringResult) return;
    setLoading(true);

    try {
      // Find the candidate that was just created
      const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .eq('name', form.name)
        .eq('internal_status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (candidates && candidates[0]) {
        await fetch('/api/approve-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id: candidates[0].id,
            action: 'approve',
            approved_by: 'Admin',
          }),
        });
      }

      router.push('/admin');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-600 transition-premium mb-6">
        <ArrowLeft size={13} />
        Retour
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Nouveau candidat</h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">Entrez les informations et laissez l IA scorer automatiquement</p>
        </div>
      </div>

      {!scored ? (
        <div className="space-y-6">
          {/* Mandate Selection */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mb-3">Mandat</p>
            <select
              value={form.mandate_id}
              onChange={(e) => updateField('mandate_id', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] text-zinc-900 focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium bg-white"
            >
              <option value="">Selectionnez un mandat...</option>
              {mandates.map(m => (
                <option key={m.id} value={m.id}>{m.title} — {m.location}</option>
              ))}
            </select>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mb-4">Informations du candidat</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Nom complet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Jean-Francois Tremblay"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Localisation</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Montreal, QC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Poste actuel *</label>
                <input
                  type="text"
                  value={form.current_title}
                  onChange={(e) => updateField('current_title', e.target.value)}
                  placeholder="Estimateur senior"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Entreprise actuelle</label>
                <input
                  type="text"
                  value={form.current_company}
                  onChange={(e) => updateField('current_company', e.target.value)}
                  placeholder="Construction ABC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Annees d experience</label>
                <input
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => updateField('experience_years', e.target.value)}
                  placeholder="8"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Formation</label>
                <input
                  type="text"
                  value={form.education}
                  onChange={(e) => updateField('education', e.target.value)}
                  placeholder="BAC Genie civil — ETS"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Attentes salariales</label>
                <input
                  type="text"
                  value={form.salary_expectations}
                  onChange={(e) => updateField('salary_expectations', e.target.value)}
                  placeholder="90,000$ - 100,000$"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Disponibilite</label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => updateField('availability', e.target.value)}
                  placeholder="Disponible dans 3-4 semaines"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Career History */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Parcours professionnel</p>
              <button onClick={addCareerEntry} className="flex items-center gap-1 text-[11px] text-[#6C2BD9] font-medium hover:text-[#5521B5] transition-premium">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {form.career_history.map((entry, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateCareerEntry(i, 'title', e.target.value)}
                      placeholder="Titre du poste"
                      className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] focus:ring-1 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                    />
                    <input
                      type="text"
                      value={entry.company}
                      onChange={(e) => updateCareerEntry(i, 'company', e.target.value)}
                      placeholder="Entreprise"
                      className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] focus:ring-1 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                    />
                    <input
                      type="text"
                      value={entry.period}
                      onChange={(e) => updateCareerEntry(i, 'period', e.target.value)}
                      placeholder="2020 - Present"
                      className="px-3 py-2 rounded-lg border border-zinc-200 text-[12px] focus:border-[#6C2BD9] focus:ring-1 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
                    />
                  </div>
                  {form.career_history.length > 1 && (
                    <button onClick={() => removeCareerEntry(i)} className="mt-2 text-zinc-300 hover:text-red-400 transition-premium">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mb-3">Notes du gestionnaire (optionnel)</p>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes de l appel de qualification, impressions, details supplementaires..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] resize-none h-24 focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium placeholder:text-zinc-300"
            />
          </div>

          {/* Score Button */}
          <button
            onClick={handleScore}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:from-[#5521B5] hover:to-[#7C3AED] text-white rounded-xl text-[14px] font-semibold transition-premium disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#6C2BD9]/20 btn-press"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Claude analyse le candidat...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Scorer avec l IA
              </>
            )}
          </button>
        </div>
      ) : (
        /* Scoring Results */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={15} className="text-[#6C2BD9]" />
              <h2 className="text-[13px] font-semibold text-zinc-900">Resultat du scoring IA</h2>
            </div>

            {/* Score principal */}
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-zinc-900 tabular-nums">{(scoringResult as Record<string, unknown>)?.score as number}</p>
                <p className="text-[11px] text-zinc-400 mt-1">/10</p>
              </div>
            </div>

            {/* Score details */}
            <div className="space-y-2 mb-6">
              {((scoringResult as Record<string, unknown>)?.score_details as Array<{criteria: string; score: number}>)?.map((detail: {criteria: string; score: number}) => (
                <div key={detail.criteria} className="flex items-center gap-4 py-1">
                  <span className="text-[12px] text-zinc-500 w-[160px] shrink-0">{detail.criteria}</span>
                  <div className="flex-1 h-[6px] bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#6C2BD9]" style={{ width: `${(detail.score / 10) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-zinc-700 w-7 text-right tabular-nums">{detail.score}</span>
                </div>
              ))}
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium mb-2">Points forts</p>
                <ul className="space-y-1.5">
                  {((scoringResult as Record<string, unknown>)?.strengths as string[])?.map((s: string, i: number) => (
                    <li key={i} className="text-[12px] text-zinc-600 flex gap-2">
                      <span className="text-emerald-400 shrink-0">—</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                <p className="text-[10px] text-amber-700 uppercase tracking-wider font-medium mb-2">Points d attention</p>
                <ul className="space-y-1.5">
                  {((scoringResult as Record<string, unknown>)?.concerns as string[])?.map((c: string, i: number) => (
                    <li key={i} className="text-[12px] text-zinc-600 flex gap-2">
                      <span className="text-amber-400 shrink-0">—</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-[#6C2BD9]/[0.03] rounded-lg p-4 border border-[#6C2BD9]/10">
              <p className="text-[10px] text-[#6C2BD9] uppercase tracking-wider font-medium mb-1.5">Recommandation IA</p>
              <p className="text-[13px] text-zinc-700">{(scoringResult as Record<string, unknown>)?.recommendation as string}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApproveAndDeliver}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-semibold transition-premium flex items-center justify-center gap-2 btn-press disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Approuver et livrer au client
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[13px] font-medium transition-premium btn-press"
            >
              Garder en draft
            </button>
            <button
              onClick={() => { setScored(false); setScoringResult(null); }}
              className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[13px] font-medium transition-premium btn-press"
            >
              Modifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
