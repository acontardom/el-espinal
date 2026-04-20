'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertType =
  | 'fuel_movement'
  | 'daily_summary'
  | 'maintenance_warning'
  | 'maintenance_overdue'

export type NotificationSetting = {
  id: string
  alert_type: AlertType
  enabled: boolean
  recipients: string[]
  threshold_hours: number | null
  send_hour: number | null
  updated_at: string
}

export type NotificationSettingInput = {
  enabled: boolean
  recipients: string[]
  threshold_hours?: number | null
  send_hour?: number | null
}

const DEFAULTS: Record<AlertType, Omit<NotificationSetting, 'id' | 'updated_at'>> = {
  fuel_movement: { alert_type: 'fuel_movement', enabled: false, recipients: [], threshold_hours: null, send_hour: null },
  daily_summary: { alert_type: 'daily_summary', enabled: false, recipients: [], threshold_hours: null, send_hour: 20 },
  maintenance_warning: { alert_type: 'maintenance_warning', enabled: false, recipients: [], threshold_hours: 50, send_hour: null },
  maintenance_overdue: { alert_type: 'maintenance_overdue', enabled: false, recipients: [], threshold_hours: null, send_hour: null },
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .order('alert_type')

  const existing = (data ?? []) as NotificationSetting[]
  const existingTypes = new Set(existing.map((s) => s.alert_type))

  // Fill in defaults for missing alert types
  const all: NotificationSetting[] = (Object.keys(DEFAULTS) as AlertType[]).map((type) => {
    const found = existing.find((s) => s.alert_type === type)
    if (found) return { ...found, recipients: (found.recipients as unknown as string[]) ?? [] }
    return { ...DEFAULTS[type], id: '', updated_at: new Date().toISOString() }
  })

  return all
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateNotificationSettings(
  alertType: AlertType,
  input: NotificationSettingInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const payload = {
    alert_type: alertType,
    enabled: input.enabled,
    recipients: input.recipients,
    threshold_hours: input.threshold_hours ?? null,
    send_hour: input.send_hour ?? null,
    updated_at: new Date().toISOString(),
  }

  // Upsert by alert_type
  const { error } = await supabase
    .from('notification_settings')
    .upsert([payload], { onConflict: 'alert_type' })

  if (error) return { error: error.message }
  revalidatePath('/configuracion')
  return {}
}
