"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Link2,
  MapPin,
  Building2,
  Sparkles,
  AlertCircle,
  Phone,
  TrendingUp,
  Briefcase,
  UserCheck,
} from "lucide-react";

interface Enriched {
  apollo_id: string;
  name: string;
  title: string;
  headline: string;
  seniority: string;
  photo_url: string | null;
  email: string | null;
  email_status: string;
  phone: string | null;
  linkedin_url: string | null;
  location: string;
  company: string;
  company_industry: string;
  company_website: string;
  company_size: number | null;
  company_phone: string | null;
  company_growth_12m: number | null;
  employment_history: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string | null;
    current: boolean;
  }>;
}

export default function EnrichPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Enriched | null>(null);

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = {};
      if (name) body.name = name;
      if (email) body.email = email;
      if (linkedinUrl) body.linkedin_url = linkedinUrl;
      if (organizationName) body.organization_name = organizationName;

      const res = await fetch("/api/sourcing/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrichissement échoué");

      setResult(data.enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setLoading(false);
  };

  const getProcessUrl = () => {
    if (!result) return "#";
    const params = new URLSearchParams();
    params.set("name", result.name);
    if (result.title) params.set("title", result.title);
    if (result.company) params.set("company", result.company);
    if (result.location) params.set("location", result.location);
    if (result.email) params.set("email", result.email);
    if (result.linkedin_url) params.set("linkedin", result.linkedin_url);
    return `/admin/candidates/new?${params.toString()}`;
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Enrichissement Apollo
          </h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">
            Récupère les coordonnées vérifiées d&apos;un candidat à partir de son nom + entreprise OU LinkedIn URL
          </p>
        </div>
        <Link
          href="/admin/sourcing/apify"
          className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-premium"
        >
          → Sourcing Apify
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
          💡 Tu as besoin d&apos;<strong>au moins un identifiant</strong> : nom complet (idéalement avec entreprise), courriel, ou URL LinkedIn. Plus tu donnes d&apos;infos, plus le match Apollo sera précis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Samuel Julien"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Entreprise
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="ex: Brasswater"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Courriel (si connu)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: samuel@example.com"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              URL LinkedIn (si connu)
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[13px] focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>
        </div>

        <button
          onClick={handleEnrich}
          disabled={loading || (!name && !email && !linkedinUrl)}
          className="w-full py-3 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold transition-premium btn-press flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Enrichissement en cours...
            </>
          ) : (
            <>
              <UserCheck size={15} /> Enrichir avec Apollo
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

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-5 mb-6">
              {result.photo_url ? (
                <img
                  src={result.photo_url}
                  alt={result.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-zinc-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
                  <span className="text-[16px] font-semibold text-zinc-600">
                    {result.name
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold text-zinc-900">{result.name}</h2>
                <p className="text-[13px] text-zinc-600 mt-0.5">{result.title}</p>
                {result.headline && result.headline !== result.title && (
                  <p className="text-[12px] text-zinc-500 mt-1 italic">{result.headline}</p>
                )}
              </div>

              <Link
                href={getProcessUrl()}
                className="px-4 py-2.5 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-premium btn-press shrink-0"
              >
                <Sparkles size={14} />
                Traiter avec Claude
              </Link>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {result.email && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <Mail size={14} className="text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-emerald-900 truncate">{result.email}</p>
                    <p className="text-[10px] text-emerald-600 capitalize">
                      Email {result.email_status}
                    </p>
                  </div>
                </div>
              )}
              {result.phone && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                  <Phone size={14} className="text-zinc-600" />
                  <p className="text-[12px] font-medium text-zinc-900">{result.phone}</p>
                </div>
              )}
              {result.linkedin_url && (
                <a
                  href={result.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-lg hover:bg-zinc-100"
                >
                  <Link2 size={14} className="text-[#0A66C2]" />
                  <p className="text-[12px] font-medium text-zinc-900 truncate">
                    Voir profil LinkedIn
                  </p>
                </a>
              )}
              {result.location && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                  <MapPin size={14} className="text-zinc-600" />
                  <p className="text-[12px] font-medium text-zinc-900">{result.location}</p>
                </div>
              )}
            </div>

            {/* Company info */}
            {result.company && (
              <div className="bg-zinc-50 rounded-lg p-4 mb-6 border border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={14} className="text-zinc-500" />
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Entreprise actuelle
                  </p>
                </div>
                <p className="text-[15px] font-bold text-zinc-900">{result.company}</p>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 flex-wrap">
                  {result.company_industry && (
                    <span>{result.company_industry}</span>
                  )}
                  {result.company_size && (
                    <span>{result.company_size} employés</span>
                  )}
                  {result.company_growth_12m !== null &&
                    result.company_growth_12m !== undefined && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp size={11} />
                        {(result.company_growth_12m * 100).toFixed(1)}% croissance 12m
                      </span>
                    )}
                  {result.company_phone && <span>{result.company_phone}</span>}
                  {result.company_website && (
                    <a
                      href={result.company_website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#6C2BD9] hover:underline"
                    >
                      {result.company_website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Employment history */}
            {result.employment_history.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={14} className="text-zinc-500" />
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Historique professionnel
                  </p>
                </div>
                <div className="space-y-2">
                  {result.employment_history.slice(0, 6).map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 border border-zinc-100 rounded-lg"
                    >
                      <div
                        className={`w-1 h-12 rounded-full ${
                          e.current ? "bg-[#6C2BD9]" : "bg-zinc-200"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-900 truncate">
                          {e.title || "(sans titre)"}
                        </p>
                        <p className="text-[12px] text-zinc-500 truncate">
                          {e.company}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {e.start_date}
                          {" → "}
                          {e.current ? "Présent" : e.end_date ?? "?"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
