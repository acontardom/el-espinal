// Server-side only — import only from server actions or API routes.
// NOT a 'use server' file (to allow direct import without making callers server-action-only).

import { sendEmail, getRecipients, getThreshold, sentInLast24h } from './resend'
import {
  fuelMovementTemplate,
  dailySummaryTemplate,
  maintenanceWarningTemplate,
  maintenanceOverdueTemplate,
} from './templates'
import { createClient } from '../supabase/server'

// ─── Fuel Movement ────────────────────────────────────────────────────────────

export async function triggerFuelMovementNotification(movementId: string): Promise<void> {
  const recipients = await getRecipients('fuel_movement')
  if (recipients.length === 0) return

  const supabase = await createClient()
  const { data: mov } = await supabase
    .from('tank_movements')
    .select(
      `type, movement_date, liters,
       tank:tanks(code, name, current_liters),
       machine:machines(code, name)`
    )
    .eq('id', movementId)
    .single()

  if (!mov) return

  // Get operator name via created_by
  const { data: movFull } = await supabase
    .from('tank_movements')
    .select('created_by')
    .eq('id', movementId)
    .single()

  let operatorName: string | null = null
  if (movFull?.created_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', movFull.created_by)
      .single()
    operatorName = profile?.full_name ?? null
  }

  const { subject, html } = fuelMovementTemplate({
    type: mov.type as 'carga' | 'descarga',
    movement_date: mov.movement_date as string,
    liters: mov.liters as number,
    tank: mov.tank as unknown as { code: string; name: string; current_liters?: number } | null,
    machine: mov.machine as unknown as { code: string; name: string } | null,
    operator: operatorName,
  })

  await sendEmail(recipients, subject, html, 'fuel_movement')
}

// ─── Maintenance Check ────────────────────────────────────────────────────────

export async function triggerMaintenanceCheckNotification(
  machineId: string,
  currentHours: number
): Promise<void> {
  const [warningRecipients, overdueRecipients] = await Promise.all([
    getRecipients('maintenance_warning'),
    getRecipients('maintenance_overdue'),
  ])
  if (warningRecipients.length === 0 && overdueRecipients.length === 0) return

  const supabase = await createClient()

  const { data: machine } = await supabase
    .from('machines')
    .select('id, code, name, current_hours')
    .eq('id', machineId)
    .single()

  if (!machine) return

  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('id, type, description, scheduled_hours')
    .eq('machine_id', machineId)
    .eq('status', 'programada')
    .not('scheduled_hours', 'is', null)

  if (!maintenances?.length) return

  const threshold = await getThreshold('maintenance_warning')

  for (const mant of maintenances) {
    const horasRestantes = (mant.scheduled_hours as number) - currentHours

    if (horasRestantes <= 0 && overdueRecipients.length > 0) {
      const alreadySent = await sentInLast24h('maintenance_overdue')
      if (alreadySent) continue

      const { subject, html } = maintenanceOverdueTemplate({
        machine: machine as { code: string; name: string },
        maintenance: mant as { type: string; description?: string | null; scheduled_hours?: number | null },
        currentHours,
        horasRestantes,
      })
      await sendEmail(overdueRecipients, subject, html, 'maintenance_overdue')
    } else if (horasRestantes > 0 && horasRestantes <= threshold && warningRecipients.length > 0) {
      const alreadySent = await sentInLast24h('maintenance_warning')
      if (alreadySent) continue

      const { subject, html } = maintenanceWarningTemplate({
        machine: machine as { code: string; name: string },
        maintenance: mant as { type: string; description?: string | null; scheduled_hours?: number | null },
        currentHours,
        horasRestantes,
      })
      await sendEmail(warningRecipients, subject, html, 'maintenance_warning')
    }
  }
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

export async function triggerDailySummaryNotification(): Promise<void> {
  const recipients = await getRecipients('daily_summary')
  if (recipients.length === 0) return

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [reportsRes, machinesRes, movementsRes, tanksRes] = await Promise.all([
    supabase
      .from('hourly_reports')
      .select(
        `machine_id, hours_reading,
         machine:machines(code, name),
         operator:profiles!operator_id(full_name)`
      )
      .eq('reported_date', today),
    supabase.from('machines').select('id, code, name').eq('status', 'activo').order('code'),
    supabase
      .from('tank_movements')
      .select(`type, liters, tank:tanks(code, name), machine:machines(code, name)`)
      .eq('movement_date', today),
    supabase
      .from('tanks')
      .select('code, name, current_liters, capacity_liters')
      .eq('status', 'activo')
      .order('code'),
  ])

  const reports = (reportsRes.data ?? []) as any[]
  const allMachines = (machinesRes.data ?? []) as any[]
  const movements = (movementsRes.data ?? []) as any[]
  const tanks = (tanksRes.data ?? []) as any[]

  const reportedMachineIds = new Set(reports.map((r) => r.machine_id as string))

  const { subject, html } = dailySummaryTemplate({
    date: today,
    reports,
    allMachines,
    reportedMachineIds,
    movements,
    tanks,
  })

  await sendEmail(recipients, subject, html, 'daily_summary')
}
