import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Company {
  id: string
  name: string
  industry: string
  plan: string
  mrr: number
  contact_name: string
  contact_email: string
  created_at: string
}

export interface Mandate {
  id: string
  company_id: string
  title: string
  department: string
  description: string
  salary_min: number
  salary_max: number
  location: string
  work_mode: string
  status: string
  scoring_criteria: object[]
  candidates_delivered: number
  created_at: string
  candidates?: Candidate[]
}

export interface Candidate {
  id: string
  mandate_id: string
  company_id: string
  name: string
  current_title: string
  current_company: string
  location: string
  experience_years: number
  education: string
  languages: string[]
  career_history: CareerEntry[]
  score: number
  score_details: ScoreDetail[]
  strengths: string[]
  concerns: string[]
  motivation: string
  availability: string
  salary_expectations: string
  status: string
  internal_status: string
  internal_notes: string | null
  approved_by: string | null
  approved_at: string | null
  feedback_reason: string | null
  delivered_at: string
  created_at: string
}

export interface ScoreDetail {
  criteria: string
  score: number
  weight: number
}

export interface CareerEntry {
  title: string
  company: string
  period: string
}

export interface Report {
  id: string
  company_id: string
  mandate_id: string
  week: string
  profiles_sourced: number
  candidates_approached: number
  responses_received: number
  candidates_qualified: number
  candidates_delivered: number
  market_salary_median: number
  market_availability: string
  recommendations: string[]
  created_at: string
}

export interface Message {
  id: string
  company_id: string
  sender_type: 'client' | 'aimio'
  sender_name: string
  content: string
  read_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  company_id: string
  type: string
  title: string
  body: string
  read: boolean
  link: string
  created_at: string
}

/**
 * Resolves the current authenticated user's tenant client_id.
 * - For client users: returns profiles.client_company_id
 * - For admin users: returns the first client (or null — admins should pick one explicitly)
 * - For recruiters: returns the first assigned_client_id
 *
 * Returns null if not authenticated or no tenant link.
 * Throws never — callers should handle null gracefully.
 */
export async function getCurrentClientId(): Promise<string | null> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_company_id, assigned_client_ids')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  if (profile.role === 'client') return profile.client_company_id || null
  if (profile.role === 'recruiter') return profile.assigned_client_ids?.[0] || null
  // admin — fall through, no implicit tenant
  return profile.client_company_id || null
}

export async function getCompany() {
  const clientId = await getCurrentClientId()
  if (!clientId) return null
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()
  if (error) return null
  return data as Company
}

export async function getMandates() {
  const clientId = await getCurrentClientId()
  if (!clientId) return [] as Mandate[]
  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('company_id', clientId)
    .order('created_at', { ascending: false })
  if (error) return [] as Mandate[]
  return data as Mandate[]
}

export async function getMandate(id: string) {
  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Mandate
}

export async function getCandidatesByMandate(mandateId: string) {
  const { data, error } = await supabase
    .from('sourced_candidates')
    .select('*')
    .eq('mandate_id', mandateId)
    .order('ai_score', { ascending: false, nullsFirst: false })
  if (error) return [] as unknown as Candidate[]
  return (data || []) as unknown as Candidate[]
}

export async function getAllCandidates() {
  const clientId = await getCurrentClientId()
  if (!clientId) return [] as unknown as Candidate[]
  const { data, error } = await supabase
    .from('sourced_candidates')
    .select('*')
    .eq('client_id', clientId)
    .order('delivered_at', { ascending: false, nullsFirst: false })
  if (error) return [] as unknown as Candidate[]
  return (data || []) as unknown as Candidate[]
}

export async function getCandidate(id: string) {
  const { data, error } = await supabase
    .from('sourced_candidates')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Candidate
}

export async function updateCandidateFeedback(id: string, status: string, reason?: string) {
  const { error } = await supabase
    .from('sourced_candidates')
    .update({
      status,
      client_feedback_reason: reason || null,
      client_feedback_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function getReports() {
  const clientId = await getCurrentClientId()
  if (!clientId) return [] as Report[]
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('company_id', clientId)
    .order('created_at', { ascending: false })
  if (error) return [] as Report[]
  return data as Report[]
}

export async function getMessages() {
  const clientId = await getCurrentClientId()
  if (!clientId) return [] as Message[]
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('company_id', clientId)
    .order('created_at', { ascending: true })
  if (error) return [] as Message[]
  return data as Message[]
}

export async function sendMessage(content: string, senderName: string) {
  const clientId = await getCurrentClientId()
  if (!clientId) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('messages')
    .insert({
      company_id: clientId,
      sender_type: 'client',
      sender_name: senderName,
      content,
    })
  if (error) throw error
}

export async function getNotifications() {
  const clientId = await getCurrentClientId()
  if (!clientId) return [] as Notification[]
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('company_id', clientId)
    .order('created_at', { ascending: false })
  if (error) return [] as Notification[]
  return data as Notification[]
}

// Subscribe to real-time changes — gated by auth-resolved client id
export async function subscribeToNewCandidates(callback: (candidate: Candidate) => void) {
  const clientId = await getCurrentClientId()
  if (!clientId) return null
  return supabase
    .channel(`new-candidates:${clientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sourced_candidates',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => callback(payload.new as unknown as Candidate)
    )
    .subscribe()
}

export async function subscribeToMessages(callback: (message: Message) => void) {
  const clientId = await getCurrentClientId()
  if (!clientId) return null
  return supabase
    .channel(`new-messages:${clientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `company_id=eq.${clientId}`,
      },
      (payload) => callback(payload.new as Message)
    )
    .subscribe()
}
