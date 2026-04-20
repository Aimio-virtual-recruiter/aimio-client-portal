"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Flame,
  Thermometer,
  Snowflake,
  Mail,
  Phone,
} from "lucide-react";

interface ImportStats {
  total_parsed: number;
  total_valid: number;
  total_inserted: number;
  hot: number;
  warm: number;
  cold: number;
  with_email: number;
  with_phone: number;
  errors: string[];
}

export default function ImportReactivationPage() {
  const [csvContent, setCsvContent] = useState("");
  const [defaultOwner, setDefaultOwner] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; stats?: ImportStats; error?: string } | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      // Show preview — first 5 lines
      const lines = text.split(/\r?\n/).slice(0, 6);
      setPreview(lines.map((l) => l.split(",")));
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/reactivation/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent, default_owner: defaultOwner || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({ success: true, stats: data.stats });
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : "Erreur" });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/reactivation"
        className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft size={14} /> Retour à Réactivation
      </Link>

      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
          Import CSV — Réactivation 500+
        </h1>
        <p className="text-[13px] text-zinc-500 mt-2">
          Upload ta liste de clients historiques. L&apos;outil va auto-segmenter en Hot/Warm/Cold selon la date du dernier mandat.
        </p>
      </div>

      {result?.success && result.stats ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
          <CheckCircle2 size={40} className="text-emerald-600 mb-4" />
          <h2 className="text-[18px] font-semibold text-zinc-900 mb-2">
            Import réussi!
          </h2>
          <p className="text-[13px] text-zinc-700 mb-6">
            {result.stats.total_inserted} entreprises ajoutées dans la campagne de réactivation.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={<Flame size={14} className="text-orange-500" />}
              label="Hot"
              value={result.stats.hot}
              tint="orange"
            />
            <StatCard
              icon={<Thermometer size={14} className="text-[#6C2BD9]" />}
              label="Warm"
              value={result.stats.warm}
              tint="purple"
            />
            <StatCard
              icon={<Snowflake size={14} className="text-blue-500" />}
              label="Cold"
              value={result.stats.cold}
              tint="blue"
            />
            <StatCard
              icon={<CheckCircle2 size={14} className="text-emerald-600" />}
              label="Total"
              value={result.stats.total_inserted}
              tint="emerald"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-100 flex items-center gap-2">
              <Mail size={13} className="text-zinc-500" />
              <div>
                <p className="text-[11px] text-zinc-500">Avec email</p>
                <p className="text-[15px] font-semibold text-zinc-900">
                  {result.stats.with_email} / {result.stats.total_inserted}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100 flex items-center gap-2">
              <Phone size={13} className="text-zinc-500" />
              <div>
                <p className="text-[11px] text-zinc-500">Avec téléphone</p>
                <p className="text-[15px] font-semibold text-zinc-900">
                  {result.stats.with_phone} / {result.stats.total_inserted}
                </p>
              </div>
            </div>
          </div>

          {result.stats.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] font-semibold text-amber-800 mb-1">
                ⚠ {result.stats.errors.length} erreur(s) lors de l&apos;import
              </p>
              <ul className="text-[11px] text-amber-700 space-y-0.5">
                {result.stats.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/reactivation"
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-[13px] font-medium hover:bg-zinc-800"
            >
              Voir la campagne →
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setCsvContent("");
                setPreview([]);
              }}
              className="px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-medium hover:bg-zinc-50"
            >
              Importer un autre CSV
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload zone */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-8 mb-4">
            <div className="flex items-center justify-center">
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-80"
              >
                <Upload size={32} className="text-zinc-300" strokeWidth={1.5} />
                <p className="text-[13px] font-medium text-zinc-700">
                  Cliquer pour uploader un CSV
                </p>
                <p className="text-[11px] text-zinc-400">
                  ou glisse-dépose ici
                </p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
            </div>
          </div>

          {csvContent && (
            <>
              {/* Preview */}
              <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-[#6C2BD9]" />
                  <p className="text-[13px] font-semibold text-zinc-900">
                    Aperçu (5 premières lignes)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full">
                    <thead>
                      <tr className="bg-zinc-50">
                        {preview[0]?.map((col, i) => (
                          <th key={i} className="text-left px-3 py-2 border-b border-zinc-200 font-semibold text-zinc-700">
                            {col.trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(1).map((row, i) => (
                        <tr key={i} className="border-b border-zinc-100">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-zinc-600 max-w-[200px] truncate">
                              {cell.trim()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Config */}
              <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Owner par défaut (optionnel)
                </label>
                <select
                  value={defaultOwner}
                  onChange={(e) => setDefaultOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
                >
                  <option value="">Auto-assigner selon segment (Hot→Oli, Warm/Cold→Steph)</option>
                  <option value="Oli">Tout à Oli</option>
                  <option value="Will">Tout à Will</option>
                  <option value="Steph">Tout à Steph</option>
                  <option value="Marc-Antoine">Tout à Marc-Antoine</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Si le CSV a une colonne <code className="bg-zinc-100 px-1 rounded">owner</code>, elle sera utilisée en priorité.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleImport}
                disabled={submitting}
                className="w-full py-3 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Import en cours...
                  </>
                ) : (
                  <>
                    <Upload size={15} /> Importer dans Supabase
                  </>
                )}
              </button>
            </>
          )}

          {result && !result.success && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{result.error}</p>
            </div>
          )}

          {/* Help */}
          <div className="mt-6 bg-zinc-50 rounded-xl p-5 border border-zinc-200">
            <p className="text-[12px] font-semibold text-zinc-900 mb-2">
              📋 Format CSV attendu
            </p>
            <p className="text-[11px] text-zinc-600 mb-3">
              Colonnes reconnues (au moins une requise : <strong>company_name</strong> ou <strong>nom_entreprise</strong>) :
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
              <div>• <code className="bg-white px-1 rounded">company_name</code> *</div>
              <div>• <code className="bg-white px-1 rounded">contact_name</code></div>
              <div>• <code className="bg-white px-1 rounded">contact_email</code></div>
              <div>• <code className="bg-white px-1 rounded">contact_phone</code></div>
              <div>• <code className="bg-white px-1 rounded">last_mandate_date</code></div>
              <div>• <code className="bg-white px-1 rounded">last_mandate_role</code></div>
              <div>• <code className="bg-white px-1 rounded">last_mandate_value</code></div>
              <div>• <code className="bg-white px-1 rounded">owner</code></div>
              <div>• <code className="bg-white px-1 rounded">segment</code> (hot/warm/cold)</div>
              <div>• <code className="bg-white px-1 rounded">notes</code></div>
            </div>
            <p className="text-[10px] text-zinc-400 mt-3">
              Segmentation automatique basée sur last_mandate_date : &lt;12 mois = Hot, 12-36 mois = Warm, &gt;36 mois = Cold
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: "orange" | "purple" | "blue" | "emerald";
}) {
  const bgMap = {
    orange: "bg-orange-50 border-orange-200",
    purple: "bg-[#6C2BD9]/5 border-[#6C2BD9]/20",
    blue: "bg-blue-50 border-blue-200",
    emerald: "bg-emerald-50 border-emerald-200",
  };
  return (
    <div className={`rounded-lg p-3 border ${bgMap[tint]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">
          {label}
        </p>
      </div>
      <p className="text-[20px] font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}
