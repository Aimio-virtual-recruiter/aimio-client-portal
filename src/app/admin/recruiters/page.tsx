"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  X,
  AlertCircle,
  MoreVertical,
  Send,
} from "lucide-react";

interface Recruiter {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: "admin" | "recruiter";
  assigned_client_ids: string[];
  is_active: boolean;
  invited_at: string | null;
  invitation_accepted_at: string | null;
  last_login_at: string | null;
  stats: {
    sourcing_runs: number;
    candidates_delivered: number;
    assigned_clients: number;
  };
}

interface Client {
  id: string;
  company_name: string;
}

export default function RecruitersAdminPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [recResp, cliResp] = await Promise.all([
        fetch("/api/admin/recruiters/list"),
        fetch("/api/recruiter/clients"),
      ]);
      const recData = await recResp.json();
      const cliData = await cliResp.json();
      setRecruiters(recData.recruiters || []);
      setClients(cliData.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/recruiters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deactivate = async (id: string, name: string) => {
    if (!confirm(`Désactiver ${name} ? Il/elle ne pourra plus se connecter.`)) return;
    try {
      await fetch(`/api/admin/recruiters/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={20} />
      </div>
    );
  }

  const active = recruiters.filter((r) => r.is_active);
  const pending = recruiters.filter((r) => r.is_active && !r.invitation_accepted_at);
  const total = active.length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft size={12} /> Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">
                Recruteurs de l&apos;équipe
              </h1>
              <p className="text-[13px] text-zinc-500">
                {total} membre{total > 1 ? "s" : ""} · {pending.length} invitation
                {pending.length > 1 ? "s" : ""} en attente
              </p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="px-5 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition flex items-center gap-2 shadow-lg shadow-[#2445EB]/20"
            >
              <UserPlus size={14} /> Inviter un recruteur
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {recruiters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-zinc-400" />
            </div>
            <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">
              Aucun recruteur encore
            </h3>
            <p className="text-[13px] text-zinc-500 mb-6">
              Invite ton équipe pour commencer à livrer les clients RV.
            </p>
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2445EB] text-white rounded-full text-[13px] font-semibold hover:bg-[#1A36C4] transition"
            >
              <UserPlus size={14} /> Inviter le premier
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {recruiters.map((r) => (
                <RecruiterRow
                  key={r.id}
                  recruiter={r}
                  clients={clients}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onToggleActive={() => toggleActive(r.id, r.is_active)}
                  onDeactivate={() => deactivate(r.id, `${r.first_name} ${r.last_name}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {showInvite && (
        <InviteModal
          clients={clients}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ============ ROW ============
function RecruiterRow({
  recruiter,
  clients,
  activeMenu,
  setActiveMenu,
  onToggleActive,
  onDeactivate,
}: {
  recruiter: Recruiter;
  clients: Client[];
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  onToggleActive: () => void;
  onDeactivate: () => void;
}) {
  const name =
    `${recruiter.first_name} ${recruiter.last_name}`.trim() || recruiter.email;
  const isPending = !recruiter.invitation_accepted_at;
  const assignedNames = (recruiter.assigned_client_ids || [])
    .map((cid) => clients.find((c) => c.id === cid)?.company_name)
    .filter(Boolean);

  return (
    <div className="p-5 flex items-center gap-4 hover:bg-zinc-50 transition">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] flex items-center justify-center text-white font-bold text-[14px] shrink-0">
        {(recruiter.first_name || recruiter.email)[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[14px] font-semibold text-zinc-900 truncate">{name}</p>
          {recruiter.role === "admin" && (
            <span className="text-[10px] bg-purple-100 text-purple-700 rounded px-1.5 py-0.5 font-semibold uppercase">
              Admin
            </span>
          )}
          {!recruiter.is_active && (
            <span className="text-[10px] bg-zinc-200 text-zinc-600 rounded px-1.5 py-0.5 font-semibold uppercase">
              Désactivé
            </span>
          )}
          {isPending && recruiter.is_active && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-semibold uppercase">
              <Clock size={9} /> En attente
            </span>
          )}
          {!isPending && recruiter.is_active && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 font-semibold uppercase">
              <CheckCircle2 size={9} /> Actif
            </span>
          )}
        </div>
        <p className="text-[12px] text-zinc-500 truncate">{recruiter.email}</p>
        {assignedNames.length > 0 && (
          <p className="text-[11px] text-zinc-400 mt-1">
            Clients : {assignedNames.join(", ")}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-[11px] text-zinc-500 shrink-0">
        <div className="text-right">
          <p className="text-[16px] font-bold text-zinc-900 tabular-nums">
            {recruiter.stats.sourcing_runs}
          </p>
          <p>Sourcing runs</p>
        </div>
        <div className="text-right">
          <p className="text-[16px] font-bold text-[#2445EB] tabular-nums">
            {recruiter.stats.candidates_delivered}
          </p>
          <p>Livrés</p>
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() =>
            setActiveMenu(activeMenu === recruiter.id ? null : recruiter.id)
          }
          className="p-2 hover:bg-zinc-100 rounded-full transition"
        >
          <MoreVertical size={14} className="text-zinc-500" />
        </button>
        {activeMenu === recruiter.id && (
          <div className="absolute right-0 top-10 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[180px] z-10">
            {recruiter.is_active && isPending && (
              <button
                onClick={() => {
                  // TODO: resend invitation
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-zinc-50 flex items-center gap-2"
              >
                <Send size={12} /> Renvoyer l&apos;invitation
              </button>
            )}
            <button
              onClick={() => {
                onToggleActive();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-[12px] hover:bg-zinc-50"
            >
              {recruiter.is_active ? "Désactiver" : "Réactiver"}
            </button>
            {recruiter.role !== "admin" && (
              <button
                onClick={() => {
                  onDeactivate();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ INVITE MODAL ============
function InviteModal({
  clients,
  onClose,
  onSuccess,
}: {
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedClientIds, setAssignedClientIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleClient = (id: string) => {
    setAssignedClientIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/recruiters/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          assigned_client_ids: assignedClientIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invitation failed");
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-[18px] font-bold text-zinc-900">Inviter un recruteur</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-full transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Anne-Marie"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Gagnon-Bouchard"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail size={11} /> Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anne.marie@aimiorecrutement.com"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 514-555-0100"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
            />
          </div>

          {clients.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
                Clients assignés (optionnel)
              </label>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto border border-zinc-200 rounded-lg p-2">
                {clients.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-[13px] transition ${
                      assignedClientIds.includes(c.id)
                        ? "bg-[#2445EB]/5 text-zinc-900"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={assignedClientIds.includes(c.id)}
                      onChange={() => toggleClient(c.id)}
                      className="accent-[#2445EB]"
                    />
                    <span>{c.company_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-[11px] text-blue-900">
              <strong>Ce qui va se passer :</strong> Un courriel d&apos;invitation avec un lien
              sécurisé sera envoyé. Le recruteur clique, crée son mot de passe, et accède
              immédiatement au portail.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-[13px] font-semibold hover:bg-zinc-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#2445EB] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1A36C4] disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Envoi...
                </>
              ) : (
                <>
                  <Send size={14} /> Envoyer l&apos;invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
