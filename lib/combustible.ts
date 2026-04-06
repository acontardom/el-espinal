'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TankStatus = 'activo' | 'inactivo'

export type Tank = {
  id: string
  code: string
  name: string
  capacity_liters: number | null
  current_liters: number
  status: TankStatus
  notes: string | null
  created_at: string
}

export type MovementType = 'carga' | 'descarga'

export type TankMovement = {
  id: string
  type: MovementType
  tank_id: string
  machine_id: string | null
  movement_date: string
  liters: number
  meter_reading: number | null
  price_per_liter: number | null
  supplier: string | null
  invoice_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  tank: { id: string; code: string; name: string } | null
  machine: { id: string; code: string; name: string } | null
}

export type TankInput = {
  code: string
  name: string
  capacity_liters?: number | null
  current_liters?: number | null
  status: TankStatus
  notes?: string | null
}

export type MovementInput = {
  type: MovementType
  tank_id: string
  machine_id?: string | null
  movement_date: string
  liters: number
  meter_reading?: number | null
  price_per_liter?: number | null
  supplier?: string | null
  invoice_number?: string | null
  notes?: string | null
}

export type MachineOption = {
  id: string
  code: string
  name: string
}

// ─── Tanks ────────────────────────────────────────────────────────────────────

export async function getTanks(): Promise<Tank[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tanks')
    .select('*')
    .order('code')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTank(input: TankInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('tanks').insert([input])
  if (error) return { error: error.message }
  revalidatePath('/combustible')
  return {}
}

export async function updateTank(
  id: string,
  input: TankInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('tanks').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/combustible')
  return {}
}

// ─── Movements ────────────────────────────────────────────────────────────────

export async function getMovements(
  month: number,
  year: number
): Promise<TankMovement[]> {
  const supabase = await createClient()

  const desde = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const hasta = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('tank_movements')
    .select(
      `id, type, tank_id, machine_id, movement_date, liters, meter_reading,
       price_per_liter, supplier, invoice_number, notes, created_by, created_at,
       tank:tanks(id, code, name),
       machine:machines(id, code, name)`
    )
    .gte('movement_date', desde)
    .lte('movement_date', hasta)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TankMovement[]
}

export async function createMovement(
  input: MovementInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa.' }

  // Insertar movimiento
  const { error: insertError } = await supabase
    .from('tank_movements')
    .insert([{ ...input, created_by: user.id }])

  if (insertError) return { error: insertError.message }

  // Actualizar stock del estanque
  const { data: tank } = await supabase
    .from('tanks')
    .select('current_liters')
    .eq('id', input.tank_id)
    .single()

  if (tank) {
    const newLiters =
      input.type === 'carga'
        ? (tank.current_liters ?? 0) + input.liters
        : Math.max(0, (tank.current_liters ?? 0) - input.liters)

    await supabase
      .from('tanks')
      .update({ current_liters: newLiters })
      .eq('id', input.tank_id)
  }

  revalidatePath('/combustible')
  return {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function getMachinesForCombustible(): Promise<MachineOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('id, code, name')
    .eq('status', 'activo')
    .order('code')
  if (error) throw new Error(error.message)
  return data ?? []
}
