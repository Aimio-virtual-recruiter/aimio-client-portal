import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ImportRequest {
  csv: string;
  default_owner_id?: string;
  default_priority?: string;
  default_icp_score?: number;
}

interface ProspectRow {
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
  company_state: string | null;
  company_city: string | null;
  is_quebec: boolean;
  priority: string;
  icp_score: number;
  owner_id: string | null;
  notes: string | null;
  source: string;
  status: string;
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/"/g, '').replace(/\s+/g, '_')
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.every((v) => !v.trim())) continue;

    const row: Record<string, string> = {};
    header.forEach((key, idx) => {
      row[key] = (values[idx] ?? '').trim().replace(/^"|"$/g, '');
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function normalize(
  row: Record<string, string>,
  defaults: { owner_id?: string; priority?: string; icp_score?: number }
): ProspectRow | null {
  const company =
    row.company_name ?? row.company ?? row.entreprise ?? row.organization ?? '';
  if (!company.trim()) return null;

  const firstName = row.first_name ?? row.firstname ?? row.prenom ?? '';
  const lastName = row.last_name ?? row.lastname ?? row.nom ?? '';
  const fullName = row.full_name ?? row.name ?? '';

  // If only "name" provided, split into first/last
  let resolvedFirstName = firstName;
  let resolvedLastName = lastName;
  if (!firstName && !lastName && fullName) {
    const parts = fullName.trim().split(/\s+/);
    resolvedFirstName = parts[0] ?? '';
    resolvedLastName = parts.slice(1).join(' ');
  }

  const country = row.company_country ?? row.country ?? row.pays ?? '';
  const state = row.company_state ?? row.state ?? row.province ?? '';
  const isQuebec =
    state.toLowerCase().includes('quebec') ||
    state.toLowerCase().includes('québec') ||
    state.toLowerCase() === 'qc' ||
    country.toLowerCase().includes('quebec') ||
    country.toLowerCase().includes('québec');

  return {
    first_name: resolvedFirstName || null,
    last_name: resolvedLastName || null,
    title: row.title ?? row.job_title ?? row.position ?? null,
    email: row.email ?? row.courriel ?? null,
    phone: row.phone ?? row.telephone ?? row.mobile ?? null,
    linkedin_url: row.linkedin_url ?? row.linkedin ?? null,
    company_name: company,
    company_industry: row.company_industry ?? row.industry ?? row.industrie ?? null,
    company_size: row.company_size ?? row.size ?? row.taille ?? null,
    company_country: country || null,
    company_state: state || null,
    company_city: row.company_city ?? row.city ?? row.ville ?? null,
    is_quebec: isQuebec,
    priority: row.priority ?? defaults.priority ?? 'medium',
    icp_score: parseInt(row.icp_score ?? '') || defaults.icp_score || 60,
    owner_id: row.owner_id ?? defaults.owner_id ?? null,
    notes: row.notes ?? null,
    source: 'csv_import',
    status: 'new',
  };
}

export async function POST(request: Request) {
  try {
    const body: ImportRequest = await request.json();

    if (!body.csv) {
      return NextResponse.json({ error: 'CSV content required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rows = parseCSV(body.csv);
    const normalized = rows
      .map((r) =>
        normalize(r, {
          owner_id: body.default_owner_id,
          priority: body.default_priority,
          icp_score: body.default_icp_score,
        })
      )
      .filter((r): r is ProspectRow => r !== null);

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows. Need at least company_name column.' },
        { status: 400 }
      );
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let skippedQuebec = 0;
    const errors: string[] = [];

    for (let i = 0; i < normalized.length; i += batchSize) {
      const batch = normalized.slice(i, i + batchSize);
      const { error } = await supabase.from('prospects').insert(batch);
      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    skippedQuebec = normalized.filter((r) => r.is_quebec).length;

    return NextResponse.json({
      success: true,
      stats: {
        total_parsed: rows.length,
        total_valid: normalized.length,
        total_inserted: inserted,
        with_email: normalized.filter((r) => r.email).length,
        with_phone: normalized.filter((r) => r.phone).length,
        with_linkedin: normalized.filter((r) => r.linkedin_url).length,
        flagged_quebec: skippedQuebec,
        errors,
      },
    });
  } catch (error) {
    console.error('Prospect import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
