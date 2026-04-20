import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const NOTIFICATION_RECIPIENTS = ['marcantoine.cote@aimiorecrutement.com'];

interface NotifyRequest {
  mandate_id: string;
  title: string;
  company_id: string;
  urgency?: string;
  salary_max?: string | number | null;
}

export async function POST(request: Request) {
  try {
    const body: NotifyRequest = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get full mandate + company info
    const { data: mandate } = await supabase
      .from('mandates')
      .select('*, companies(name, contact_name, contact_email)')
      .eq('id', body.mandate_id)
      .single();

    if (!resendApiKey || !mandate) {
      return NextResponse.json({ warning: 'Notification skipped' });
    }

    const company = (mandate as { companies?: { name?: string; contact_name?: string; contact_email?: string } }).companies;
    const urgencyEmoji =
      body.urgency === 'urgent' ? '🔥🔥🔥 URGENT — ' :
      body.urgency === 'priority' ? '⚡ Prioritaire — ' : '';

    const emailBody = `
<h2>${urgencyEmoji}Nouveau mandat soumis par ${company?.name ?? 'client'}</h2>

<table style="font-family: sans-serif; border-collapse: collapse; width: 100%; margin-bottom: 16px;">
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Poste :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.title}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Département :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${mandate.department ?? 'N/A'}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Salaire :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${mandate.salary_min ?? '?'} - $${mandate.salary_max ?? '?'}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Localisation :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${mandate.location ?? 'N/A'}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Mode :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${mandate.work_mode ?? 'N/A'}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Contact client :</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${company?.contact_name ?? '?'} (${company?.contact_email ?? '?'})</td></tr>
</table>

<h3>Description :</h3>
<p style="background: #f5f5f5; padding: 12px; border-radius: 8px; white-space: pre-line;">${mandate.description ?? 'N/A'}</p>

<p style="margin-top: 20px;">
  <a href="https://aimio-client-portal.vercel.app/admin/mandates" style="background: #6C2BD9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
    Voir dans Admin
  </a>
</p>

<hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
<p style="color: #999; font-size: 12px;">⏰ Rappel : confirme la réception au client sous 4 heures · Premier shortlist sous 5-7 jours</p>
    `.trim();

    const subject = `${urgencyEmoji}Nouveau mandat — ${body.title} chez ${company?.name ?? 'client'}`;

    await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Aimio Portal <noreply@send.aimiorecrutement.com>',
        to: NOTIFICATION_RECIPIENTS,
        reply_to: company?.contact_email ?? undefined,
        subject,
        html: emailBody,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notify new mandate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Notification failed' },
      { status: 500 }
    );
  }
}
