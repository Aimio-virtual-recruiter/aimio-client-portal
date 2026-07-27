/**
 * ════════════════════════════════════════════════════════════════════════
 *  Import des EOD historiques  Airtable → Supabase (table recruiter_eod)
 * ════════════════════════════════════════════════════════════════════════
 *  Migre les ~324 rapports de fin de journée de la base Airtable
 *  « Aimio - Recruiter KPIs » vers la table native `recruiter_eod`.
 *
 *  Le point délicat : un EOD Airtable pointe vers un enregistrement
 *  « Recruteur » (id Airtable), alors que Supabase indexe par
 *  profiles.id (= auth.uid). On fait le pont via l'EMAIL du recruteur.
 *
 *  Sécurité : DRY-RUN par défaut (aucune écriture). Ajoute --commit pour
 *  écrire réellement. Les EOD dont le recruteur n'a pas d'email mappable
 *  dans profiles sont ignorés et listés à la fin.
 *
 *  Variables d'environnement requises :
 *    AIRTABLE_TOKEN                (personal access token, scope data.records:read)
 *    NEXT_PUBLIC_SUPABASE_URL
 *    SUPABASE_SERVICE_ROLE_KEY     (contourne RLS pour l'import)
 *
 *  Exécution :
 *    node scripts/import_eod_from_airtable.mjs            # dry-run
 *    node scripts/import_eod_from_airtable.mjs --commit   # écrit
 * ════════════════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

// ---- Config ----------------------------------------------------------------
const BASE_ID = "app8XQW8Q74NhCuYz"; // Aimio - Recruiter KPIs
const T_EOD = "EOD Recruteur";
const T_REC = "Recruteurs";

const COMMIT = process.argv.includes("--commit");

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!AIRTABLE_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌ Variables manquantes. Requis : AIRTABLE_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Mapping des champs Airtable → colonnes Supabase (les 8 chiffres du funnel).
const FIELD_MAP = {
  "Prescreening réalisés": "prescreenings",
  "Appels cold passés": "calls",
  "Candidats soumis au client": "submissions",
  "Entrevues client tenues": "interviews_held",
  "Offres extended (par client)": "offers",
  "Offres acceptées": "offers_accepted",
  "Placements closés aujourd'hui": "placements",
  "📢 Affichages publiés": "postings",
};

// ---- Helpers Airtable ------------------------------------------------------
async function airtableAll(table) {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    if (!res.ok) {
      throw new Error(`Airtable ${table} ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    records.push(...json.records);
    offset = json.offset;
  } while (offset);
  return records;
}

const num = (v) => Math.max(0, Math.round(Number(v) || 0));
const norm = (e) => (e || "").trim().toLowerCase();

// ---- Main ------------------------------------------------------------------
async function main() {
  console.log(`\n🔧 Mode : ${COMMIT ? "COMMIT (écriture)" : "DRY-RUN (aucune écriture)"}\n`);

  // 1. Recruteurs Airtable : id Airtable → email
  const recRecords = await airtableAll(T_REC);
  const airtableRecEmail = {}; // recId -> email
  for (const r of recRecords) {
    airtableRecEmail[r.id] = norm(r.fields["Email"]);
  }
  console.log(`📇 Recruteurs Airtable : ${recRecords.length}`);

  // 2. Profiles Supabase : email → id
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email");
  if (pErr) throw new Error(`Supabase profiles: ${pErr.message}`);
  const emailToProfile = {};
  for (const p of profiles) emailToProfile[norm(p.email)] = p.id;
  console.log(`👤 Profils Supabase : ${profiles.length}`);

  // 3. EOD Airtable
  const eodRecords = await airtableAll(T_EOD);
  console.log(`📅 EOD Airtable : ${eodRecords.length}\n`);

  // 4. Transformer
  const rows = [];
  const skipped = []; // { reason, recId, date, name }
  for (const e of eodRecords) {
    const f = e.fields;
    const date = (f["Date"] || "").slice(0, 10);
    const link = f["Recruteur"];
    if (!date) {
      skipped.push({ reason: "sans date", recId: e.id });
      continue;
    }
    if (!Array.isArray(link) || link.length === 0) {
      skipped.push({ reason: "sans recruteur lié", recId: e.id, date });
      continue;
    }
    const email = airtableRecEmail[link[0].id ?? link[0]];
    const profileId = email ? emailToProfile[email] : undefined;
    if (!profileId) {
      skipped.push({ reason: `recruteur non mappé (${email || "email absent"})`, recId: e.id, date });
      continue;
    }

    const row = {
      recruiter_id: profileId,
      eod_date: date,
      source: "airtable_import",
    };
    for (const [atField, col] of Object.entries(FIELD_MAP)) {
      row[col] = num(f[atField]);
    }
    rows.push(row);
  }

  console.log(`✅ Prêts à importer : ${rows.length}`);
  console.log(`⏭️  Ignorés : ${skipped.length}`);
  if (skipped.length) {
    const byReason = {};
    for (const s of skipped) byReason[s.reason] = (byReason[s.reason] || 0) + 1;
    for (const [reason, n] of Object.entries(byReason)) {
      console.log(`     · ${n} × ${reason}`);
    }
  }

  if (!COMMIT) {
    console.log(`\n🔎 DRY-RUN terminé. Aperçu des 3 premières lignes :`);
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    console.log(`\n➡️  Relance avec --commit pour écrire dans Supabase.\n`);
    return;
  }

  // 5. Upsert par lots (clé recruiter_id + eod_date — idempotent)
  const CHUNK = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("recruiter_eod")
      .upsert(batch, { onConflict: "recruiter_id,eod_date" });
    if (error) throw new Error(`Upsert lot ${i}: ${error.message}`);
    written += batch.length;
    console.log(`   … ${written}/${rows.length} importés`);
  }
  console.log(`\n🎉 Import terminé : ${written} EOD dans recruiter_eod.\n`);
}

main().catch((e) => {
  console.error("\n💥", e.message, "\n");
  process.exit(1);
});
