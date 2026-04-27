"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Mandate } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { Plus, Briefcase, MapPin, DollarSign, Users, Loader2, CheckCircle2, Pause, X } from "lucide-react";

export default function AdminMandatesPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '', department: '', description: '', salary_min: '', salary_max: '',
    location: '', work_mode: 'Hybrid', company_id: '11111111-1111-1111-1111-111111111111',
  });

  useEffect(() => {
    loadMandates();
  }, []);

  async function loadMandates() {
    const { data } = await supabase.from('mandates').select('*').order('created_at', { ascending: false });
    setMandates(data || []);
    setLoading(false);
  }

  const handleCreate = async () => {
    if (!form.title || !form.location) { toast.warning('Title and location are required.'); return; }
    setCreating(true);
    await supabase.from('mandates').insert({
      company_id: form.company_id,
      title: form.title,
      department: form.department,
      description: form.description,
      salary_min: parseInt(form.salary_min) || null,
      salary_max: parseInt(form.salary_max) || null,
      location: form.location,
      work_mode: form.work_mode,
      status: 'active',
    });
    setShowCreate(false);
    setForm({ title: '', department: '', description: '', salary_min: '', salary_max: '', location: '', work_mode: 'Hybrid', company_id: '11111111-1111-1111-1111-111111111111' });
    setCreating(false);
    loadMandates();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('mandates').update({ status }).eq('id', id);
    loadMandates();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Mandates</h1>
          <p className="text-zinc-400 text-[13px] mt-0.5">Manage client positions</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium btn-press">
          <Plus size={15} /> New mandate
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card mb-6">
          <p className="label mb-4">New mandate</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Position title *", field: "title", placeholder: "Senior Estimator" },
              { label: "Department", field: "department", placeholder: "Estimation" },
              { label: "Location *", field: "location", placeholder: "Toronto, ON" },
              { label: "Work mode", field: "work_mode", placeholder: "Hybrid (3 days)" },
              { label: "Salary min", field: "salary_min", placeholder: "95000", type: "number" },
              { label: "Salary max", field: "salary_max", placeholder: "120000", type: "number" },
            ].map((input) => (
              <div key={input.field}>
                <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">{input.label}</label>
                <input
                  type={input.type || "text"}
                  value={form[input.field as keyof typeof form]}
                  onChange={(e) => setForm(prev => ({ ...prev, [input.field]: e.target.value }))}
                  placeholder={input.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none placeholder:text-zinc-300"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-zinc-500 font-medium mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Role description, requirements, responsibilities..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] resize-none h-20 focus:border-[#6C2BD9] outline-none placeholder:text-zinc-300"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium btn-press disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create mandate
            </button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-lg text-[13px] font-medium btn-press">Cancel</button>
          </div>
        </div>
      )}

      {/* Mandate list */}
      <div className="space-y-3">
        {mandates.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Briefcase size={16} className="text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-zinc-900">{m.title}</h3>
                  <p className="text-[11px] text-zinc-400">{m.department || "No department"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${
                  m.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  m.status === 'paused' ? 'bg-zinc-100 text-zinc-600' :
                  m.status === 'filled' ? 'bg-blue-50 text-blue-700' :
                  'bg-zinc-50 text-zinc-500'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    m.status === 'active' ? 'bg-emerald-500' :
                    m.status === 'paused' ? 'bg-zinc-500' :
                    m.status === 'filled' ? 'bg-blue-500' :
                    'bg-zinc-400'
                  }`} />
                  {m.status === 'active' ? 'Active' : m.status === 'paused' ? 'Paused' : m.status === 'filled' ? 'Filled' : 'Cancelled'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-400 mb-4">
              <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>
              {m.salary_min && <span className="flex items-center gap-1"><DollarSign size={11} /> ${(m.salary_min/1000).toFixed(0)}-{(m.salary_max/1000).toFixed(0)}K</span>}
              <span className="flex items-center gap-1">{m.work_mode}</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/admin/candidates/new?mandate=${m.id}`}
                className="px-3 py-1.5 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-md text-[11px] font-medium btn-press flex items-center gap-1.5">
                <Plus size={11} /> Add candidate
              </Link>
              {m.status === 'active' && (
                <button onClick={() => updateStatus(m.id, 'paused')}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md text-[11px] font-medium btn-press flex items-center gap-1.5">
                  <Pause size={11} /> Pause
                </button>
              )}
              {m.status === 'paused' && (
                <button onClick={() => updateStatus(m.id, 'active')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-medium btn-press flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> Reactivate
                </button>
              )}
              {m.status === 'active' && (
                <button onClick={() => updateStatus(m.id, 'filled')}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-md text-[11px] font-medium btn-press flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> Mark filled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
