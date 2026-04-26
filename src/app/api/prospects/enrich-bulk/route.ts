import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';

export const maxDuration = 300;

interface BulkEnrichRequest {
  limit?: number;
  only_without_email?: boolean;
}

/**
 * Bulk enrichment — enrich N prospects missing email/phone via waterfall.
 * Usage: trigger manually from admin, or via cron daily.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const body: BulkEnrichRequest = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit ?? 50, 200);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find prospects missing email or phone
    let query = supabase
      .from('prospects')
      .select('id')
      .not('status', 'in', '(customer,do_not_contact)')
      .limit(limit);

    if (body.only_without_email !== false) {
      query = query.or('email.is.null,phone.is.null');
    }

    const { data: prospects, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No prospects need enrichment',
        processed: 0,
        emails_found: 0,
        phones_found: 0,
      });
    }

    // Process each prospect by calling the waterfall endpoint internally
    const baseUrl = new URL(request.url).origin;
    let emailsFound = 0;
    let phonesFound = 0;
    const errors: string[] = [];

    for (const p of prospects) {
      try {
        const res = await fetch(`${baseUrl}/api/prospects/enrich-waterfall`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect_id: p.id }),
        });
        const result = await res.json();
        if (result.found_email) emailsFound++;
        if (result.found_phone) phonesFound++;
      } catch (err) {
        errors.push(`${p.id}: ${err instanceof Error ? err.message : 'error'}`);
      }

      // Rate limiting — avoid hammering external APIs
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return NextResponse.json({
      success: true,
      processed: prospects.length,
      emails_found: emailsFound,
      phones_found: phonesFound,
      success_rate: prospects.length > 0 ? Math.round(((emailsFound + phonesFound) / (prospects.length * 2)) * 100) : 0,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('Bulk enrich error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
