import type { Maintenance } from './mantenciones'

export type Urgency = 'rojo' | 'amarillo' | 'verde'

export function getUrgency(m: Maintenance): Urgency {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentHours = m.machine?.current_hours ?? 0

  // Vencida por horas
  if (m.scheduled_hours != null && currentHours >= m.scheduled_hours) return 'rojo'

  // Vencida por fecha
  if (m.scheduled_date) {
    const scheduled = new Date(m.scheduled_date + 'T00:00:00')
    if (scheduled < today) return 'rojo'

    const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / 86_400_000)
    if (diffDays <= 7) return 'amarillo'
  }

  // Próxima por horas (faltan ≤ 50 h)
  if (m.scheduled_hours != null) {
    const remaining = m.scheduled_hours - currentHours
    if (remaining <= 50) return 'amarillo'
  }

  return 'verde'
}
