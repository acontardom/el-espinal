'use server'

import { createClient } from './supabase/server'

export type HorometroReporte = {
  id: string
  reported_date: string
  hours_reading: number
  notes: string | null
  created_at: string
  machine: { id: string; code: string; name: string } | null
  operator: { id: string; full_name: string | null } | null
}

export type MaquinaActiva = {
  id: string
  code: string
  name: string
  current_hours: number | null
}

export async function getHorometros(): Promise<HorometroReporte[]> {
  const supabase = await createClient()

  const desde = new Date()
  desde.setDate(desde.getDate() - 30)

  const { data, error } = await supabase
    .from('hourly_reports')
    .select(
      `id, reported_date, hours_reading, notes, created_at,
       machine:machines(id, code, name),
       operator:profiles(id, full_name)`
    )
    .gte('reported_date', desde.toISOString().split('T')[0])
    .order('reported_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as HorometroReporte[]
}

export async function getCumplimiento(days = 30): Promise<string[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  const desdeStr = desde.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('hourly_reports')
    .select('reported_date')
    .eq('operator_id', user.id)
    .gte('reported_date', desdeStr)

  if (error) return []
  return (data ?? []).map((r) => r.reported_date as string)
}

export type MiHorometro = {
  id: string
  reported_date: string
  hours_reading: number
  machine: { code: string; name: string } | null
}

export async function getMisHorometros(
  userId: string,
  limit = 5
): Promise<MiHorometro[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hourly_reports')
    .select('id, reported_date, hours_reading, machine:machines(code, name)')
    .eq('operator_id', userId)
    .order('reported_date', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as MiHorometro[]
}

export async function getMaquinasActivas(): Promise<MaquinaActiva[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('machines')
    .select('id, code, name, current_hours')
    .eq('status', 'activo')
    .order('code')

  if (error) throw new Error(error.message)
  return data ?? []
}
