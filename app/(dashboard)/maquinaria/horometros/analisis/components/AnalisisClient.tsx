'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MachineStats = {
  id: string
  code: string
  name: string
  type: string
  daily_hours_target: number
  totalHours: number
  activeDays: number
  avgHoursPerDay: number
  last7Days: { date: string; hours: number }[]
}

type MachineOption = { id: string; code: string; name: string }

type Props = {
  machines: MachineOption[]
  stats: MachineStats[]
  periodo: number
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
        <span className={`text-3xl font-bold tabular-nums leading-none ${alert ? 'text-red-600' : 'text-zinc-900'}`}>
          {value}
        </span>
        {unit && <span className="mb-0.5 text-sm text-zinc-400">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Chart 1 — SVG daily bars ─────────────────────────────────────────────────

function BarrasDiarias({ data }: { data: { date: string; hours: number }[] }) {
  const maxH = Math.max(...data.map((d) => d.hours), 12)
  const W = 560
  const H = 180
  const pad = { top: 22, bottom: 32, left: 6, right: 6 }
  const chartH = H - pad.top - pad.bottom
  const n = data.length
  const slotW = (W - pad.left - pad.right) / n
  const barW = Math.floor(slotW * 0.62)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {/* Reference lines at 9h and 7h */}
      {[9, 7].map((h) => {
        const y = pad.top + chartH - (h / maxH) * chartH
        return (
          <line
            key={h}
            x1={pad.left} y1={y} x2={W - pad.right} y2={y}
            stroke="#e4e4e7" strokeWidth={1} strokeDasharray="3 3"
          />
        )
      })}
      {data.map((d, i) => {
        const color =
          d.hours >= 9 ? '#185FA5' : d.hours >= 7 ? '#BA7517' : d.hours > 0 ? '#C04828' : '#e4e4e7'
        const barH = maxH > 0 ? (d.hours / maxH) * chartH : 0
        const cx = pad.left + i * slotW + slotW / 2
        const x = cx - barW / 2
        const y = pad.top + chartH - barH
        const [, m, day] = d.date.split('-')
        const label = `${parseInt(day)}/${parseInt(m)}`

        return (
          <g key={d.date}>
            {barH > 0 ? (
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} />
            ) : (
              <rect x={x} y={pad.top + chartH - 3} width={barW} height={3} rx={2} fill="#e4e4e7" />
            )}
            <text x={cx} y={H - 4} textAnchor="middle" fontSize={11} fill="#a1a1aa">
              {label}
            </text>
            {d.hours > 0 && (
              <text
                x={cx}
                y={Math.max(y - 5, pad.top + 11)}
                textAnchor="middle"
                fontSize={11}
                fill={color}
                fontWeight="600"
              >
                {Number.isInteger(d.hours) ? d.hours : d.hours.toFixed(1)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Chart 2 — horizontal bars ────────────────────────────────────────────────

function BarrasHorizontales({
  data,
  maxHours,
}: {
  data: MachineStats[]
  maxHours: number
}) {
  return (
    <div className="space-y-4">
      {data.map((m) => {
        const color =
          m.avgHoursPerDay >= 9.5 ? '#185FA5' : m.avgHoursPerDay >= 8 ? '#BA7517' : '#C04828'
        const pct = maxHours > 0 ? (m.totalHours / maxHours) * 100 : 0
        return (
          <div key={m.id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-800">
                <span className="mr-1.5 font-mono text-xs text-zinc-400">{m.code}</span>
                {m.name}
              </span>
              <span className="tabular-nums text-zinc-700">{m.totalHours.toFixed(1)} h</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, backgroundColor: color }}
              />
            </div>
            <p className="mt-0.5 text-right text-xs text-zinc-400">
              {m.avgHoursPerDay.toFixed(1)} h/día prom.
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Meta badge ───────────────────────────────────────────────────────────────

function MetaBadge({ m }: { m: MachineStats }) {
  if (m.activeDays === 0 || m.daily_hours_target <= 0)
    return <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-400">—</span>
  const diff = (m.avgHoursPerDay - m.daily_hours_target) / m.daily_hours_target
  if (diff >= -0.05)
    return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">En meta</span>
  if (diff >= -0.20)
    return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Bajo meta</span>
  return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Crítico</span>
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalisisClient({ machines, stats, periodo }: Props) {
  const router = useRouter()
  const [selectedEquipo, setSelectedEquipo] = useState<string>('todos')

  const filtered =
    selectedEquipo === 'todos' ? stats : stats.filter((s) => s.id === selectedEquipo)

  // Fleet last-7-days: sum hours per date across filtered machines
  const allDates = stats.length > 0 ? stats[0].last7Days.map((d) => d.date) : []
  const fleetLast7 = allDates.map((date) => ({
    date,
    hours: filtered.reduce((sum, m) => {
      const day = m.last7Days.find((d) => d.date === date)
      return sum + (day?.hours ?? 0)
    }, 0),
  }))

  // KPIs
  const totalHorasFlota = filtered.reduce((s, m) => s + m.totalHours, 0)
  const activeMachines = filtered.filter((m) => m.activeDays > 0)
  const avgDiario =
    activeMachines.length > 0
      ? activeMachines.reduce((s, m) => s + m.avgHoursPerDay, 0) / activeMachines.length
      : 0
  const avgDiasActivo =
    activeMachines.length > 0
      ? activeMachines.reduce((s, m) => s + m.activeDays, 0) / activeMachines.length
      : 0
  const bajosTarget = filtered.filter(
    (m) => m.activeDays > 0 && m.avgHoursPerDay < m.daily_hours_target
  ).length

  // Alert
  const bajoAlerta = filtered.filter((m) => m.activeDays > 0 && m.avgHoursPerDay < 8)

  // Chart 2
  const maxHours = Math.max(...filtered.map((m) => m.totalHours), 1)
  const sortedByHours = [...filtered].sort((a, b) => b.totalHours - a.totalHours)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Análisis de horómetros</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Actividad y rendimiento de la flota</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period pills */}
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
            {([7, 30, 90] as const).map((p) => (
              <button
                key={p}
                onClick={() =>
                  router.push(`/maquinaria/horometros/analisis?periodo=${p}`)
                }
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  periodo === p
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          {/* Machine selector */}
          <select
            value={selectedEquipo}
            onChange={(e) => setSelectedEquipo(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
          >
            <option value="todos">Todos los equipos</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert */}
      {bajoAlerta.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Promedio bajo 8 h/día en: </span>
            {bajoAlerta.map((m) => m.code).join(', ')}.{' '}
            Verificar si hay días sin asignación de proyecto o registros faltantes.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={`Total horas flota (${periodo}d)`}
          value={totalHorasFlota.toFixed(1)}
          unit="h"
        />
        <KpiCard
          label="Promedio diario / equipo"
          value={avgDiario.toFixed(1)}
          unit="h/día"
        />
        <KpiCard
          label="Días activo promedio"
          value={avgDiasActivo.toFixed(1)}
          unit="días"
        />
        <KpiCard
          label="Equipos bajo meta"
          value={bajosTarget}
          alert={bajosTarget > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1 — daily last 7 days */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">
            Horas diarias — últimos 7 días
          </h2>
          <p className="mb-4 mt-0.5 text-xs text-zinc-400">
            {selectedEquipo === 'todos'
              ? 'Total flota'
              : filtered[0]?.name ?? ''}
          </p>
          {fleetLast7.every((d) => d.hours === 0) ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Sin registros en los últimos 7 días.
            </p>
          ) : (
            <BarrasDiarias data={fleetLast7} />
          )}
          <div className="mt-3 flex items-center gap-5 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#185FA5' }} />
              ≥ 9 h
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#BA7517' }} />
              7 – 9 h
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#C04828' }} />
              &lt; 7 h
            </span>
          </div>
        </div>

        {/* Chart 2 — horizontal by machine */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">
            Horas por equipo — período
          </h2>
          <p className="mb-4 mt-0.5 text-xs text-zinc-400">
            Total acumulado en {periodo} días
          </p>
          {sortedByHours.every((m) => m.totalHours === 0) ? (
            <p className="py-10 text-center text-sm text-zinc-400">Sin datos en este período.</p>
          ) : (
            <BarrasHorizontales data={sortedByHours} maxHours={maxHours} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-900">Detalle por equipo</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
              <th className="px-5 py-3 font-medium text-zinc-500">Nombre</th>
              <th className="px-5 py-3 font-medium text-zinc-500">Tipo</th>
              <th className="px-5 py-3 text-right font-medium text-zinc-500">Total horas</th>
              <th className="px-5 py-3 text-right font-medium text-zinc-500">Días activo</th>
              <th className="px-5 py-3 text-right font-medium text-zinc-500">Prom. h/día</th>
              <th className="px-5 py-3 text-right font-medium text-zinc-500">vs meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-zinc-400">
                  Sin datos para este período.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <span className="mr-2 font-mono text-xs text-zinc-400">{m.code}</span>
                  <span className="font-medium text-zinc-900">{m.name}</span>
                </td>
                <td className="px-5 py-3 text-zinc-500">{m.type}</td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-zinc-900">
                  {m.totalHours.toFixed(1)} h
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-600">
                  {m.activeDays}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-600">
                  {m.activeDays > 0 ? m.avgHoursPerDay.toFixed(1) : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <MetaBadge m={m} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
