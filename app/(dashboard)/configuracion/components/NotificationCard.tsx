'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AlertType, type NotificationSetting, updateNotificationSettings } from '@/lib/notifications/settings'

// ─── Config per alert type ────────────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertType, { label: string; description: string; color: string }> = {
  fuel_movement: {
    label: 'Movimiento de combustible',
    description: 'Se envía cada vez que se registra una carga o descarga de combustible.',
    color: 'blue',
  },
  daily_summary: {
    label: 'Resumen diario',
    description: 'Resumen del día: horómetros reportados, movimientos de combustible y stock de estanques.',
    color: 'green',
  },
  maintenance_warning: {
    label: 'Aviso de mantención próxima',
    description: 'Se envía cuando las horas restantes para una mantención programada son menores al umbral.',
    color: 'amber',
  },
  maintenance_overdue: {
    label: 'Mantención vencida',
    description: 'Se envía cuando un equipo supera las horas de mantención programadas.',
    color: 'red',
  },
}

const colorMap: Record<string, { badge: string; toggle: string }> = {
  blue:  { badge: 'bg-blue-100 text-blue-700',   toggle: 'bg-blue-600' },
  green: { badge: 'bg-green-100 text-green-700', toggle: 'bg-green-600' },
  amber: { badge: 'bg-amber-100 text-amber-700', toggle: 'bg-amber-500' },
  red:   { badge: 'bg-red-100 text-red-700',     toggle: 'bg-red-600' },
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  setting: NotificationSetting
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationCard({ setting }: Props) {
  const cfg = ALERT_CONFIG[setting.alert_type]
  const colors = colorMap[cfg.color]

  const [enabled, setEnabled] = useState(setting.enabled)
  const [recipients, setRecipients] = useState<string[]>(setting.recipients ?? [])
  const [thresholdHours, setThresholdHours] = useState<number>(setting.threshold_hours ?? 50)
  const [sendHour, setSendHour] = useState<number>(setting.send_hour ?? 20)
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function addEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@') || recipients.includes(email)) return
    setRecipients((prev) => [...prev, email])
    setNewEmail('')
  }

  function removeEmail(email: string) {
    setRecipients((prev) => prev.filter((e) => e !== email))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const res = await updateNotificationSettings(setting.alert_type, {
      enabled,
      recipients,
      threshold_hours: setting.alert_type === 'maintenance_warning' ? thresholdHours : null,
      send_hour: setting.alert_type === 'daily_summary' ? sendHour : null,
    })
    setSaving(false)
    setSaveMsg(res.error ? { type: 'err', text: res.error } : { type: 'ok', text: 'Guardado correctamente.' })
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function handleTestSend() {
    setTesting(true)
    try {
      await fetch('/api/notifications/daily-summary', { method: 'POST' })
      setSaveMsg({ type: 'ok', text: 'Resumen de prueba enviado.' })
    } catch {
      setSaveMsg({ type: 'err', text: 'Error al enviar.' })
    } finally {
      setTesting(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', colors.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{cfg.description}</p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            enabled ? colors.toggle : 'bg-zinc-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Type-specific config */}
      {setting.alert_type === 'maintenance_warning' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Umbral de horas para aviso
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={500}
              value={thresholdHours}
              onChange={(e) => setThresholdHours(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            <span className="text-sm text-zinc-500">horas antes de la mantención</span>
          </div>
        </div>
      )}

      {setting.alert_type === 'daily_summary' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Hora de envío (UTC)
          </label>
          <div className="flex items-center gap-3">
            <select
              value={sendHour}
              onChange={(e) => setSendHour(Number(e.target.value))}
              className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span className="text-sm text-zinc-500">hora UTC</span>
          </div>
        </div>
      )}

      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Destinatarios ({recipients.length})
        </label>

        {recipients.length > 0 && (
          <ul className="mb-2 space-y-1">
            {recipients.map((email) => (
              <li key={email} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-sm text-zinc-700">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="ml-2 rounded p-0.5 text-zinc-400 hover:text-red-500 transition"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          <button
            type="button"
            onClick={addEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
      </div>

      {/* Footer */}
      {saveMsg && (
        <p className={cn('text-sm', saveMsg.type === 'ok' ? 'text-green-600' : 'text-red-600')}>
          {saveMsg.text}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100">
        <div>
          {setting.alert_type === 'daily_summary' && (
            <button
              type="button"
              onClick={handleTestSend}
              disabled={testing || recipients.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 transition"
            >
              {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Enviar resumen de prueba
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
