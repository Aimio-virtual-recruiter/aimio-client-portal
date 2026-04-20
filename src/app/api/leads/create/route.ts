import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const NOTIFICATION_RECIPIENTS = [
  'marcantoine.cote@aimiorecrutement.com',
  // Add William + Jim emails here when known
];

interface LeadRequest {
  name: string;
  email: string;
  company?: string;
  country?: string;
  role?: string;
  team_size?: string;
  active_mandates?: string;
  hiring_for?: string;
  message?: string;
  source?: string;
}

export async function POST(request: Request) {
  try {
    const body: LeadRequest = await request.json();

    // Validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Anti-cannibalization: block Quebec leads from Recruteur Virtuel
    const isQuebec =
      body.country?.toLowerCase().includes('quebec') ||
      body.country?.toLowerCase().includes('québec') ||
      body.country?.toLowerCase().includes('qc') ||
      body.email.toLowerCase().endsWith('.gouv.qc.ca');

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        country: body.country ?? null,
        role: body.role ?? null,
        team_size: body.team_size ?? null,
        active_mandates: body.active_mandates ?? null,
        hiring_for: body.hiring_for ?? null,
        message: body.message ?? null,
        source: body.source ?? 'landing',
        is_quebec_lead: isQuebec,
        status: isQuebec ? 'redirect_to_aimio_recrutement' : 'new',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      // Don't fail the request — still notify by email if DB fails
    }

    // Send notification email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const emailBody = `
<h2>${isQuebec ? '⚠️ Quebec Lead (à rediriger vers Aimio Recrutement)' : '🎯 New Recruteur Virtuel IA Lead'}</h2>

<table style="font-family: sans-serif; border-collapse: collapse; width: 100%;">
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.name}</td></tr>
  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${body.email}">${body.email}</a></td></tr>
  ${body.company ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.company}</td></tr>` : ''}
  ${body.role ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Role:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.role}</td></tr>` : ''}
  ${body.country ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Country:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.country}</td></tr>` : ''}
  ${body.team_size ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Team size:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.team_size}</td></tr>` : ''}
  ${body.active_mandates ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Active mandates:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.active_mandates}</td></tr>` : ''}
  ${body.hiring_for ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Hiring for:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${body.hiring_for}</td></tr>` : ''}
</table>

${body.message ? `<h3>Message:</h3><p style="background: #f5f5f5; padding: 12px; border-radius: 8px;">${body.message}</p>` : ''}

<p style="margin-top: 20px;"><a href="mailto:${body.email}?subject=RE: Aimio Recruteur Virtuel IA" style="background: #6C2BD9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Reply to ${body.name}</a></p>

<hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
<p style="color: #999; font-size: 12px;">Lead source: ${body.source ?? 'landing'} · ID: ${lead?.id ?? 'unsaved'}</p>
      `.trim();

      const subject = isQuebec
        ? `⚠️ Quebec Lead — ${body.name} (${body.company ?? 'no company'})`
        : `🎯 New Recruteur Virtuel Lead — ${body.name} (${body.company ?? 'no company'})`;

      try {
        await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Aimio Leads <noreply@send.aimiorecrutement.com>',
            to: NOTIFICATION_RECIPIENTS,
            reply_to: body.email,
            subject,
            html: emailBody,
          }),
        });
      } catch (emailError) {
        console.error('Resend notification error:', emailError);
        // Continue — lead is saved even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      lead_id: lead?.id ?? null,
      is_quebec_lead: isQuebec,
      message: isQuebec
        ? 'Thank you. Since you are based in Quebec, our local agency Aimio Recrutement will contact you shortly with a tailored solution.'
        : "Thank you! We will contact you within 24 hours to schedule your demo.",
    });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create lead',
      },
      { status: 500 }
    );
  }
}
