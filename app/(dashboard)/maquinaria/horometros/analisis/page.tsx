import { createClient } from '@/lib/supabase/server'
import { AnalisisClient, type MachineStats } from './components/AnalisisClient'

// ─── Types ────────────────────────────────────────────────────────────────────

type RawMachine = {
  id: string
  code: string
  name: string
  type: string
  status: string
  daily_hours_target: number | null
}

type RawReport = {
  machine_id: string
  reported_date: string
  hours_reading: number
}

// ─── Computation ─────────────────────────────────────────────────────────────

function computeMachineStats(
  machine: RawMachine,
  allReports: RawReport[],
  periodo: number
): MachineStats {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const periodStart = new Date(today)
  periodStart.setDate(periodStart.getDate() - periodo)

  // All reports for this machine, ascending by date
  const machineReports = allReports
    .filter((r) => r.machine_id === machine.id)
    .sort((a, b) => a.reported_date.localeCompare(b.reported_date))

  // Compute worked hours per day within the period
  const dailyHours = new Map<string, number>()

  for (let i = 0; i < machineReports.length; i++) {
    const report = machineReports[i]
    const reportDate = new Date(report.reported_date + 'T00:00:00')

    // Only count reports strictly inside the period window
    if (reportDate <= periodStart || reportDate > today) continue

    // Previous report can be outside the period — that's intentional for correct delta
    const prev = i > 0 ? machineReports[i - 1] : null
    const hoursWorked = prev
      ? Math.max(0, report.hours_reading - prev.hours_reading)
      : 0

    dailyHours.set(report.reported_date, hoursWorked)
  }

  const totalHours = Array.from(dailyHours.values()).reduce((a, b) => a + b, 0)
  const activeDays = dailyHours.size
  const avgHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0

  // Last 7 calendar days series (always fixed, regardless of period)
  const last7Days: { date: string; hours: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    last7Days.push({ date: dateStr, hours: dailyHours.get(dateStr) ?? 0 })
  }

  return {
    id: machine.id,
    code: machine.code,
    name: machine.name,
    type: machine.type,
    daily_hours_target: machine.daily_hours_target ?? 10,
    totalHours,
    activeDays,
    avgHoursPerDay,
    last7Days,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchParams = Promise<{ periodo?: string }>

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const rawPeriodo = parseInt(params.periodo ?? '')
  const periodo: 7 | 30 | 90 = ([7, 30, 90] as const).includes(rawPeriodo as 7 | 30 | 90)
    ? (rawPeriodo as 7 | 30 | 90)
    : 30

  const supabase = await createClient()

  // Fetch desde (periodo + 1 día buffer) para calcular delta del primer día
  const since = new Date()
  since.setDate(since.getDate() - periodo - 1)
  const sinceStr = since.toISOString().split('T')[0]

  const [{ data: machines }, { data: reports }] = await Promise.all([
    supabase
      .from('machines')
      .select('id, code, name, type, status, daily_hours_target')
      .eq('status', 'activo')
      .order('code'),
    supabase
      .from('hourly_reports')
      .select('machine_id, reported_date, hours_reading')
      .gte('reported_date', sinceStr)
      .order('reported_date', { ascending: true }),
  ])

  const stats: MachineStats[] = (machines ?? []).map((m) =>
    computeMachineStats(m as RawMachine, (reports ?? []) as RawReport[], periodo)
  )

  const machineOptions = (machines ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
  }))

  return (
    <AnalisisClient machines={machineOptions} stats={stats} periodo={periodo} />
  )
}
