'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { getUrgency, type Urgency } from './urgency'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaintenanceStatus = 'programada' | 'realizada' | 'vencida'

export type Maintenance = {
  id: string
  machine_id: string
  type: string
  description: string | null
  status: MaintenanceStatus
  scheduled_date: string | null
  scheduled_hours: number | null
  done_date: string | null
  done_hours: number | null
  cost: number | null
  provider: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  machine: {
    id: string
    code: string
    name: string
    current_hours: number | null
    maintenance_interval_hours: number | null
    last_maintenance_hours: number | null
  } | null
}

export type MaintenanceInput = {
  machine_id: string
  type: string
  description?: string | null
  scheduled_date?: string | null
  scheduled_hours?: number | null
  provider?: string | null
  notes?: string | null
}

export type CompleteInput = {
  done_date: string
  done_hours: number
  cost?: number | null
  provider?: string | null
  notes?: string | null
}

export type MachineOption = {
  id: string
  code: string
  name: string
  current_hours: number | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const machineSelect = `
  machine:machines(id, code, name, current_hours, maintenance_interval_hours, last_maintenance_hours)
`

export async function getPendingMaintenances(): Promise<Maintenance[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maintenances')
    .select(`id, machine_id, type, description, status, scheduled_date,
             scheduled_hours, done_date, done_hours, cost, provider, notes,
             created_by, created_at, ${machineSelect}`)
    .in('status', ['programada', 'vencida'])
    .order('scheduled_date', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)

  // Sort client-side by urgency: rojo → amarillo → verde
  const urgencyOrder: Record<Urgency, number> = { rojo: 0, amarillo: 1, verde: 2 }
  return ((data ?? []) as Maintenance[]).sort(
    (a, b) => urgencyOrder[getUrgency(a)] - urgencyOrder[getUrgency(b)]
  )
}

export async function getMaintenances(): Promise<Maintenance[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maintenances')
    .select(`id, machine_id, type, description, status, scheduled_date,
             scheduled_hours, done_date, done_hours, cost, provider, notes,
             created_by, created_at, ${machineSelect}`)
    .eq('status', 'realizada')
    .order('done_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Maintenance[]
}

export async function getMachinesForMantencion(): Promise<MachineOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('id, code, name, current_hours')
    .eq('status', 'activo')
    .order('code')
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createMaintenance(
  input: MaintenanceInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa.' }

  const { error } = await supabase
    .from('maintenances')
    .insert([{ ...input, status: 'programada', created_by: user.id }])

  if (error) return { error: error.message }
  revalidatePath('/mantenciones')
  return {}
}

export async function completeMaintenance(
  id: string,
  machineId: string,
  input: CompleteInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('maintenances')
    .update({
      status: 'realizada',
      done_date: input.done_date,
      done_hours: input.done_hours,
      cost: input.cost ?? null,
      provider: input.provider || null,
      notes: input.notes || null,
    })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  // Actualizar last_maintenance_hours en la máquina
  await supabase
    .from('machines')
    .update({ last_maintenance_hours: input.done_hours })
    .eq('id', machineId)

  revalidatePath('/mantenciones')
  return {}
}

export async function checkOverdueMaintenances(): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Traer todas las programadas para comparar
  const { data } = await supabase
    .from('maintenances')
    .select('id, scheduled_date, scheduled_hours, machine:machines(current_hours)')
    .eq('status', 'programada')

  if (!data || data.length === 0) return

  const overdueIds = data
    .filter((m) => {
      const byDate = m.scheduled_date && m.scheduled_date < today
      const currentHours = (m.machine as { current_hours: number | null } | null)?.current_hours ?? 0
      const byHours = m.scheduled_hours != null && currentHours >= m.scheduled_hours
      return byDate || byHours
    })
    .map((m) => m.id)

  if (overdueIds.length === 0) return

  await supabase
    .from('maintenances')
    .update({ status: 'vencida' })
    .in('id', overdueIds)
}
