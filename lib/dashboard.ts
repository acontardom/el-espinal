import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FleetMachine = {
  id: string
  code: string
  name: string
  current_hours: number | null
  nextMaintenance: {
    id: string
    type: string
    scheduled_date: string | null
    scheduled_hours: number | null
    status: 'programada' | 'vencida'
  } | null
}

export type FuelMovement = {
  id: string
  type: 'carga' | 'descarga'
  movement_date: string
  liters: number
  tank: { code: string; name: string } | null
}

export type HorometroReport = {
  id: string
  reported_date: string
  hours_reading: number
  machine: { code: string; name: string } | null
  operator: { full_name: string | null } | null
}

export type DashboardData = {
  kpi: {
    activeFleet: number
    pendingMaintenances: number
    overdueMaintenances: number
    totalFuelLiters: number
  }
  fleet: FleetMachine[]
  lastFuelMovements: FuelMovement[]
  lastHorometros: HorometroReport[]
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const [
    machinesRes,
    pendingMaintRes,
    overdueMaintRes,
    tanksRes,
    fleetMaintRes,
    fuelMovRes,
    horometrosRes,
  ] = await Promise.all([
    // Active fleet count
    supabase
      .from('machines')
      .select('id, code, name, current_hours', { count: 'exact' })
      .eq('status', 'activo'),

    // Pending maintenances count
    supabase
      .from('maintenances')
      .select('id', { count: 'exact' })
      .eq('status', 'programada'),

    // Overdue maintenances count
    supabase
      .from('maintenances')
      .select('id', { count: 'exact' })
      .eq('status', 'vencida'),

    // Active tanks stock
    supabase
      .from('tanks')
      .select('current_liters')
      .eq('status', 'activo'),

    // Pending/overdue maintenances for fleet table
    supabase
      .from('maintenances')
      .select('id, machine_id, type, scheduled_date, scheduled_hours, status')
      .in('status', ['programada', 'vencida'])
      .order('scheduled_date', { ascending: true, nullsFirst: false }),

    // Last 5 fuel movements
    supabase
      .from('tank_movements')
      .select('id, type, movement_date, liters, tank:tanks(code, name)')
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),

    // Last 5 hourly reports
    supabase
      .from('hourly_reports')
      .select(
        'id, reported_date, hours_reading, machine:machines(code, name), operator:profiles(full_name)'
      )
      .order('reported_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // KPIs
  const totalFuel = (tanksRes.data ?? []).reduce(
    (sum, t) => sum + (t.current_liters ?? 0),
    0
  )

  // Fleet table: active machines + their next maintenance
  const machines = machinesRes.data ?? []
  const pendingByMachine = new Map<string, (typeof fleetMaintRes.data)[number]>()
  for (const m of fleetMaintRes.data ?? []) {
    if (!pendingByMachine.has(m.machine_id)) {
      pendingByMachine.set(m.machine_id, m)
    }
  }

  const fleet: FleetMachine[] = machines.map((m) => {
    const maint = pendingByMachine.get(m.id) ?? null
    return {
      id: m.id,
      code: m.code,
      name: m.name,
      current_hours: m.current_hours,
      nextMaintenance: maint
        ? {
            id: maint.id,
            type: maint.type,
            scheduled_date: maint.scheduled_date,
            scheduled_hours: maint.scheduled_hours,
            status: maint.status as 'programada' | 'vencida',
          }
        : null,
    }
  })

  return {
    kpi: {
      activeFleet: machinesRes.count ?? 0,
      pendingMaintenances: pendingMaintRes.count ?? 0,
      overdueMaintenances: overdueMaintRes.count ?? 0,
      totalFuelLiters: totalFuel,
    },
    fleet,
    lastFuelMovements: (fuelMovRes.data ?? []) as FuelMovement[],
    lastHorometros: (horometrosRes.data ?? []) as HorometroReport[],
  }
}
