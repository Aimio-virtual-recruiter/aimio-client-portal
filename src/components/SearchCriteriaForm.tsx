"use client";
import { useState } from "react";
import {
  Plus,
  X,
  Briefcase,
  Award,
  Globe2,
  Building2,
  Target,
  Languages as LanguagesIcon,
  GraduationCap,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ────────────────────────────────────────────────────────────────────────

export interface SearchCriteria {
  jobTitlesCurrent: string[];
  jobTitlesPast: string[];
  excludeTitles: string[];
  yearsExperienceMin: number;
  yearsExperienceMax: number;
  seniorityLevels: string[];
  functions: string[];
  locations: string[];
  countries: string[];
  remoteOk: boolean;
  willingToRelocate: boolean;
  currentEmployers: string[];
  pastEmployers: string[];
  excludeEmployers: string[];
  industries: string[];
  companySizes: string[];
  skills: string[];
  certifications: string[];
  languages: { name: string; proficiency: string }[];
  schools: string[];
  degrees: string[];
  fieldsOfStudy: string[];
  openToWork: boolean;
  recentlyChangedJobs: boolean;
  yearsAtCurrentMin: number;
  diversityFilters: string[];
}

// ────────────────────────────────────────────────────────────────────────
// SHARED CONSTANTS
// ────────────────────────────────────────────────────────────────────────

export const SENIORITY_LEVELS = [
  "Stagiaire",
  "Junior (0-2 ans)",
  "Intermédiaire (3-5 ans)",
  "Sénior (6-10 ans)",
  "Lead / Manager",
  "Directeur",
  "VP / Vice-Président",
  "C-Suite (CEO/CFO/COO)",
];

export const FUNCTIONS = [
  "Comptabilité / Finance",
  "Construction / Génie civil",
  "Génie mécanique",
  "Génie électrique",
  "Droit / Juridique",
  "Ressources humaines",
  "Ventes / Développement",
  "Marketing",
  "Opérations",
  "Logistique / Chaîne d'approvisionnement",
  "Gestion de projet",
  "Administration",
  "Production / Manufacturier",
  "Service à la clientèle",
  "Santé / Médical",
  "Éducation",
  "Immobilier",
  "Restauration / Hôtellerie",
];

export const INDUSTRIES = [
  "Construction",
  "Manufacturier",
  "Services financiers",
  "Cabinets d'avocats",
  "Cabinets comptables",
  "Immobilier",
  "Énergie / Mines",
  "Transport / Logistique",
  "Détail / Commerce",
  "Hôtellerie / Restauration",
  "Santé",
  "Éducation",
  "Gouvernement / Public",
  "OBNL",
  "Agriculture / Agroalimentaire",
];

export const COMPANY_SIZES = [
  "1-10 employés",
  "11-50 employés",
  "51-200 employés",
  "201-500 employés",
  "501-1000 employés",
  "1001-5000 employés",
  "5000+ employés",
];

export const LANGUAGE_PROFICIENCY = ["Notions", "Conversationnel", "Courant", "Bilingue / Natif"];

export const COMMON_LANGUAGES = [
  "Français",
  "Anglais",
  "Espagnol",
  "Mandarin",
  "Arabe",
  "Portugais",
  "Italien",
  "Allemand",
];

export const DEGREE_LEVELS = [
  "DEP / DEC",
  "Certificat",
  "Baccalauréat",
  "Maîtrise",
  "MBA",
  "Doctorat (Ph.D.)",
];

export function emptyCriteria(): SearchCriteria {
  return {
    jobTitlesCurrent: [],
    jobTitlesPast: [],
    excludeTitles: [],
    yearsExperienceMin: 0,
    yearsExperienceMax: 30,
    seniorityLevels: [],
    functions: [],
    locations: [],
    countries: [],
    remoteOk: false,
    willingToRelocate: false,
    currentEmployers: [],
    pastEmployers: [],
    excludeEmployers: [],
    industries: [],
    companySizes: [],
    skills: [],
    certifications: [],
    languages: [],
    schools: [],
    degrees: [],
    fieldsOfStudy: [],
    openToWork: false,
    recentlyChangedJobs: false,
    yearsAtCurrentMin: 0,
    diversityFilters: [],
  };
}

// ────────────────────────────────────────────────────────────────────────
// HELPER UI COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function Section({
  step,
  title,
  description,
  icon,
  children,
  defaultOpen = true,
}: {
  step?: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-start gap-3 text-left hover:bg-zinc-50 transition rounded-2xl"
      >
        {step !== undefined && (
          <div className="w-7 h-7 rounded-full bg-[#2445EB]/10 text-[#2445EB] text-[12px] font-bold flex items-center justify-center shrink-0">
            {step}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-zinc-900 flex items-center gap-1.5">
            {icon}
            {title}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">{description}</p>
        </div>
        <span className="text-zinc-400 text-[18px] shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

function TagInput({
  label,
  hint,
  placeholder,
  items,
  onChange,
  color,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  items: string[];
  onChange: (v: string[]) => void;
  color: "emerald" | "blue" | "zinc" | "purple" | "red";
}) {
  const [input, setInput] = useState("");
  const colorClasses: Record<typeof color, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) {
      onChange([...items, v]);
      setInput("");
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="border border-zinc-200 rounded-lg px-2 py-1.5 focus-within:border-[#2445EB] focus-within:ring-2 focus-within:ring-[#2445EB]/10">
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[12px] ${colorClasses[color]}`}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="hover:bg-white/50 rounded p-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add();
              } else if (e.key === "Backspace" && !input && items.length) {
                onChange(items.slice(0, -1));
              }
            }}
            onBlur={add}
            placeholder={items.length ? "" : placeholder}
            className="flex-1 min-w-[120px] px-1 py-1 text-[13px] outline-none bg-transparent"
          />
        </div>
      </div>
    </Field>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() =>
              onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
            }
            className={`px-2.5 py-1.5 rounded-md border text-[12px] transition ${
              active
                ? "bg-[#2445EB] border-[#2445EB] text-white"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition ${
        checked
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
          checked ? "bg-emerald-500 border-emerald-500" : "border-zinc-300"
        }`}
      >
        {checked && <CheckCircle2 size={10} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 cursor-pointer transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#2445EB]"
      />
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-zinc-900">{label}</p>
        <p className="text-[12px] text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

function LanguagesField({
  languages,
  onChange,
}: {
  languages: { name: string; proficiency: string }[];
  onChange: (v: { name: string; proficiency: string }[]) => void;
}) {
  const addLang = (name: string) => {
    if (!languages.find((l) => l.name === name)) {
      onChange([...languages, { name, proficiency: "Courant" }]);
    }
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {languages.map((lang, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-50"
          >
            <span className="text-[13px] font-semibold text-zinc-900 flex-1">{lang.name}</span>
            <select
              value={lang.proficiency}
              onChange={(e) => {
                const newLangs = [...languages];
                newLangs[i] = { ...lang, proficiency: e.target.value };
                onChange(newLangs);
              }}
              className="px-2 py-1 rounded border border-zinc-200 text-[12px] bg-white"
            >
              {LANGUAGE_PROFICIENCY.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange(languages.filter((_, idx) => idx !== i))}
              className="p-1 hover:bg-zinc-200 rounded"
            >
              <X size={12} className="text-zinc-500" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] text-zinc-400 self-center mr-1">Ajouter :</span>
        {COMMON_LANGUAGES.filter((l) => !languages.find((x) => x.name === l)).map((l) => (
          <button
            type="button"
            key={l}
            onClick={() => addLang(l)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-zinc-300 text-[12px] text-zinc-600 hover:border-[#2445EB] hover:text-[#2445EB]"
          >
            <Plus size={10} /> {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — full Recruiter Lite criteria form
// ────────────────────────────────────────────────────────────────────────

export function SearchCriteriaForm({
  criteria,
  onChange,
  startStep = 1,
  defaultOpen = false,
}: {
  criteria: SearchCriteria;
  onChange: (c: SearchCriteria) => void;
  startStep?: number;
  defaultOpen?: boolean;
}) {
  const update = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) =>
    onChange({ ...criteria, [key]: value });

  return (
    <div>
      {/* 1 — Job titles */}
      <Section
        step={startStep}
        title="Titres d'emploi"
        icon={<Briefcase size={14} />}
        description="Titres actuels recherchés et titres antérieurs (boost pour candidats avec parcours pertinent)"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagInput
            label="Titres actuels"
            hint="Le candidat doit avoir un de ces titres maintenant"
            placeholder="ex: Senior Accountant"
            items={criteria.jobTitlesCurrent}
            onChange={(v) => update("jobTitlesCurrent", v)}
            color="blue"
          />
          <TagInput
            label="Titres passés"
            hint="A occupé un de ces postes par le passé"
            placeholder="ex: Junior Auditor"
            items={criteria.jobTitlesPast}
            onChange={(v) => update("jobTitlesPast", v)}
            color="purple"
          />
          <div className="md:col-span-2">
            <TagInput
              label="Titres à exclure"
              hint="Aucun candidat avec ces titres"
              placeholder="ex: Stagiaire, Étudiant"
              items={criteria.excludeTitles}
              onChange={(v) => update("excludeTitles", v)}
              color="red"
            />
          </div>
        </div>
      </Section>

      {/* 2 — Experience + seniority */}
      <Section
        step={startStep + 1}
        title="Expérience et niveau"
        icon={<Award size={14} />}
        description="Années d'expérience, niveau de séniorité et fonction"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label={`Années d'expérience : ${criteria.yearsExperienceMin} - ${criteria.yearsExperienceMax} ans`}>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="40"
                value={criteria.yearsExperienceMin}
                onChange={(e) => update("yearsExperienceMin", parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
              />
              <span className="text-zinc-400">à</span>
              <input
                type="number"
                min="0"
                max="40"
                value={criteria.yearsExperienceMax}
                onChange={(e) => update("yearsExperienceMax", parseInt(e.target.value) || 30)}
                className="w-20 px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
              />
              <span className="text-[13px] text-zinc-500">ans</span>
            </div>
          </Field>
          <Field label="Années dans le poste actuel (min)">
            <input
              type="number"
              min="0"
              max="20"
              value={criteria.yearsAtCurrentMin}
              onChange={(e) => update("yearsAtCurrentMin", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px]"
            />
          </Field>
        </div>
        <Field label="Niveau de séniorité">
          <ChipMultiSelect
            options={SENIORITY_LEVELS}
            selected={criteria.seniorityLevels}
            onChange={(v) => update("seniorityLevels", v)}
          />
        </Field>
        <Field label="Fonction / département">
          <ChipMultiSelect
            options={FUNCTIONS}
            selected={criteria.functions}
            onChange={(v) => update("functions", v)}
          />
        </Field>
      </Section>

      {/* 3 — Geography */}
      <Section
        step={startStep + 2}
        title="Géographie"
        icon={<Globe2 size={14} />}
        description="Où le candidat doit être localisé"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TagInput
            label="Villes / régions"
            hint="ex: Montréal, Québec, Laval, Rive-Sud"
            placeholder="Ajouter une ville"
            items={criteria.locations}
            onChange={(v) => update("locations", v)}
            color="zinc"
          />
          <TagInput
            label="Pays"
            hint="ex: Canada, États-Unis, France"
            placeholder="Ajouter un pays"
            items={criteria.countries}
            onChange={(v) => update("countries", v)}
            color="zinc"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <ToggleChip
            label="Ouvert au télétravail"
            checked={criteria.remoteOk}
            onChange={(v) => update("remoteOk", v)}
          />
          <ToggleChip
            label="Prêt à se relocaliser"
            checked={criteria.willingToRelocate}
            onChange={(v) => update("willingToRelocate", v)}
          />
        </div>
      </Section>

      {/* 4 — Companies + industry */}
      <Section
        step={startStep + 3}
        title="Entreprises et industrie"
        icon={<Building2 size={14} />}
        description="Employeurs cibles, à éviter, taille d'entreprise et secteur"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TagInput
            label="Employeurs actuels (cibles)"
            hint="Travaille présentement chez"
            placeholder="ex: KPMG, Deloitte, EY"
            items={criteria.currentEmployers}
            onChange={(v) => update("currentEmployers", v)}
            color="emerald"
          />
          <TagInput
            label="Employeurs passés"
            hint="A déjà travaillé chez"
            placeholder="ex: Pomerleau, EBC"
            items={criteria.pastEmployers}
            onChange={(v) => update("pastEmployers", v)}
            color="purple"
          />
          <div className="md:col-span-2">
            <TagInput
              label="Employeurs à exclure"
              hint="Ne pas approcher candidats venant de"
              placeholder="ex: concurrent direct du client"
              items={criteria.excludeEmployers}
              onChange={(v) => update("excludeEmployers", v)}
              color="red"
            />
          </div>
        </div>
        <Field label="Industrie">
          <ChipMultiSelect
            options={INDUSTRIES}
            selected={criteria.industries}
            onChange={(v) => update("industries", v)}
          />
        </Field>
        <Field label="Taille de l'entreprise">
          <ChipMultiSelect
            options={COMPANY_SIZES}
            selected={criteria.companySizes}
            onChange={(v) => update("companySizes", v)}
          />
        </Field>
      </Section>

      {/* 5 — Skills + certifications */}
      <Section
        step={startStep + 4}
        title="Compétences et certifications"
        icon={<Target size={14} />}
        description="Skills techniques, soft skills, certifications professionnelles"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagInput
            label="Compétences"
            hint="ex: Excel avancé, SAP, Revit, AutoCAD, gestion d'équipe"
            placeholder="Ajouter une compétence"
            items={criteria.skills}
            onChange={(v) => update("skills", v)}
            color="blue"
          />
          <TagInput
            label="Certifications"
            hint="ex: CPA, PMP, ing., LL.B., CFA"
            placeholder="Ajouter une certification"
            items={criteria.certifications}
            onChange={(v) => update("certifications", v)}
            color="emerald"
          />
        </div>
      </Section>

      {/* 6 — Languages */}
      <Section
        step={startStep + 5}
        title="Langues parlées"
        icon={<LanguagesIcon size={14} />}
        description="Langues requises et niveau de maîtrise"
        defaultOpen={defaultOpen}
      >
        <LanguagesField
          languages={criteria.languages}
          onChange={(v) => update("languages", v)}
        />
      </Section>

      {/* 7 — Education */}
      <Section
        step={startStep + 6}
        title="Formation académique"
        icon={<GraduationCap size={14} />}
        description="Universités, niveaux de diplôme et champs d'études"
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TagInput
            label="Universités / écoles"
            hint="ex: HEC Montréal, McGill, Laval"
            placeholder="Ajouter une école"
            items={criteria.schools}
            onChange={(v) => update("schools", v)}
            color="purple"
          />
          <Field label="Niveau de diplôme">
            <ChipMultiSelect
              options={DEGREE_LEVELS}
              selected={criteria.degrees}
              onChange={(v) => update("degrees", v)}
            />
          </Field>
          <TagInput
            label="Champ d'études"
            hint="ex: Comptabilité, Génie civil, Droit"
            placeholder="Ajouter un champ"
            items={criteria.fieldsOfStudy}
            onChange={(v) => update("fieldsOfStudy", v)}
            color="blue"
          />
        </div>
      </Section>

      {/* 8 — Signals */}
      <Section
        step={startStep + 7}
        title="Signaux d'ouverture"
        icon={<UserCheck size={14} />}
        description="Filtrer pour candidats plus réceptifs à un changement"
        defaultOpen={defaultOpen}
      >
        <div className="space-y-2">
          <ToggleRow
            label="Open to Work"
            desc="Candidats avec le badge LinkedIn « Ouvert aux opportunités »"
            checked={criteria.openToWork}
            onChange={(v) => update("openToWork", v)}
          />
          <ToggleRow
            label="A récemment changé d'emploi (6 derniers mois)"
            desc="Plus difficile à approcher mais bon signal d'ambition"
            checked={criteria.recentlyChangedJobs}
            onChange={(v) => update("recentlyChangedJobs", v)}
          />
        </div>
      </Section>
    </div>
  );
}
