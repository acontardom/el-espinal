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
  invoice_image_url: string | null
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
  invoice_image_url?: string | null
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
       price_per_liter, supplier, invoice_number, invoice_image_url, notes, created_by, created_at,
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

  // Insertar movimiento y obtener ID para notificación
  const { data: newMovement, error: insertError } = await supabase
    .from('tank_movements')
    .insert([{ ...input, created_by: user.id }])
    .select('id')
    .single()

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

export type FuelActivity = {
  litrosCargados: number
  litrosDescargados: number
  movimientos: TankMovement[]
}

export async function getMyFuelActivity(userId: string): Promise<FuelActivity> {
  const supabase = await createClient()
  const now = new Date()
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const [monthRes, recentRes] = await Promise.all([
    supabase
      .from('tank_movements')
      .select('type, liters')
      .eq('created_by', userId)
      .gte('movement_date', firstDay)
      .lte('movement_date', lastDayStr),
    supabase
      .from('tank_movements')
      .select(
        `id, type, tank_id, machine_id, movement_date, liters, meter_reading,
         price_per_liter, supplier, invoice_number, invoice_image_url, notes, created_by, created_at,
         tank:tanks(id, code, name),
         machine:machines(id, code, name)`
      )
      .eq('created_by', userId)
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const monthMovements = monthRes.data ?? []
  const litrosCargados = monthMovements
    .filter((m) => m.type === 'carga')
    .reduce((sum, m) => sum + (m.liters ?? 0), 0)
  const litrosDescargados = monthMovements
    .filter((m) => m.type === 'descarga')
    .reduce((sum, m) => sum + (m.liters ?? 0), 0)

  return {
    litrosCargados,
    litrosDescargados,
    movimientos: (recentRes.data ?? []) as unknown as TankMovement[],
  }
}

export async function getMisMovimientos(
  userId: string,
  limit = 5
): Promise<TankMovement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tank_movements')
    .select(
      `id, type, tank_id, machine_id, movement_date, liters, meter_reading,
       price_per_liter, supplier, invoice_number, invoice_image_url, notes, created_by, created_at,
       tank:tanks(id, code, name),
       machine:machines(id, code, name)`
    )
    .eq('created_by', userId)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TankMovement[]
}

// ─── Direct fuel entries ──────────────────────────────────────────────────────
// Tabla: direct_fuel_entries (id, machine_id, entry_date, liters,
//   invoice_image_url, notes, created_by, created_at)

export type DirectFuelEntryInput = {
  machine_id: string
  entry_date: string
  liters: number
  invoice_image_url?: string | null
  notes?: string | null
}

export type DirectFuelEntry = {
  id: string
  machine_id: string
  entry_date: string
  liters: number
  invoice_image_url: string | null
  created_by: string | null
  created_at: string
  machine: { id: string; code: string; name: string } | null
}

export async function createDirectFuelEntry(
  input: DirectFuelEntryInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa.' }
  const { error } = await supabase
    .from('direct_fuel_entries')
    .insert([{ ...input, created_by: user.id }])
  if (error) return { error: error.message }
  return {}
}

export async function getDirectFuelEntries(
  month: number,
  year: number
): Promise<DirectFuelEntry[]> {
  const supabase = await createClient()
  const desde = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const hasta = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('direct_fuel_entries')
    .select('*, machine:machines(id, code, name)')
    .gte('entry_date', desde)
    .lte('entry_date', hasta)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as DirectFuelEntry[]
}

// ─── Unified movements ────────────────────────────────────────────────────────

export type UnifiedMovement = {
  id: string
  source: 'tank' | 'direct'
  date: string
  type: 'carga' | 'descarga' | 'directa'
  tank: { id: string; code: string; name: string } | null
  machine: { id: string; code: string; name: string } | null
  liters: number
  invoice_image_url: string | null
  created_at: string
}

export async function getMovementsUnified(
  month: number,
  year: number
): Promise<UnifiedMovement[]> {
  const supabase = await createClient()
  const desde = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const hasta = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [tankRes, directRes] = await Promise.all([
    supabase
      .from('tank_movements')
      .select(
        `id, type, movement_date, liters, invoice_image_url, created_at,
         tank:tanks(id, code, name), machine:machines(id, code, name)`
      )
      .gte('movement_date', desde)
      .lte('movement_date', hasta),
    supabase
      .from('direct_fuel_entries')
      .select(`id, entry_date, liters, invoice_image_url, created_at,
               machine:machines(id, code, name)`)
      .gte('entry_date', desde)
      .lte('entry_date', hasta),
  ])

  if (tankRes.error) throw new Error(tankRes.error.message)
  if (directRes.error) throw new Error(directRes.error.message)

  const tankMapped: UnifiedMovement[] = ((tankRes.data ?? []) as unknown as {
    id: string; type: string; movement_date: string; liters: number
    invoice_image_url: string | null; created_at: string
    tank: { id: string; code: string; name: string } | null
    machine: { id: string; code: string; name: string } | null
  }[]).map((m) => ({
    id: m.id,
    source: 'tank' as const,
    date: m.movement_date,
    type: m.type as 'carga' | 'descarga',
    tank: m.tank ?? null,
    machine: m.machine ?? null,
    liters: m.liters,
    invoice_image_url: m.invoice_image_url ?? null,
    created_at: m.created_at,
  }))

  const directMapped: UnifiedMovement[] = ((directRes.data ?? []) as unknown as {
    id: string; entry_date: string; liters: number
    invoice_image_url: string | null; created_at: string
    machine: { id: string; code: string; name: string } | null
  }[]).map((m) => ({
    id: m.id,
    source: 'direct' as const,
    date: m.entry_date,
    type: 'directa' as const,
    tank: null,
    machine: m.machine ?? null,
    liters: m.liters,
    invoice_image_url: m.invoice_image_url ?? null,
    created_at: m.created_at,
  }))

  return [...tankMapped, ...directMapped].sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : b.created_at.localeCompare(a.created_at)
  })
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
