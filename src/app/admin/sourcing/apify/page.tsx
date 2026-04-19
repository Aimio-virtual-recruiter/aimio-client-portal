"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Mail,
  Link2,
  MapPin,
  Building2,
  Sparkles,
  Code,
  AlertCircle,
  Phone,
  Database,
} from "lucide-react";

interface ApifyCandidate {
  source: "apify";
  source_actor: string;
  external_id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string;
  headline: string;
  raw: Record<string, unknown>;
}

interface ActorOption {
  id: string;
  name: string;
  description: string;
  example_input: Record<string, unknown>;
}

export default function ApifySourcingPage() {
  const [actors, setActors] = useState<ActorOption[]>([]);
  const [selectedActor, setSelectedActor] = useState<ActorOption | null>(null);
  const [inputJson, setInputJson] = useState<string>("{}");
  const [timeoutSec, setTimeoutSec] = useState<number>(120);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApifyCandidate[]>([]);
  const [rawCount, setRawCount] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState<string | null>(null);

  // Load recommended actors
  useEffect(() => {
    async function loadActors() {
      const res = await fetch("/api/sourcing/apify");
      const data = await res.json();
      setActors(data.recommended_actors ?? []);
      if (data.recommended_actors?.length) {
        setSelectedActor(data.recommended_actors[0]);
        setInputJson(
          JSON.stringify(data.recommended_actors[0].example_input, null, 2)
        );
      }
    }
    loadActors();
  }, []);

  const handleSelectActor = (actor: ActorOption) => {
    setSelectedActor(actor);
    setInputJson(JSON.stringify(actor.example_input, null, 2));
    setCandidates([]);
    setError(null);
  };

  const handleRun = async () => {
    if (!selectedActor) return;
    setLoading(true);
    setError(null);
    setCandidates([]);

    try {
      let parsedInput: Record<string, unknown>;
      try {
        parsedInput = JSON.parse(inputJson);
      } catch {
        throw new Error("Input JSON invalide. Vérifie la syntaxe.");
      }

      const res = await fetch("/api/sourcing/apify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: selectedActor.id,
          input: parsedInput,
          timeout: timeoutSec,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur Apify");

      setCandidates(data.candidates ?? []);
      setRawCount(data.raw_count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setLoading(false);
  };

  const getProcessUrl = (c: ApifyCandidate) => {
    const params = new URLSearchParams();
    params.set("name", c.name);
    if (c.title) params.set("title", c.title);
    if (c.company) params.set("company", c.company);
    if (c.location) params.set("location", c.location);
    if (c.email) params.set("email", c.email);
    if (c.linkedin_url) params.set("linkedin", c.linkedin_url);
    return `/admin/candidates/new?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Sourcing Apify — Multi-sources
          </h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">
            LinkedIn · Sales Navigator · Crunchbase · Indeed · et plus
          </p>
        </div>
        <Link
          href="/admin/sourcing"
          className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-premium"
        >
          ← Retour à Apollo
        </Link>
      </div>

      {/* Actor selection */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Database size={14} className="text-[#6C2BD9]" />
          <h2 className="text-[13px] font-semibold text-zinc-900">
            Choisir un actor (source de données)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {actors.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectActor(a)}
              className={`text-left p-3 rounded-lg border transition-premium ${
                selectedActor?.id === a.id
                  ? "bg-[#6C2BD9]/5 border-[#6C2BD9] ring-1 ring-[#6C2BD9]"
                  : "bg-white border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <p className="text-[12px] font-semibold text-zinc-900 mb-1">
                {a.name}
              </p>
              <p className="text-[10px] text-zinc-500 leading-snug">
                {a.description}
              </p>
              <p className="text-[9px] text-zinc-400 mt-2 font-mono truncate">
                {a.id}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input config */}
      {selectedActor && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Code size={14} className="text-zinc-500" />
            <h2 className="text-[13px] font-semibold text-zinc-900">
              Configuration de l&apos;actor
            </h2>
          </div>

          <div className="mb-4">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Actor ID
            </label>
            <input
              type="text"
              value={selectedActor.id}
              onChange={(e) =>
                setSelectedActor({ ...selectedActor, id: e.target.value })
              }
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-[#6C2BD9]"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Format : username/actor-name OU username~actor-name
            </p>
          </div>

          <div className="mb-4">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Input JSON (paramètres pour l&apos;actor)
            </label>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-[#6C2BD9] bg-zinc-50"
              spellCheck={false}
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Voir documentation de l&apos;actor sur apify.com pour les paramètres disponibles.
            </p>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Timeout (sec)
            </label>
            <input
              type="number"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(parseInt(e.target.value) || 120)}
              min={30}
              max={300}
              className="w-24 px-2 py-1.5 border border-zinc-200 rounded-md text-[12px] focus:outline-none focus:border-[#6C2BD9]"
            />
            <p className="text-[10px] text-zinc-400">
              Max 300 sec. Si le scraping est long, augmente.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full py-3 bg-[#6C2BD9] hover:bg-[#5521B5] disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold transition-premium btn-press flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Apify scrape en cours... (peut prendre 1-3 min)
              </>
            ) : (
              <>
                <Search size={15} /> Lancer le scraping Apify
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-800">Erreur</p>
            <p className="text-[12px] text-red-600 break-all">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-[13px] font-semibold text-zinc-900">
              {candidates.length} candidats récupérés
            </h2>
            <p className="text-[11px] text-zinc-400">
              Source : {selectedActor?.name} · {rawCount} items bruts
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {candidates.map((c, idx) => (
              <div
                key={c.external_id || idx}
                className="px-5 py-4 hover:bg-zinc-50 transition-premium"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-zinc-600">
                      {(c.name || "?")
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
                        <p className="text-[14px] font-semibold text-zinc-900 truncate">
                          {c.name || "(sans nom)"}
                        </p>
                        <p className="text-[12px] text-zinc-500 truncate">
                          {c.title}
                          {c.company && ` · ${c.company}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 flex-wrap">
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
                          {c.email && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Mail size={10} />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Phone size={10} />
                              {c.phone}
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
                        <button
                          onClick={() =>
                            setShowRawJson(
                              showRawJson === c.external_id ? null : c.external_id
                            )
                          }
                          className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-100 text-zinc-500"
                          title="Voir données brutes"
                        >
                          <Code size={14} />
                        </button>
                        <Link
                          href={getProcessUrl(c)}
                          className="px-3 py-2 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-premium btn-press"
                        >
                          <Sparkles size={13} />
                          Traiter avec Claude
                        </Link>
                      </div>
                    </div>

                    {showRawJson === c.external_id && (
                      <div className="mt-3 p-3 bg-zinc-900 text-zinc-300 rounded-lg overflow-auto max-h-80">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap">
                          {JSON.stringify(c.raw, null, 2)}
                        </pre>
                      </div>
                    )}
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
          <Database size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-zinc-600 mb-1">
            Lancez votre premier scraping Apify
          </p>
          <p className="text-[12px] text-zinc-400 max-w-md mx-auto">
            Choisissez un actor ci-dessus, ajustez les paramètres JSON, puis cliquez sur Lancer.
            Les résultats apparaîtront ici prêts à être traités par Claude.
          </p>
        </div>
      )}

      {/* Help section */}
      <div className="mt-6 bg-zinc-50 rounded-xl p-5 border border-zinc-200">
        <h3 className="text-[12px] font-semibold text-zinc-900 mb-2">
          💡 Comment trouver le bon actor?
        </h3>
        <ul className="text-[11px] text-zinc-600 space-y-1.5">
          <li>
            ▸ Visite{" "}
            <a
              href="https://apify.com/store"
              target="_blank"
              rel="noreferrer"
              className="text-[#6C2BD9] hover:underline"
            >
              apify.com/store
            </a>{" "}
            pour explorer les 1000+ actors disponibles
          </li>
          <li>
            ▸ Cherche par mot-clé : &quot;LinkedIn&quot;, &quot;Sales Navigator&quot;, &quot;Indeed&quot;, &quot;Crunchbase&quot;
          </li>
          <li>
            ▸ Copie l&apos;ID de l&apos;actor (ex: <code className="text-[10px] bg-white px-1 rounded">apimaestro/linkedin-search-people</code>) et colle-le dans Actor ID
          </li>
          <li>
            ▸ Lis la documentation de l&apos;actor pour comprendre les paramètres d&apos;input JSON
          </li>
          <li>
            ▸ Coût : pay-per-use, généralement $0.01-0.10 par profil scraped
          </li>
        </ul>
      </div>
    </div>
  );
}
