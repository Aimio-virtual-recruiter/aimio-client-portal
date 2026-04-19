"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Mandate } from "@/lib/supabase";
import {
  Search,
  Loader2,
  Mail,
  Link2,
  MapPin,
  Building2,
  Sparkles,
  Filter,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface ApolloCandidate {
  apollo_id: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string | null;
  email_status: string;
  linkedin_url: string | null;
  company: string;
  industry: string;
  company_size: number | null;
  location: string;
  headline: string;
  seniority: string;
  employment_history: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string | null;
    current: boolean;
  }>;
}

const SENIORITY_OPTIONS = [
  { value: "entry", label: "Entry" },
  { value: "junior", label: "Junior" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c_suite", label: "C-Level" },
  { value: "owner", label: "Founder / Owner" },
];

const SIZE_OPTIONS = [
  { value: "1,10", label: "1-10" },
  { value: "11,50", label: "11-50" },
  { value: "51,200", label: "51-200" },
  { value: "201,500", label: "201-500" },
  { value: "501,1000", label: "501-1000" },
  { value: "1001,5000", label: "1001-5000" },
  { value: "5001,10000", label: "5001-10000" },
  { value: "10001", label: "10000+" },
];

export default function SourcingPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);

  // Search criteria
  const [titles, setTitles] = useState<string[]>([]);
  const [titleInput, setTitleInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [keywords, setKeywords] = useState("");
  const [seniorities, setSeniorities] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApolloCandidate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("mandates")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setMandates(data ?? []);
    }
    load();
  }, []);

  // Auto-populate search criteria when a mandate is selected
  const handleSelectMandate = (mandate: Mandate | null) => {
    setSelectedMandate(mandate);
    if (mandate) {
      setTitles([mandate.title]);
      if (mandate.location) setLocations([mandate.location]);
    }
  };

  const addTitle = () => {
    if (titleInput.trim()) {
      setTitles([...titles, titleInput.trim()]);
      setTitleInput("");
    }
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeTitle = (i: number) => setTitles(titles.filter((_, idx) => idx !== i));
  const removeLocation = (i: number) => setLocations(locations.filter((_, idx) => idx !== i));

  const toggleSeniority = (v: string) =>
    setSeniorities((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  const toggleSize = (v: string) =>
    setSizes((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));

  const handleSearch = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sourcing/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_titles: titles,
          person_locations: locations,
          person_seniorities: seniorities,
          organization_num_employees_ranges: sizes,
          contact_email_status: verifiedOnly ? ["verified"] : ["verified", "likely_to_engage"],
          keywords,
          per_page: 25,
          page: pageNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      setCandidates(data.candidates ?? []);
      setPage(data.pagination?.page ?? 1);
      setTotalPages(data.pagination?.total_pages ?? 0);
      setTotalEntries(data.pagination?.total_entries ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCandidates([]);
    }
    setLoading(false);
  };

  const getProcessUrl = (c: ApolloCandidate) => {
    const params = new URLSearchParams();
    if (selectedMandate) params.set("mandate", selectedMandate.id);
    params.set("name", c.name);
    params.set("title", c.title);
    params.set("company", c.company);
    params.set("location", c.location);
    if (c.email) params.set("email", c.email);
    if (c.linkedin_url) params.set("linkedin", c.linkedin_url);
    return `/admin/candidates/new?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Sourcing IA — Apollo
          </h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">
            Trouvez des candidats qualifiés en quelques secondes
          </p>
        </div>
      </div>

      {/* Mandate selector */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Mandat (optionnel — préremplit les critères)
        </label>
        <select
          value={selectedMandate?.id ?? ""}
          onChange={(e) => {
            const m = mandates.find((x) => x.id === e.target.value);
            handleSelectMandate(m ?? null);
          }}
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#6C2BD9]"
        >
          <option value="">— Recherche libre (sans mandat) —</option>
          {mandates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} · {m.location ?? "no location"}
            </option>
          ))}
        </select>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-zinc-400" />
          <h2 className="text-[13px] font-semibold text-zinc-900">Critères de recherche</h2>
        </div>

        {/* Titles */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Titres de poste
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTitle())}
              placeholder="ex: Senior Backend Engineer"
              className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
            <button
              onClick={addTitle}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition-premium btn-press flex items-center gap-1"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {titles.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6C2BD9]/10 text-[#6C2BD9] rounded-md text-[12px] font-medium"
              >
                {t}
                <button onClick={() => removeTitle(i)} className="hover:text-[#4c1e9b]">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Localisations (pays, état, ville)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
              placeholder="ex: United States, California, Toronto"
              className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
            <button
              onClick={addLocation}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition-premium btn-press flex items-center gap-1"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((l, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-[12px] font-medium"
              >
                <MapPin size={11} />
                {l}
                <button onClick={() => removeLocation(i)} className="hover:text-zinc-900">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Seniority */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Séniorité
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SENIORITY_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => toggleSeniority(s.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-premium ${
                  seniorities.includes(s.value)
                    ? "bg-[#6C2BD9] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company size */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Taille d&apos;entreprise
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => toggleSize(s.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-premium ${
                  sizes.includes(s.value)
                    ? "bg-[#6C2BD9] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Mots-clés (skills, technologies, diplômes, etc.)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="ex: Python AWS PostgreSQL"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
          />
        </div>

        {/* Verified only */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="verified"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-[#6C2BD9]"
          />
          <label htmlFor="verified" className="text-[13px] text-zinc-700">
            Uniquement emails vérifiés (recommandé)
          </label>
        </div>

        <button
          onClick={() => handleSearch(1)}
          disabled={loading}
          className="w-full py-3 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold transition-premium btn-press flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Recherche en cours...
            </>
          ) : (
            <>
              <Search size={15} /> Lancer la recherche Apollo
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-800">Erreur</p>
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-zinc-900">
                {totalEntries.toLocaleString()} candidats trouvés
              </h2>
              <p className="text-[11px] text-zinc-400">
                Page {page} sur {totalPages} — {candidates.length} affichés
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSearch(page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => handleSearch(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {candidates.map((c) => (
              <div
                key={c.apollo_id}
                className="px-5 py-4 flex items-start gap-4 hover:bg-zinc-50 transition-premium"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-zinc-600">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-zinc-900 truncate">{c.name}</p>
                      <p className="text-[12px] text-zinc-500 truncate">
                        {c.title} {c.company && ` · ${c.company}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                        {c.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {c.location}
                          </span>
                        )}
                        {c.industry && (
                          <span className="flex items-center gap-1">
                            <Building2 size={10} />
                            {c.industry}
                          </span>
                        )}
                        {c.email_status === "verified" && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Mail size={10} />
                            Email vérifié
                          </span>
                        )}
                        {c.email_status === "likely_to_engage" && (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Mail size={10} />
                            Email probable
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.linkedin_url && (
                        <a
                          href={c.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-[#0A66C2]"
                        >
                          <Link2 size={14} />
                        </a>
                      )}
                      <Link
                        href={getProcessUrl(c)}
                        className="px-3 py-2 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-premium btn-press"
                      >
                        <Sparkles size={13} />
                        Traiter avec Claude
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && candidates.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-zinc-200 border-dashed p-12 text-center">
          <Search size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-zinc-600 mb-1">Lancez une recherche</p>
          <p className="text-[12px] text-zinc-400">
            Choisissez un mandat ou définissez vos critères, puis cliquez sur Rechercher.
          </p>
        </div>
      )}
    </div>
  );
}
