import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CSVRow {
  company_name?: string;
  nom_entreprise?: string;
  entreprise?: string;
  contact_name?: string;
  nom_contact?: string;
  contact?: string;
  contact_email?: string;
  email?: string;
  courriel?: string;
  contact_phone?: string;
  telephone?: string;
  phone?: string;
  last_mandate_date?: string;
  dernier_mandat?: string;
  last_mandate_role?: string;
  role?: string;
  last_mandate_value?: string;
  fee?: string;
  value?: string;
  owner?: string;
  assigned?: string;
  segment?: string;
  notes?: string;
}

interface ReactivationEntry {
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  last_mandate_date: string | null;
  last_mandate_role: string | null;
  last_mandate_value: number | null;
  segment: 'hot' | 'warm' | 'cold';
  owner: string | null;
  notes: string | null;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/"/g, '').replace(/\s+/g, '_'));

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const row: Record<string, string> = {};
    header.forEach((key, idx) => {
      row[key] = values[idx]?.trim().replace(/^"|"$/g, '') ?? '';
    });
    rows.push(row as CSVRow);
  }
  return rows;
}

// Simple CSV parser handling quoted fields with commas
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

function segmentFromDate(dateStr: string | null): 'hot' | 'warm' | 'cold' {
  if (!dateStr) return 'cold';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'cold';
  const monthsAgo =
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo <= 12) return 'hot';
  if (monthsAgo <= 36) return 'warm';
  return 'cold';
}

function parseDate(s: string | undefined): string | null {
  if (!s || !s.trim()) return null;
  // Try multiple formats
  const cleaned = s.trim();

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return cleaned.substring(0, 10);

  // DD/MM/YYYY or MM/DD/YYYY
  const m = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, a, b, year] = m;
    if (year.length === 2) year = `20${year}`;
    // Assume DD/MM/YYYY (Quebec) if day <= 31 and month <= 12 both possible
    const day = a.padStart(2, '0');
    const month = b.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try Date parsing as fallback
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return null;
}

function parseNumber(s: string | undefined): number | null {
  if (!s || !s.trim()) return null;
  const cleaned = s.replace(/[$\s,]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function normalizeRow(row: CSVRow): ReactivationEntry | null {
  const companyName =
    row.company_name ?? row.nom_entreprise ?? row.entreprise ?? '';
  if (!companyName || !companyName.trim()) return null;

  const lastMandateDate = parseDate(
    row.last_mandate_date ?? row.dernier_mandat
  );

  // Use provided segment if valid, otherwise compute from date
  let segment: 'hot' | 'warm' | 'cold' = segmentFromDate(lastMandateDate);
  const providedSegment = row.segment?.toLowerCase();
  if (
    providedSegment === 'hot' ||
    providedSegment === 'warm' ||
    providedSegment === 'cold'
  ) {
    segment = providedSegment;
  }

  return {
    company_name: companyName.trim(),
    contact_name:
      row.contact_name?.trim() ??
      row.nom_contact?.trim() ??
      row.contact?.trim() ??
      null,
    contact_email:
      row.contact_email?.trim() ??
      row.email?.trim() ??
      row.courriel?.trim() ??
      null,
    contact_phone:
      row.contact_phone?.trim() ??
      row.telephone?.trim() ??
      row.phone?.trim() ??
      null,
    last_mandate_date: lastMandateDate,
    last_mandate_role:
      row.last_mandate_role?.trim() ?? row.role?.trim() ?? null,
    last_mandate_value: parseNumber(
      row.last_mandate_value ?? row.fee ?? row.value
    ),
    segment,
    owner: row.owner?.trim() ?? row.assigned?.trim() ?? null,
    notes: row.notes?.trim() ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const csvText: string = body.csv;
    const defaultOwner: string | undefined = body.default_owner;

    if (!csvText) {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawRows = parseCSV(csvText);
    const normalized = rawRows
      .map(normalizeRow)
      .filter((r): r is ReactivationEntry => r !== null);

    if (normalized.length === 0) {
      return NextResponse.json(
        {
          error:
            'Aucune ligne valide trouvée. Vérifiez que le CSV a au moins une colonne company_name / nom_entreprise.',
        },
        { status: 400 }
      );
    }

    // Auto-assign default owner per segment if not provided
    const withOwners = normalized.map((r) => {
      if (r.owner) return r;
      const autoOwner = defaultOwner ?? (
        r.segment === 'hot' ? 'Oli' :
        r.segment === 'warm' ? 'Steph' :
        'Steph'
      );
      return { ...r, owner: autoOwner };
    });

    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < withOwners.length; i += batchSize) {
      const batch = withOwners.slice(i, i + batchSize);
      const { error } = await supabase.from('reactivation_campaigns').insert(batch);
      if (error) {
        errors.push(`Batch ${i}-${i + batch.length}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    // Compute stats
    const stats = {
      total_parsed: rawRows.length,
      total_valid: normalized.length,
      total_inserted: inserted,
      hot: withOwners.filter((r) => r.segment === 'hot').length,
      warm: withOwners.filter((r) => r.segment === 'warm').length,
      cold: withOwners.filter((r) => r.segment === 'cold').length,
      with_email: withOwners.filter((r) => r.contact_email).length,
      with_phone: withOwners.filter((r) => r.contact_phone).length,
      errors,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
