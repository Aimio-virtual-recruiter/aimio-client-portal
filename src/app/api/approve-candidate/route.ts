import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { candidate_id, action, approved_by, internal_notes } = body

    if (action === 'approve') {
      const { error } = await supabase
        .from('candidates')
        .update({
          internal_status: 'approved',
          approved_by,
          approved_at: new Date().toISOString(),
          internal_notes,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', candidate_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Get candidate info for notification
      const { data: candidate } = await supabase
        .from('candidates')
        .select('*, mandates(title)')
        .eq('id', candidate_id)
        .single()

      if (candidate) {
        // Create notification for client
        await supabase.from('notifications').insert({
          company_id: candidate.company_id,
          type: 'new_candidate',
          title: 'Nouveau candidat',
          body: `${candidate.name} (${candidate.score}/10) livre pour ${candidate.mandates?.title}`,
          link: `/candidats/${candidate.id}`,
        })
      }

      return NextResponse.json({ success: true, status: 'approved' })

    } else if (action === 'reject') {
      const { error } = await supabase
        .from('candidates')
        .update({
          internal_status: 'rejected',
          internal_notes,
        })
        .eq('id', candidate_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, status: 'rejected' })

    } else if (action === 'request_changes') {
      const { error } = await supabase
        .from('candidates')
        .update({
          internal_status: 'review',
          internal_notes,
        })
        .eq('id', candidate_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, status: 'review' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Approve candidate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
