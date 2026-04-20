import { Resend } from 'resend'
import { createClient } from '../supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'El Espinal <notificaciones@resend.dev>'

// ─── Send & log ───────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  alertType: string
): Promise<{ success: boolean; error?: string }> {
  if (to.length === 0) return { success: true }

  let success = false
  let errorMsg: string | undefined

  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    if (error) {
      errorMsg = error.message
    } else {
      success = true
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Error desconocido'
  }

  // Log asynchronously — never throw
  logNotification(alertType, subject, to, success, errorMsg).catch(() => {})

  return success ? { success: true } : { success: false, error: errorMsg }
}

async function logNotification(
  alertType: string,
  subject: string,
  recipients: string[],
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('notification_log').insert([
      { alert_type: alertType, subject, recipients, success, error_message: errorMessage ?? null },
    ])
  } catch {
    // Logging failures are silent
  }
}

// ─── Recipient lookup ─────────────────────────────────────────────────────────

export async function getRecipients(alertType: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_settings')
      .select('enabled, recipients')
      .eq('alert_type', alertType)
      .single()
    if (!data?.enabled) return []
    return (data.recipients as string[]) ?? []
  } catch {
    return []
  }
}

export async function getThreshold(alertType: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_settings')
      .select('threshold_hours')
      .eq('alert_type', alertType)
      .single()
    return (data?.threshold_hours as number | null) ?? 50
  } catch {
    return 50
  }
}

// ─── Duplicate-send guard (24 h) ──────────────────────────────────────────────

export async function sentInLast24h(alertType: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('notification_log')
      .select('id', { count: 'exact', head: true })
      .eq('alert_type', alertType)
      .eq('success', true)
      .gte('sent_at', since)
    return (count ?? 0) > 0
  } catch {
    return false
  }
}
