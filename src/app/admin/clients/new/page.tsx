"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Copy, AlertCircle } from "lucide-react";

interface FormData {
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  country: string;
  company_size: string;
  plan: "starter" | "pro" | "enterprise";
  roles_hiring_for: string;
  mrr_usd: number;
  billing_start_date: string;
  recruteur_lead: string;
  notes: string;
}

const PLANS = {
  starter: { name: "Starter", price: 1999, candidates: "8-12 qualifiés/mois" },
  pro: { name: "Pro", price: 2999, candidates: "15-25 qualifiés/mois" },
  enterprise: { name: "Enterprise", price: 4999, candidates: "30-40 qualifiés/mois" },
};

// ISO 3166 — full list (200+ countries) with flag emoji + French name
const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦" },
  { code: "AL", name: "Albanie", flag: "🇦🇱" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "AD", name: "Andorre", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua-et-Barbuda", flag: "🇦🇬" },
  { code: "SA", name: "Arabie saoudite", flag: "🇸🇦" },
  { code: "AR", name: "Argentine", flag: "🇦🇷" },
  { code: "AM", name: "Arménie", flag: "🇦🇲" },
  { code: "AU", name: "Australie", flag: "🇦🇺" },
  { code: "AT", name: "Autriche", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaïdjan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahreïn", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbade", flag: "🇧🇧" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "BT", name: "Bhoutan", flag: "🇧🇹" },
  { code: "BY", name: "Biélorussie", flag: "🇧🇾" },
  { code: "MM", name: "Birmanie (Myanmar)", flag: "🇲🇲" },
  { code: "BO", name: "Bolivie", flag: "🇧🇴" },
  { code: "BA", name: "Bosnie-Herzégovine", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brésil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodge", flag: "🇰🇭" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻" },
  { code: "CL", name: "Chili", flag: "🇨🇱" },
  { code: "CN", name: "Chine", flag: "🇨🇳" },
  { code: "CY", name: "Chypre", flag: "🇨🇾" },
  { code: "CO", name: "Colombie", flag: "🇨🇴" },
  { code: "KM", name: "Comores", flag: "🇰🇲" },
  { code: "CG", name: "Congo (Brazzaville)", flag: "🇨🇬" },
  { code: "CD", name: "Congo (Kinshasa)", flag: "🇨🇩" },
  { code: "KP", name: "Corée du Nord", flag: "🇰🇵" },
  { code: "KR", name: "Corée du Sud", flag: "🇰🇷" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "HR", name: "Croatie", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DK", name: "Danemark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominique", flag: "🇩🇲" },
  { code: "EG", name: "Égypte", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "AE", name: "Émirats arabes unis", flag: "🇦🇪" },
  { code: "EC", name: "Équateur", flag: "🇪🇨" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "EE", name: "Estonie", flag: "🇪🇪" },
  { code: "USA", name: "États-Unis", flag: "🇺🇸" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹" },
  { code: "FJ", name: "Fidji", flag: "🇫🇯" },
  { code: "FI", name: "Finlande", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambie", flag: "🇬🇲" },
  { code: "GE", name: "Géorgie", flag: "🇬🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Grèce", flag: "🇬🇷" },
  { code: "GD", name: "Grenade", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haïti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺" },
  { code: "IN", name: "Inde", flag: "🇮🇳" },
  { code: "ID", name: "Indonésie", flag: "🇮🇩" },
  { code: "IQ", name: "Irak", flag: "🇮🇶" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IE", name: "Irlande", flag: "🇮🇪" },
  { code: "IS", name: "Islande", flag: "🇮🇸" },
  { code: "IL", name: "Israël", flag: "🇮🇱" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "JM", name: "Jamaïque", flag: "🇯🇲" },
  { code: "JP", name: "Japon", flag: "🇯🇵" },
  { code: "JO", name: "Jordanie", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KG", name: "Kirghizistan", flag: "🇰🇬" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Koweït", flag: "🇰🇼" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻" },
  { code: "LB", name: "Liban", flag: "🇱🇧" },
  { code: "LR", name: "Libéria", flag: "🇱🇷" },
  { code: "LY", name: "Libye", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MO", name: "Macao", flag: "🇲🇴" },
  { code: "MK", name: "Macédoine du Nord", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MY", name: "Malaisie", flag: "🇲🇾" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malte", flag: "🇲🇹" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "MH", name: "Marshall (Îles)", flag: "🇲🇭" },
  { code: "MU", name: "Maurice", flag: "🇲🇺" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷" },
  { code: "MX", name: "Mexique", flag: "🇲🇽" },
  { code: "FM", name: "Micronésie", flag: "🇫🇲" },
  { code: "MD", name: "Moldavie", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolie", flag: "🇲🇳" },
  { code: "ME", name: "Monténégro", flag: "🇲🇪" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "NA", name: "Namibie", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Népal", flag: "🇳🇵" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigéria", flag: "🇳🇬" },
  { code: "NO", name: "Norvège", flag: "🇳🇴" },
  { code: "NZ", name: "Nouvelle-Zélande", flag: "🇳🇿" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬" },
  { code: "UZ", name: "Ouzbékistan", flag: "🇺🇿" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palaos", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "PE", name: "Pérou", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Pologne", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "CF", name: "République centrafricaine", flag: "🇨🇫" },
  { code: "DO", name: "République dominicaine", flag: "🇩🇴" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴" },
  { code: "UK", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "RU", name: "Russie", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint-Kitts-et-Nevis", flag: "🇰🇳" },
  { code: "SM", name: "Saint-Marin", flag: "🇸🇲" },
  { code: "VC", name: "Saint-Vincent-et-les-Grenadines", flag: "🇻🇨" },
  { code: "LC", name: "Sainte-Lucie", flag: "🇱🇨" },
  { code: "SB", name: "Salomon (Îles)", flag: "🇸🇧" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "ST", name: "Sao Tomé-et-Principe", flag: "🇸🇹" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "RS", name: "Serbie", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapour", flag: "🇸🇬" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮" },
  { code: "SO", name: "Somalie", flag: "🇸🇴" },
  { code: "SD", name: "Soudan", flag: "🇸🇩" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SE", name: "Suède", flag: "🇸🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SY", name: "Syrie", flag: "🇸🇾" },
  { code: "TJ", name: "Tadjikistan", flag: "🇹🇯" },
  { code: "TW", name: "Taïwan", flag: "🇹🇼" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿" },
  { code: "TD", name: "Tchad", flag: "🇹🇩" },
  { code: "TH", name: "Thaïlande", flag: "🇹🇭" },
  { code: "TL", name: "Timor oriental", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinité-et-Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "TM", name: "Turkménistan", flag: "🇹🇲" },
  { code: "TR", name: "Turquie", flag: "🇹🇷" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yémen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

export default function OnboardNewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    company_name: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_email: "",
    contact_phone: "",
    contact_role: "",
    country: "",
    company_size: "",
    plan: "pro",
    roles_hiring_for: "",
    mrr_usd: 2999,
    billing_start_date: new Date().toISOString().split("T")[0],
    recruteur_lead: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    client_id?: string;
    portal_url?: string;
    email_sent?: boolean;
    contact_email?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/clients/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard");
      setResult({
        success: true,
        message: data.message,
        client_id: data.client_id,
        portal_url: data.portal_url,
        email_sent: data.email_sent,
        contact_email: form.contact_email,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
    setSubmitting(false);
  };

  const updatePlan = (plan: "starter" | "pro" | "enterprise") => {
    setForm({ ...form, plan, mrr_usd: PLANS[plan].price });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (result?.success) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-zinc-900 mb-2">Client onboardé avec succès 🎉</h1>
                <p className="text-[14px] text-zinc-600">{result.message}</p>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-6 mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Compte créé</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Email du client</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white border border-zinc-200 rounded px-3 py-2 flex-1 text-[13px]">{result.contact_email}</code>
                    <button onClick={() => copyToClipboard(result.contact_email || "")} className="p-2 hover:bg-zinc-100 rounded" title="Copier">
                      <Copy size={14} className="text-zinc-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">URL portail</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white border border-zinc-200 rounded px-3 py-2 flex-1 text-[13px]">{result.portal_url}</code>
                    <button onClick={() => copyToClipboard(result.portal_url || "")} className="p-2 hover:bg-zinc-100 rounded" title="Copier">
                      <Copy size={14} className="text-zinc-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-[13px] font-bold text-blue-900 mb-2">📧 2 emails envoyés au client</p>
              <ul className="text-[13px] text-blue-800 space-y-1.5 list-disc list-inside">
                <li><strong>Invitation Supabase</strong> — le client clique le lien et choisit lui-même son mot de passe (sécurisé, conforme Loi 25)</li>
                <li><strong>{result.email_sent ? "Welcome Aimio envoyé ✅" : "Welcome Aimio en attente ⚠️ (RESEND_API_KEY manquante)"}</strong> — présentation + lien Calendly pour kickoff call</li>
              </ul>
              <p className="text-[12px] text-blue-700 mt-3 italic">
                Si le client ne reçoit pas l&apos;email Supabase dans 5 min, vérifie qu&apos;il regarde son spam ou utilise &laquo; Mot de passe oublié &raquo; sur la page de login.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/clients" className="flex-1 py-3 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold text-center hover:bg-zinc-800 transition">
                Voir tous les clients
              </Link>
              <button
                onClick={() => { setResult(null); setForm({ ...form, company_name: "", contact_first_name: "", contact_last_name: "", contact_email: "", contact_phone: "" }); }}
                className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-semibold hover:bg-zinc-50 transition"
              >
                Onboarder un autre client
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-900 mb-4">
            <ArrowLeft size={14} /> Retour admin
          </Link>
          <h1 className="text-[32px] font-bold text-zinc-900 tracking-tight">Onboarder un nouveau client RV</h1>
          <p className="text-[14px] text-zinc-500 mt-2">
            Crée le compte client, génère les credentials, envoie le welcome email automatiquement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Section 1 — Entreprise */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Entreprise cliente</h2>
            <p className="text-[12px] text-zinc-500 mb-6">Infos de base du client</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Nom entreprise *</label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Pays *</label>
                <select
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  <optgroup label="Marchés prioritaires">
                    <option value="USA">🇺🇸 États-Unis</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="UK">🇬🇧 Royaume-Uni</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Australia">🇦🇺 Australie</option>
                    <option value="Ireland">🇮🇪 Irlande</option>
                  </optgroup>
                  <optgroup label="Tous les pays">
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Taille entreprise</label>
                <select
                  value={form.company_size}
                  onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 — Contact principal */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Contact principal</h2>
            <p className="text-[12px] text-zinc-500 mb-6">Qui va utiliser le portail + recevoir les candidats</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Prénom *</label>
                <input
                  type="text"
                  required
                  value={form.contact_first_name}
                  onChange={(e) => setForm({ ...form, contact_first_name: e.target.value })}
                  placeholder="Jane"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.contact_last_name}
                  onChange={(e) => setForm({ ...form, contact_last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Email (= login portal) *</label>
                <input
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="jane@acme.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Téléphone</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="+1 555-123-4567"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Rôle / Titre</label>
                <input
                  type="text"
                  value={form.contact_role}
                  onChange={(e) => setForm({ ...form, contact_role: e.target.value })}
                  placeholder="Head of Talent / VP People"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3 — Plan */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Plan souscrit</h2>
            <p className="text-[12px] text-zinc-500 mb-6">Quel plan le client a signé</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updatePlan(key)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    form.plan === key ? "border-[#2445EB] bg-[#2445EB]/5" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <p className="text-[13px] font-bold text-zinc-900">{PLANS[key].name}</p>
                  <p className="text-[22px] font-bold text-[#2445EB] my-1">${PLANS[key].price}<span className="text-[12px] text-zinc-400">/mo</span></p>
                  <p className="text-[11px] text-zinc-500">{PLANS[key].candidates}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">MRR USD *</label>
                <input
                  type="number"
                  required
                  value={form.mrr_usd}
                  onChange={(e) => setForm({ ...form, mrr_usd: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Début facturation *</label>
                <input
                  type="date"
                  required
                  value={form.billing_start_date}
                  onChange={(e) => setForm({ ...form, billing_start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4 — Recrutement */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-[16px] font-bold text-zinc-900 mb-1">Besoins de recrutement</h2>
            <p className="text-[12px] text-zinc-500 mb-6">Quels rôles ils cherchent + qui livre chez Aimio</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Rôles à combler (un par ligne)</label>
                <textarea
                  value={form.roles_hiring_for}
                  onChange={(e) => setForm({ ...form, roles_hiring_for: e.target.value })}
                  rows={3}
                  placeholder="Senior Software Engineer&#10;Head of Marketing&#10;VP Operations"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Recruteur lead assigné</label>
                <select
                  value={form.recruteur_lead}
                  onChange={(e) => setForm({ ...form, recruteur_lead: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="anne-marie">Anne-Marie Gagnon-Bouchard</option>
                  <option value="lea">Léa</option>
                  <option value="rosalie">Rosalie</option>
                  <option value="marc-antoine">Marc-Antoine (founder)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2 block">Notes internes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Context, preferences, red flags, etc."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {result && !result.success && (
            <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-red-700">{result.message}</p>
            </div>
          )}

          {/* Submit */}
          <div className="p-8 bg-zinc-50 flex items-center justify-between">
            <p className="text-[12px] text-zinc-500">
              Welcome email + credentials envoyés automatiquement au client.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-[#2445EB]/20"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Création en cours...</>
              ) : (
                <>Onboarder le client 🚀</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
