'use client'

import { useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Maintenance, type MachineOption } from '@/lib/mantenciones'
import { getUrgency, type Urgency } from '@/lib/urgency'
import { MaintenanceModal } from './MaintenanceModal'
import { CompleteModal } from './CompleteModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function fmtPeso(n: number | null | undefined) {
  if (n == null) return '—'
  return `$ ${n.toLocaleString('es-CL')}`
}

// ─── Urgency badge ────────────────────────────────────────────────────────────

const urgencyConfig: Record<Urgency, { label: string; dot: string; card: string; text: string }> = {
  rojo: {
    label: 'Vencida',
    dot: 'bg-red-500',
    card: 'border-red-200 bg-red-50',
    text: 'text-red-700',
  },
  amarillo: {
    label: 'Próxima',
    dot: 'bg-amber-400',
    card: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
  },
  verde: {
    label: 'OK',
    dot: 'bg-green-500',
    card: 'border-green-100 bg-white',
    text: 'text-green-700',
  },
}

// ─── Pending Card ─────────────────────────────────────────────────────────────

function PendingCard({
  m,
  onComplete,
}: {
  m: Maintenance
  onComplete: (m: Maintenance) => void
}) {
  const urgency = getUrgency(m)
  const cfg = urgencyConfig[urgency]
  const currentHours = m.machine?.current_hours ?? 0

  return (
    <div className={cn('rounded-xl border p-5 flex flex-col gap-4', cfg.card)}>
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', cfg.text)}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 font-semibold text-zinc-900">{m.type}</p>
          <p className="font-mono text-xs text-zinc-400">
            {m.machine?.code} — {m.machine?.name}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {m.scheduled_date && (
          <div>
            <p className="text-xs font-medium text-zinc-500">Fecha programada</p>
            <p className="mt-0.5 font-medium text-zinc-900">{formatFecha(m.scheduled_date)}</p>
          </div>
        )}
        {m.scheduled_hours != null && (
          <div>
            <p className="text-xs font-medium text-zinc-500">Horas programadas</p>
            <p className="mt-0.5 font-medium text-zinc-900">{fmt(m.scheduled_hours)} h</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-zinc-500">Horas actuales</p>
          <p className="mt-0.5 font-medium text-zinc-900">{fmt(currentHours)} h</p>
        </div>
        {m.scheduled_hours != null && (
          <div>
            <p className="text-xs font-medium text-zinc-500">Faltan</p>
            <p className={cn('mt-0.5 font-medium', urgency === 'rojo' ? 'text-red-600' : 'text-zinc-900')}>
              {Math.max(0, m.scheduled_hours - currentHours).toLocaleString('es-CL', { maximumFractionDigits: 1 })} h
            </p>
          </div>
        )}
      </div>

      {m.description && (
        <p className="text-sm text-zinc-600">{m.description}</p>
      )}

      {/* Action */}
      <button
        onClick={() => onComplete(m)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        <CheckCircle size={15} className="text-green-600" />
        Marcar como realizada
      </button>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  pending: Maintenance[]
  history: Maintenance[]
  machines: MachineOption[]
  isAdmin: boolean
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MantencionesClient({ pending, history, machines, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes')
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)

  // Filtro de máquina en historial
  const [filterMachineId, setFilterMachineId] = useState('')

  function handleComplete(m: Maintenance) {
    setSelectedMaintenance(m)
    setCompleteModalOpen(true)
  }

  const filteredHistory = filterMachineId
    ? history.filter((m) => m.machine_id === filterMachineId)
    : history

  // Máquinas únicas en historial para el selector
  const historyMachines = Array.from(
    new Map(
      history
        .filter((m) => m.machine != null)
        .map((m) => [m.machine_id, m.machine!])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mantenciones</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setMaintenanceModalOpen(true)}>
            <Plus size={15} />
            Nueva mantención
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {(['pendientes', 'historial'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {tab === 'pendientes' ? (
              <span className="flex items-center gap-2">
                Pendientes
                {pending.length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {pending.length}
                  </span>
                )}
              </span>
            ) : (
              'Historial'
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Pendientes ── */}
      {activeTab === 'pendientes' && (
        <>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-400">
              No hay mantenciones pendientes.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((m) => (
                <PendingCard key={m.id} m={m} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Historial ── */}
      {activeTab === 'historial' && (
        <>
          {/* Filtro */}
          <div className="mb-4 flex items-center gap-2">
            <select
              value={filterMachineId}
              onChange={(e) => setFilterMachineId(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">Todas las máquinas</option>
              {historyMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-zinc-400">{filteredHistory.length} registros</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">
                No hay mantenciones realizadas.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-3 font-medium text-zinc-600">Fecha</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Máquina</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Descripción</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Horas</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Costo</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredHistory.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 tabular-nums text-zinc-700">
                        {formatFecha(m.done_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-zinc-400">{m.machine?.code}</span>{' '}
                        <span className="text-zinc-700">{m.machine?.name}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">{m.type}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {m.description ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                        {fmt(m.done_hours)} h
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                        {fmtPeso(m.cost)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {m.provider ?? <span className="text-zinc-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <MaintenanceModal
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
        machines={machines}
      />
      <CompleteModal
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        maintenance={selectedMaintenance}
      />
    </>
  )
}
