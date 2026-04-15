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

// API Functions
const DEMO_COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export async function getCompany() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', DEMO_COMPANY_ID)
    .single()
  if (error) throw error
  return data as Company
}

export async function getMandates() {
  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('company_id', DEMO_COMPANY_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
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
    .from('candidates')
    .select('*')
    .eq('mandate_id', mandateId)
    .order('score', { ascending: false })
  if (error) throw error
  return data as Candidate[]
}

export async function getAllCandidates() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('company_id', DEMO_COMPANY_ID)
    .order('delivered_at', { ascending: false })
  if (error) throw error
  return data as Candidate[]
}

export async function getCandidate(id: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Candidate
}

export async function updateCandidateFeedback(id: string, status: string, reason?: string) {
  const { error } = await supabase
    .from('candidates')
    .update({
      status,
      feedback_reason: reason || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('company_id', DEMO_COMPANY_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Report[]
}

export async function getMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('company_id', DEMO_COMPANY_ID)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Message[]
}

export async function sendMessage(content: string, senderName: string) {
  const { error } = await supabase
    .from('messages')
    .insert({
      company_id: DEMO_COMPANY_ID,
      sender_type: 'client',
      sender_name: senderName,
      content,
    })
  if (error) throw error
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('company_id', DEMO_COMPANY_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Notification[]
}

// Subscribe to real-time changes
export function subscribeToNewCandidates(callback: (candidate: Candidate) => void) {
  return supabase
    .channel('new-candidates')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'candidates',
        filter: `company_id=eq.${DEMO_COMPANY_ID}`,
      },
      (payload) => callback(payload.new as Candidate)
    )
    .subscribe()
}

export function subscribeToMessages(callback: (message: Message) => void) {
  return supabase
    .channel('new-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `company_id=eq.${DEMO_COMPANY_ID}`,
      },
      (payload) => callback(payload.new as Message)
    )
    .subscribe()
}
