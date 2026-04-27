"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import {
  Loader2,
  Search,
  Upload,
  Plus,
  Mail,
  Phone,
  Link2,
  Building2,
  AlertCircle,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

interface Prospect {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company_name: string;
  company_industry: string | null;
  company_size: string | null;
  company_country: string | null;
  icp_score: number;
  priority: string;
  status: string;
  touch_count: number;
  source: string | null;
  is_quebec: boolean;
  created_at: string;
}

interface Recruiter {
  id: string;
  name: string;
}

const STATUSES = [
  { value: "new", label: "🆕 New", color: "zinc" },
  { value: "queued", label: "📋 Queued", color: "blue" },
  { value: "contacted", label: "📞 Contacted", color: "amber" },
  { value: "responded", label: "💬 Responded", color: "purple" },
  { value: "demo_booked", label: "🎯 Demo booked", color: "emerald" },
  { value: "customer", label: "💰 Customer", color: "emerald" },
  { value: "not_interested", label: "❌ Not interested", color: "red" },
  { value: "do_not_contact", label: "⛔ DNC", color: "red" },
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [bulkEnriching, setBulkEnriching] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const enrichProspect = async (prospectId: string) => {
    setEnrichingId(prospectId);
    try {
      const res = await fetch("/api/prospects/enrich-waterfall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        toast.warning(
          `Aucune donnée additionnelle trouvée. Sources tentées : ${data.attempts
            ?.map((a: { source: string }) => a.source)
            .join(", ")}`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
    setEnrichingId(null);
  };

  const bulkEnrich = async () => {
    if (!confirm("Enrichir jusqu'à 50 prospects sans email/phone via waterfall? Ça peut prendre 1-2 minutes.")) return;
    setBulkEnriching(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/prospects/enrich-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(
          `✅ ${data.processed} traités · ${data.emails_found} emails trouvés · ${data.phones_found} phones trouvés (${data.success_rate}% hit rate)`
        );
        await fetchData();
      } else {
        setBulkResult(`Erreur : ${data.error ?? "unknown"}`);
      }
    } catch (err) {
      setBulkResult(err instanceof Error ? err.message : "Erreur");
    }
    setBulkEnriching(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        supabase
          .from("prospects")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
        supabase.from("recruiters").select("id, name").eq("is_active", true),
      ]);
      if (pRes.error) throw pRes.error;
      setProspects(pRes.data ?? []);
      setRecruiters(rRes.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    let list = prospects;
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (filterPriority !== "all") list = list.filter((p) => p.priority === filterPriority);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(s) ||
          p.company_name.toLowerCase().includes(s) ||
          (p.email?.toLowerCase().includes(s) ?? false) ||
          (p.title?.toLowerCase().includes(s) ?? false)
      );
    }
    return list;
  }, [prospects, filterStatus, filterPriority, search]);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
            Prospects Database
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {prospects.length} prospects · base de données outbound
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={bulkEnrich}
            disabled={bulkEnriching}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#6C2BD9]/30 bg-[#6C2BD9]/5 hover:bg-[#6C2BD9]/10 text-[#6C2BD9] rounded-lg text-[12px] font-semibold disabled:opacity-50"
          >
            {bulkEnriching ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Zap size={13} />
            )}
            Bulk Enrich (50)
          </button>
          <Link
            href="/admin/prospects/import"
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] font-medium hover:bg-zinc-50"
          >
            <Upload size={13} />
            Import CSV
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-lg text-[12px] font-semibold"
          >
            <Plus size={13} />
            Add prospect
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email..."
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
          >
            <option value="all">All priorities</option>
            <option value="high">🔥 High</option>
            <option value="medium">⚪ Medium</option>
            <option value="low">⬇ Low</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 mt-0.5" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {bulkResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 mt-0.5" />
          <p className="text-[13px] text-emerald-800">{bulkResult}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin text-zinc-300 mx-auto" size={20} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={28} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-zinc-600 mb-1">
              {prospects.length === 0
                ? "Aucun prospect dans la base"
                : "Aucun résultat avec ces filtres"}
            </p>
            <p className="text-[12px] text-zinc-400 mb-4">
              {prospects.length === 0
                ? "Importe un CSV ou ajoute manuellement pour commencer."
                : "Ajuste tes filtres."}
            </p>
            {prospects.length === 0 && (
              <Link
                href="/admin/prospects/import"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6C2BD9] text-white rounded-lg text-[12px] font-semibold"
              >
                <Upload size={13} /> Import CSV
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-[12px]">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Prospect</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Touches</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((p) => {
                  const status = STATUSES.find((s) => s.value === p.status);
                  const needsEnrich = !p.email || !p.phone;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold ${
                            p.icp_score >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : p.icp_score >= 60
                              ? "bg-[#6C2BD9]/15 text-[#6C2BD9]"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {p.icp_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-zinc-900">{p.full_name}</p>
                            <p className="text-[11px] text-zinc-500">{p.title}</p>
                          </div>
                          {p.priority === "high" && (
                            <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">🔥</span>
                          )}
                          {p.is_quebec && (
                            <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">QC</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-900">{p.company_name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {[p.company_industry, p.company_size, p.company_country].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          {p.email && (
                            <span className="flex items-center gap-1 text-zinc-700">
                              <Mail size={10} /> {p.email}
                            </span>
                          )}
                          {p.phone && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Phone size={10} /> {p.phone}
                            </span>
                          )}
                          {p.linkedin_url && (
                            <a
                              href={p.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[#0A66C2] hover:underline"
                            >
                              <Link2 size={10} /> LinkedIn
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-1 rounded ${
                            status?.color === "emerald"
                              ? "bg-emerald-50 text-emerald-700"
                              : status?.color === "amber"
                              ? "bg-amber-50 text-amber-700"
                              : status?.color === "red"
                              ? "bg-red-50 text-red-700"
                              : status?.color === "blue"
                              ? "bg-blue-50 text-blue-700"
                              : status?.color === "purple"
                              ? "bg-[#6C2BD9]/10 text-[#6C2BD9]"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {status?.label ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{p.touch_count}</td>
                      <td className="px-4 py-3 text-[11px] text-zinc-400">{p.source ?? "manual"}</td>
                      <td className="px-4 py-3">
                        {needsEnrich ? (
                          <button
                            onClick={() => enrichProspect(p.id)}
                            disabled={enrichingId === p.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#6C2BD9]/10 hover:bg-[#6C2BD9]/20 text-[#6C2BD9] rounded text-[10px] font-semibold disabled:opacity-50"
                          >
                            {enrichingId === p.id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Sparkles size={10} />
                            )}
                            Enrich
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">
                Showing {filtered.length} of page {page + 1}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-[11px] hover:bg-zinc-50 disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={prospects.length < PAGE_SIZE}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-[11px] hover:bg-zinc-50 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddProspectModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchData();
          }}
          recruiters={recruiters}
        />
      )}
    </div>
  );
}

function AddProspectModal({
  onClose,
  onSaved,
  recruiters,
}: {
  onClose: () => void;
  onSaved: () => void;
  recruiters: Recruiter[];
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    company_name: "",
    company_industry: "",
    company_size: "",
    company_country: "United States",
    priority: "medium",
    icp_score: "60",
    owner_id: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.company_name || !form.first_name) {
      setError("Company name + first name required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const isQuebec =
        form.company_country.toLowerCase().includes("quebec") ||
        form.company_country.toLowerCase().includes("québec");

      const { error: err } = await supabase.from("prospects").insert({
        first_name: form.first_name,
        last_name: form.last_name || null,
        title: form.title || null,
        email: form.email || null,
        phone: form.phone || null,
        linkedin_url: form.linkedin_url || null,
        company_name: form.company_name,
        company_industry: form.company_industry || null,
        company_size: form.company_size || null,
        company_country: form.company_country || null,
        priority: form.priority,
        icp_score: parseInt(form.icp_score) || 60,
        owner_id: form.owner_id || null,
        notes: form.notes || null,
        is_quebec: isQuebec,
        source: "manual",
        status: "new",
      });
      if (err) throw err;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Add Prospect</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VP Talent"
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Company *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-0100"
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Industry</label>
              <input
                type="text"
                value={form.company_industry}
                onChange={(e) => setForm({ ...form, company_industry: e.target.value })}
                placeholder="SaaS"
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Size</label>
              <select
                value={form.company_size}
                onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
              >
                <option value="">—</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Country</label>
              <input
                type="text"
                value={form.company_country}
                onChange={(e) => setForm({ ...form, company_country: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
              >
                <option value="high">🔥 High</option>
                <option value="medium">⚪ Medium</option>
                <option value="low">⬇ Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">ICP Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.icp_score}
                onChange={(e) => setForm({ ...form, icp_score: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Owner</label>
              <select
                value={form.owner_id}
                onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] bg-white"
              >
                <option value="">— Unassigned —</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-[12px] resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-zinc-200 rounded-lg text-[12px]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Save Prospect
          </button>
        </div>
      </div>
    </div>
  );
}
