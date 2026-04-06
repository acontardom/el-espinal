import { getDashboardData, type FleetMachine } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ─── Fleet urgency (inline — shape differs from lib/urgency's Maintenance) ───

type FleetUrgency = 'rojo' | 'amarillo' | 'verde'

function getFleetUrgency(machine: FleetMachine): FleetUrgency {
  const m = machine.nextMaintenance
  if (!m) return 'verde'
  if (m.status === 'vencida') return 'rojo'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentHours = machine.current_hours ?? 0

  if (m.scheduled_hours != null && currentHours >= m.scheduled_hours) return 'rojo'

  if (m.scheduled_date) {
    const scheduled = new Date(m.scheduled_date + 'T00:00:00')
    if (scheduled < today) return 'rojo'
    const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / 86_400_000)
    if (diffDays <= 7) return 'amarillo'
  }

  if (m.scheduled_hours != null && m.scheduled_hours - currentHours <= 50) return 'amarillo'

  return 'verde'
}

const urgencyDot: Record<FleetUrgency, string> = {
  rojo: 'bg-red-500',
  amarillo: 'bg-amber-400',
  verde: 'bg-green-500',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  alert,
}: {
  label: string
  value: string | number
  unit?: string
  alert?: boolean
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end gap-1.5">
        <span
          className={cn(
            'text-3xl font-bold tabular-nums leading-none',
            alert ? 'text-red-600' : 'text-zinc-900'
          )}
        >
          {value}
        </span>
        {unit && <span className="mb-0.5 text-sm text-zinc-400">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { kpi, fleet, lastFuelMovements, lastHorometros } = await getDashboardData()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Resumen general del sistema</p>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Flota activa" value={kpi.activeFleet} unit="máquinas" />
        <KpiCard label="Mantenciones pendientes" value={kpi.pendingMaintenances} />
        <KpiCard
          label="Mantenciones vencidas"
          value={kpi.overdueMaintenances}
          alert={kpi.overdueMaintenances > 0}
        />
        <KpiCard
          label="Stock combustible"
          value={fmt(kpi.totalFuelLiters)}
          unit="litros"
        />
      </div>

      {/* ── Fleet status ── */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Estado de flota</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {fleet.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              No hay máquinas activas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">Código</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Nombre</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Horas actuales</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Próxima mantención</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {fleet.map((machine) => {
                  const urgency = getFleetUrgency(machine)
                  const m = machine.nextMaintenance
                  return (
                    <tr key={machine.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {machine.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {machine.name}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                        {machine.current_hours != null
                          ? `${fmt(machine.current_hours, 1)} h`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {m ? (
                          <span>
                            {m.type}
                            {m.scheduled_date && (
                              <span className="ml-1.5 text-xs text-zinc-400">
                                {formatFecha(m.scheduled_date)}
                              </span>
                            )}
                            {m.scheduled_hours != null && (
                              <span className="ml-1.5 text-xs text-zinc-400">
                                {fmt(m.scheduled_hours)} h
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Sin programar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', urgencyDot[urgency])} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Bottom grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Last fuel movements */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            Últimos movimientos de combustible
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {lastFuelMovements.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">Sin movimientos.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {lastFuelMovements.map((mv) => (
                  <li key={mv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          mv.type === 'carga'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        )}
                      >
                        {mv.type === 'carga' ? '⬆ Carga' : '⬇ Descarga'}
                      </span>
                      <span className="text-sm text-zinc-700">
                        {mv.tank?.name ?? mv.tank?.code ?? '—'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-medium text-zinc-900">
                        {fmt(mv.liters, 1)} L
                      </p>
                      <p className="text-xs text-zinc-400">{formatFecha(mv.movement_date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Last hourly reports */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            Últimos reportes de horómetros
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {lastHorometros.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">Sin reportes.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {lastHorometros.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {r.machine?.name ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {r.operator?.full_name ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-medium text-zinc-900">
                        {fmt(r.hours_reading, 1)} h
                      </p>
                      <p className="text-xs text-zinc-400">{formatFecha(r.reported_date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
