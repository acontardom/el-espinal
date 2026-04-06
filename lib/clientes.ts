'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Client = {
  id: string
  name: string
  rut: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export type ClientWithStats = Client & {
  project_count: number
}

export type ClientWithProjects = Client & {
  projects: {
    id: string
    code: string
    name: string
    type: string
    status: string
    contract_amount: number | null
    start_date: string | null
    end_date: string | null
  }[]
}

export type ClientInput = {
  name: string
  rut?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  notes?: string | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getClients(): Promise<ClientWithStats[]> {
  const supabase = await createClient()

  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('projects').select('id, client_id'),
  ])

  if (clientsRes.error) throw new Error(clientsRes.error.message)

  const countByClient = new Map<string, number>()
  for (const p of projectsRes.data ?? []) {
    if (p.client_id) {
      countByClient.set(p.client_id, (countByClient.get(p.client_id) ?? 0) + 1)
    }
  }

  return (clientsRes.data ?? []).map((c) => ({
    ...c,
    project_count: countByClient.get(c.id) ?? 0,
  }))
}

export async function getClient(id: string): Promise<ClientWithProjects | null> {
  const supabase = await createClient()

  const [clientRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('projects')
      .select('id, code, name, type, status, contract_amount, start_date, end_date')
      .eq('client_id', id)
      .order('start_date', { ascending: false }),
  ])

  if (clientRes.error || !clientRes.data) return null

  return {
    ...clientRes.data,
    projects: projectsRes.data ?? [],
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createClientRecord(
  input: ClientInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').insert([input])
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return {}
}

export async function updateClientRecord(
  id: string,
  input: ClientInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return {}
}
