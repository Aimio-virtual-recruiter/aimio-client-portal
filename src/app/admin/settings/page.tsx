"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Users,
  DollarSign,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  Edit2,
  X,
} from "lucide-react";

interface Recruiter {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  specialty: string | null;
  calendly_url: string | null;
  linkedin_url: string | null;
  is_active: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"team" | "pricing" | "templates">("team");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Recruiter>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("recruiters")
        .select("*")
        .order("is_active", { ascending: false })
        .order("name");
      setRecruiters(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const startEdit = (r: Recruiter) => {
    setEditingId(r.id);
    setEditForm(r);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("recruiters")
      .update({
        name: editForm.name,
        title: editForm.title,
        email: editForm.email,
        phone: editForm.phone,
        photo_url: editForm.photo_url,
        specialty: editForm.specialty,
        calendly_url: editForm.calendly_url,
        linkedin_url: editForm.linkedin_url,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (!error) {
      setRecruiters((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...editForm } as Recruiter : r))
      );
      setSavedId(editingId);
      setTimeout(() => setSavedId(null), 2000);
      setEditingId(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-[#6C2BD9]" />
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
            Settings & Configuration
          </h1>
        </div>
        <p className="text-[13px] text-zinc-500">
          Gère ton équipe, tes prix et tes templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-zinc-200">
        {[
          { id: "team", label: "Équipe", icon: Users },
          { id: "pricing", label: "Pricing", icon: DollarSign },
          { id: "templates", label: "Templates", icon: Mail },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px ${
                active
                  ? "text-[#6C2BD9] border-[#6C2BD9]"
                  : "text-zinc-500 border-transparent hover:text-zinc-900"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TEAM TAB */}
      {activeTab === "team" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-zinc-300" size={20} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h3 className="text-[13px] font-semibold text-zinc-900">
                  Équipe Aimio ({recruiters.length} personnes)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ajoute photo, Calendly, LinkedIn pour que le widget client soit complet.
                </p>
              </div>

              <div className="divide-y divide-zinc-100">
                {recruiters.map((r) => {
                  const isEditing = editingId === r.id;
                  const form = isEditing ? editForm : r;

                  return (
                    <div key={r.id} className="px-6 py-4">
                      {isEditing ? (
                        // EDIT MODE
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={form.name ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Nom"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                            <input
                              type="text"
                              value={form.title ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              placeholder="Titre"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="email"
                              value={form.email ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="Email"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                            <input
                              type="tel"
                              value={form.phone ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="Téléphone"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={form.specialty ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                              placeholder="Spécialité (ex: Construction)"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                            <input
                              type="url"
                              value={form.photo_url ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })}
                              placeholder="URL photo"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="url"
                              value={form.calendly_url ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, calendly_url: e.target.value })}
                              placeholder="Calendly URL"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                            <input
                              type="url"
                              value={form.linkedin_url ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                              placeholder="LinkedIn URL"
                              className="px-3 py-2 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-[#6C2BD9]"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-[12px] text-zinc-700">
                            <input
                              type="checkbox"
                              checked={form.is_active}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="accent-[#6C2BD9]"
                            />
                            Actif
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#6C2BD9] text-white rounded-md text-[12px] font-medium"
                            >
                              <Save size={12} /> Sauvegarder
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditForm({}); }}
                              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 text-zinc-700 rounded-md text-[12px]"
                            >
                              <X size={12} /> Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // VIEW MODE
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center shrink-0">
                            {r.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.photo_url} alt={r.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-[11px] font-semibold text-zinc-600">
                                {r.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("")}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-zinc-900 truncate">{r.name}</p>
                              {!r.is_active && (
                                <span className="text-[9px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">Inactif</span>
                              )}
                              {savedId === r.id && (
                                <CheckCircle2 size={13} className="text-emerald-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500">{r.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                              {r.email && <span>✉ {r.email}</span>}
                              {r.phone && <span>☎ {r.phone}</span>}
                              {r.calendly_url && <span className="text-emerald-600">📅 Calendly</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => startEdit(r)}
                            className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-500"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRICING TAB */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-4">
              Plans — Recrutement permanent
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: "STANDARD", pct: "18%", guarantee: "3 mois" },
                { name: "ESSENTIEL", pct: "20%", guarantee: "6 mois" },
                { name: "ÉLITE", pct: "22%", guarantee: "12 mois" },
              ].map((p) => (
                <div key={p.name} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{p.name}</p>
                  <p className="text-[24px] font-bold text-zinc-900 mt-1">{p.pct}</p>
                  <p className="text-[11px] text-zinc-500">Garantie {p.guarantee}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-4">
              💡 Ces tarifs sont hardcodés dans le code et dans ton contrat. Pour les modifier, change aussi dans le PDF Annexe A.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-4">
              Plans — Recruteur Virtuel IA
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: "STARTER", price: "$1,999", limit: "2 postes" },
                { name: "PRO", price: "$2,999", limit: "5 postes" },
                { name: "ENTERPRISE", price: "$4,999", limit: "10+ postes" },
              ].map((p) => (
                <div key={p.name} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{p.name}</p>
                  <p className="text-[20px] font-bold text-zinc-900 mt-1">{p.price}/mo</p>
                  <p className="text-[11px] text-zinc-500">{p.limit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-card">
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-4">
            Templates email & outreach
          </h3>
          <p className="text-[12px] text-zinc-500 mb-4">
            Les templates sont actuellement gérés par Claude AI dynamiquement. Pour customiser, édite les prompts dans :
          </p>
          <ul className="text-[12px] text-zinc-700 space-y-1.5 bg-zinc-50 rounded-lg p-4">
            <li>▸ <code className="bg-white px-1 rounded">src/app/api/process-candidate/route.ts</code> (outreach initial)</li>
            <li>▸ <code className="bg-white px-1 rounded">src/app/api/auto-followup/route.ts</code> (follow-ups J+3 et J+7)</li>
            <li>▸ <code className="bg-white px-1 rounded">src/app/api/qualify-candidate/route.ts</code> (client-facing profile)</li>
            <li>▸ <code className="bg-white px-1 rounded">C:\Users\marca\AIMIO_SALES_PLAYBOOK.md</code> (scripts William/Jim)</li>
          </ul>

          <p className="text-[11px] text-zinc-400 mt-4">
            💡 Le vrai gain = laisser Claude personnaliser à chaque envoi. Les templates fixes = moins efficaces.
          </p>
        </div>
      )}
    </div>
  );
}
