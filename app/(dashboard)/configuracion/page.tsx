import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getUserProfile } from '@/lib/auth'
import { getNotificationSettings } from '@/lib/notifications/settings'
import { NotificationCard } from './components/NotificationCard'

export default async function ConfiguracionPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const settings = await getNotificationSettings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white">
          <Bell size={18} className="text-zinc-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Configuración</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Gestión de notificaciones por email</p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {settings.map((s) => (
          <NotificationCard key={s.alert_type} setting={s} />
        ))}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-medium text-zinc-700 mb-1">Resumen diario — cron job</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Para enviar el resumen automáticamente cada día, configura un cron job que haga{' '}
          <code className="bg-zinc-200 px-1 py-0.5 rounded text-xs">POST /api/notifications/daily-summary</code>{' '}
          con el header{' '}
          <code className="bg-zinc-200 px-1 py-0.5 rounded text-xs">x-cron-secret: [CRON_SECRET]</code>.
          Compatible con Vercel Cron Jobs (vercel.json) o cualquier servicio externo.
        </p>
      </div>
    </div>
  )
}
