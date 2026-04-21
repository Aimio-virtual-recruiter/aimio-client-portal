"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Link2,
  Building2,
} from "lucide-react";

interface ImportStats {
  total_parsed: number;
  total_valid: number;
  total_inserted: number;
  with_email: number;
  with_phone: number;
  with_linkedin: number;
  flagged_quebec: number;
  errors: string[];
}

export default function ImportProspectsPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [defaultOwner, setDefaultOwner] = useState("");
  const [defaultPriority, setDefaultPriority] = useState("medium");
  const [defaultIcpScore, setDefaultIcpScore] = useState("60");
  const [recruiters, setRecruiters] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; stats?: ImportStats; error?: string } | null>(null);

  useEffect(() => {
    async function loadRecruiters() {
      const { data } = await supabase.from("recruiters").select("id, name").eq("is_active", true);
      setRecruiters(data ?? []);
    }
    loadRecruiters();
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsv(text);
      const lines = text.split(/\r?\n/).slice(0, 6);
      setPreview(lines.map((l) => l.split(",")));
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          default_owner_id: defaultOwner || undefined,
          default_priority: defaultPriority,
          default_icp_score: parseInt(defaultIcpScore) || 60,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({ success: true, stats: data.stats });
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/prospects"
        className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft size={14} /> Retour aux prospects
      </Link>

      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
          Import CSV — Prospects
        </h1>
        <p className="text-[13px] text-zinc-500 mt-2">
          Upload des milliers de prospects en quelques secondes. Auto-détection Quebec, normalisation, dédup.
        </p>
      </div>

      {result?.success && result.stats ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
          <CheckCircle2 size={40} className="text-emerald-600 mb-4" />
          <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
            Import réussi!
          </h2>
          <p className="text-[13px] text-zinc-700 mb-6">
            {result.stats.total_inserted} prospects ajoutés à ta database outbound.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat icon={<Building2 size={14} />} label="Total" value={result.stats.total_inserted} />
            <Stat icon={<Mail size={14} />} label="Avec email" value={result.stats.with_email} />
            <Stat icon={<Phone size={14} />} label="Avec phone" value={result.stats.with_phone} />
            <Stat icon={<Link2 size={14} />} label="Avec LinkedIn" value={result.stats.with_linkedin} />
          </div>

          {result.stats.flagged_quebec > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] text-amber-800">
                ⚠ {result.stats.flagged_quebec} prospects flaggés Quebec (anti-cannibalization). Ils sont en DB mais exclus du queue par défaut.
              </p>
            </div>
          )}

          {result.stats.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] font-semibold text-red-800">{result.stats.errors.length} erreur(s)</p>
              <ul className="text-[11px] text-red-700 mt-1">
                {result.stats.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/prospects"
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-[13px] font-medium hover:bg-zinc-800"
            >
              Voir les prospects →
            </Link>
            <Link
              href="/admin/queue"
              className="px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
            >
              Démarrer le queue
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-8 mb-4">
            <div className="flex items-center justify-center">
              <label htmlFor="csv-upload" className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80">
                <Upload size={32} className="text-zinc-300" strokeWidth={1.5} />
                <p className="text-[13px] font-medium text-zinc-700">Click pour upload CSV</p>
                <p className="text-[11px] text-zinc-400">ou drag & drop</p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </label>
            </div>
          </div>

          {csv && (
            <>
              <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-[#6C2BD9]" />
                  <p className="text-[13px] font-semibold text-zinc-900">Preview</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full">
                    <thead>
                      <tr className="bg-zinc-50">
                        {preview[0]?.map((c, i) => (
                          <th key={i} className="text-left px-3 py-2 border-b font-semibold text-zinc-700">{c.trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(1).map((row, i) => (
                        <tr key={i} className="border-b border-zinc-100">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-zinc-600 max-w-[150px] truncate">{cell.trim()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
                <p className="text-[13px] font-semibold text-zinc-900 mb-3">Defaults pour cet import</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Owner</label>
                    <select
                      value={defaultOwner}
                      onChange={(e) => setDefaultOwner(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
                    >
                      <option value="">— Unassigned —</option>
                      {recruiters.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Priority</label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
                    >
                      <option value="high">🔥 High</option>
                      <option value="medium">⚪ Medium</option>
                      <option value="low">⬇ Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">ICP Score</label>
                    <input
                      type="number"
                      value={defaultIcpScore}
                      onChange={(e) => setDefaultIcpScore(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={submitting}
                className="w-full py-3 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Import...</> : <><Upload size={15} /> Importer dans Supabase</>}
              </button>
            </>
          )}

          {result && !result.success && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 mt-0.5" />
              <p className="text-[13px] text-red-700">{result.error}</p>
            </div>
          )}

          <div className="mt-6 bg-zinc-50 rounded-xl p-5 border border-zinc-200">
            <p className="text-[12px] font-semibold text-zinc-900 mb-2">📋 Format CSV reconnu</p>
            <p className="text-[11px] text-zinc-600 mb-3">
              Au minimum : <strong>company_name</strong>. Toutes les autres colonnes sont optionnelles.
            </p>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-600">
              <div>• <code>company_name</code> *</div>
              <div>• <code>first_name</code></div>
              <div>• <code>last_name</code></div>
              <div>• <code>title</code></div>
              <div>• <code>email</code></div>
              <div>• <code>phone</code></div>
              <div>• <code>linkedin_url</code></div>
              <div>• <code>company_industry</code></div>
              <div>• <code>company_size</code></div>
              <div>• <code>company_country</code></div>
              <div>• <code>company_state</code></div>
              <div>• <code>company_city</code></div>
              <div>• <code>priority</code> (high/medium/low)</div>
              <div>• <code>icp_score</code> (0-100)</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-emerald-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
      </div>
      <p className="text-[18px] font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}
