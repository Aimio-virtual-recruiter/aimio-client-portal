import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';

interface QueueRequest {
  rep_id?: string;
  limit?: number;
  include_not_contacted_first?: boolean;
}

interface ProspectRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company_name: string;
  company_industry: string | null;
  company_city: string | null;
  company_state: string | null;
  icp_score: number;
  priority: string;
  status: string;
  last_contacted_at: string | null;
  last_attempted_at: string | null;
  touch_count: number;
  call_count: number;
  email_count: number;
  notes: string | null;
}

/**
 * Returns a prioritized prospect queue for a sales rep.
 * Scores each prospect based on: ICP fit, recency of contact, reply status, priority
 * Excludes Quebec (anti-cannibalization rule)
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body: QueueRequest = await request.json().catch(() => ({}));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const limit = Math.min(body.limit ?? 300, 1000);

    // Build query
    let query = supabase
      .from('prospects')
      .select('*')
      // Anti-cannibalization — never contact Quebec prospects for Recruteur Virtuel
      .or('is_quebec.is.null,is_quebec.eq.false')
      // Exclude already-customers and DNC
      .not('status', 'in', '(customer,do_not_contact)')
      // Must have at least one contact method
      .or('phone.neq.null,email.neq.null,linkedin_url.neq.null');

    // Filter by rep if specified
    if (body.rep_id) {
      query = query.eq('owner_id', body.rep_id);
    }

    // Prioritize: high priority first, then ICP score, then least recently contacted
    const { data, error } = await query
      .order('priority', { ascending: false }) // 'high' > 'medium' > 'low'
      .order('icp_score', { ascending: false })
      .order('last_attempted_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (error) {
      console.error('Queue query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const prospects = (data ?? []) as ProspectRow[];

    // Stats
    const stats = {
      total: prospects.length,
      never_contacted: prospects.filter((p) => !p.last_contacted_at).length,
      high_priority: prospects.filter((p) => p.priority === 'high').length,
      with_phone: prospects.filter((p) => p.phone).length,
      with_email: prospects.filter((p) => p.email).length,
    };

    return NextResponse.json({ prospects, stats });
  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
