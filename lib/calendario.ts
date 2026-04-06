'use server'

import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarMachine = {
  id: string
  code: string
  name: string
  type: string
}

export type CalendarAssignment = {
  id: string
  machine_id: string
  project_id: string
  start_date: string
  end_date: string | null
  hourly_rate: number | null
  daily_rate: number | null
  project: {
    id: string
    code: string
    name: string
    status: string
    client: { name: string } | null
  } | null
}

export type CalendarioData = {
  machines: CalendarMachine[]
  assignments: CalendarAssignment[]
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getCalendarioData(
  month: number,
  year: number
): Promise<CalendarioData> {
  const supabase = await createClient()

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const daysInMonth = new Date(year, month, 0).getDate()
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const [machinesRes, assignmentsRes] = await Promise.all([
    supabase
      .from('machines')
      .select('id, code, name, type')
      .eq('status', 'activo')
      .order('code'),

    supabase
      .from('project_machines')
      .select(
        `id, machine_id, project_id, start_date, end_date, hourly_rate, daily_rate,
         project:projects(id, code, name, status, client:clients(name))`
      )
      .lte('start_date', lastDay)
      .or(`end_date.gte.${firstDay},end_date.is.null`),
  ])

  if (machinesRes.error) throw new Error(machinesRes.error.message)

  return {
    machines: (machinesRes.data ?? []) as CalendarMachine[],
    assignments: (assignmentsRes.data ?? []) as unknown as CalendarAssignment[],
  }
}
