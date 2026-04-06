'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

export type MachineStatus = 'activo' | 'inactivo' | 'en_mantencion'

export type Machine = {
  id: string
  code: string
  name: string
  type: string
  brand: string | null
  model: string | null
  year: number | null
  status: MachineStatus
  current_hours: number | null
  maintenance_interval_hours: number | null
  last_maintenance_hours: number | null
  notes: string | null
  created_at: string
}

export type MachineInput = {
  code: string
  name: string
  type: string
  brand?: string | null
  model?: string | null
  year?: number | null
  status: MachineStatus
  current_hours?: number | null
  maintenance_interval_hours?: number | null
  last_maintenance_hours?: number | null
  notes?: string | null
}

export async function getMachines(): Promise<Machine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('code')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createMachine(
  input: MachineInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('machines').insert([input])

  if (error) return { error: error.message }

  revalidatePath('/maquinaria')
  return {}
}

export async function updateMachine(
  id: string,
  input: MachineInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('machines')
    .update(input)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/maquinaria')
  return {}
}
