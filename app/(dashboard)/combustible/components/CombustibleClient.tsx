'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type Tank,
  type TankMovement,
  type MachineOption,
  type MovementType,
  type UnifiedMovement,
} from '@/lib/combustible'
import { TankModal } from './TankModal'
import { MovementModal } from './MovementModal'
import { ImageLightbox } from './ImageLightbox'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function fmt(n: number | null | undefined, decimals = 1) {
  if (n == null) return '—'
  return n.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// ─── Tank Card ────────────────────────────────────────────────────────────────

function TankCard({
  tank,
  isAdmin,
  onEdit,
}: {
  tank: Tank
  isAdmin: boolean
  onEdit: (tank: Tank) => void
}) {
  const pct =
    tank.capacity_liters && tank.capacity_liters > 0
      ? Math.min(100, (tank.current_liters / tank.capacity_liters) * 100)
      : null

  const barColor =
    pct == null ? 'bg-zinc-300' : pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-zinc-400">{tank.code}</p>
          <p className="mt-0.5 font-semibold text-zinc-900">{tank.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            tank.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
          )}>
            {tank.status === 'activo' ? 'Activo' : 'Inactivo'}
          </span>
          {isAdmin && (
            <button
              onClick={() => onEdit(tank)}
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-end justify-between gap-1">
          <span className="text-2xl font-bold tabular-nums text-zinc-900">{fmt(tank.current_liters, 0)}</span>
          <span className="mb-0.5 text-sm text-zinc-400">
            {tank.capacity_liters ? `/ ${fmt(tank.capacity_liters, 0)} L` : 'L'}
          </span>
        </div>
        {pct != null && (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className={cn('h-2 rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-right text-xs text-zinc-400">{Math.round(pct)}%</p>
          </div>
        )}
      </div>
      {tank.notes && <p className="text-xs text-zinc-400">{tank.notes}</p>}
    </div>
  )
}

// ─── Movement badge ───────────────────────────────────────────────────────────

function MovementBadge({ type }: { type: MovementType }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      type === 'carga' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
    )}>
      {type === 'carga' ? '⬆ Carga' : '⬇ Descarga'}
    </span>
  )
}

function UnifiedBadge({ type }: { type: UnifiedMovement['type'] }) {
  if (type === 'carga')
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">⬆ Carga</span>
  if (type === 'descarga')
    return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">⬇ Descarga</span>
  return <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">⬆ Carga directa</span>
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tanks: Tank[]
  movements?: TankMovement[]         // operador
  unifiedMovements?: UnifiedMovement[] // admin
  machines: MachineOption[]
  isAdmin: boolean
  currentMonth: number
  currentYear: number
}

// ─── Vista operador ───────────────────────────────────────────────────────────

function VistaOperador({
  movements = [],
  tanks,
  machines,
}: {
  movements: TankMovement[]
  tanks: Tank[]
  machines: MachineOption[]
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Registrar combustible</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Registra cargas y descargas de estanques</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} />
          Nuevo movimiento
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Mis últimos movimientos</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {movements.length === 0 ? (
            <div className="py-14 text-center text-sm text-zinc-400">Aún no has registrado movimientos.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Estanque</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Máquina</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Litros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 tabular-nums text-zinc-700">{formatFecha(m.movement_date)}</td>
                    <td className="px-4 py-3"><MovementBadge type={m.type} /></td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-zinc-400">{m.tank?.code}</span>{' '}
                      <span className="text-zinc-700">{m.tank?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {m.machine ? `${m.machine.code} — ${m.machine.name}` : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">{fmt(m.liters, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <MovementModal open={modalOpen} onOpenChange={setModalOpen} tanks={tanks} machines={machines} />
    </>
  )
}

// ─── Main component (admin) ───────────────────────────────────────────────────

export function CombustibleClient({
  tanks,
  movements = [],
  unifiedMovements = [],
  machines,
  isAdmin,
  currentMonth,
  currentYear,
}: Props) {
  const router = useRouter()

  if (!isAdmin) {
    return <VistaOperador movements={movements} tanks={tanks} machines={machines} />
  }

  const [activeTab, setActiveTab] = useState<'estanques' | 'movimientos'>('estanques')
  const [tankModalOpen, setTankModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState(currentMonth)
  const [filterYear, setFilterYear] = useState(currentYear)

  function handleMonthFilter(mes: number, anio: number) {
    setFilterMonth(mes)
    setFilterYear(anio)
    router.replace(`/combustible?mes=${mes}&anio=${anio}`)
  }

  const now = new Date()
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Combustible</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Gestión de estanques y movimientos</p>
        </div>
        <Button onClick={() => setMovementModalOpen(true)}>
          <Plus size={15} />
          Registrar movimiento
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {(['estanques', 'movimientos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {tab === 'estanques' ? 'Estanques' : 'Movimientos'}
          </button>
        ))}
      </div>

      {/* ── Estanques ── */}
      {activeTab === 'estanques' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {tanks.length} estanque{tanks.length !== 1 ? 's' : ''} registrado{tanks.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => { setSelectedTank(null); setTankModalOpen(true) }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
            >
              <Plus size={14} />
              Nuevo estanque
            </button>
          </div>
          {tanks.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-400">
              No hay estanques registrados aún.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tanks.map((tank) => (
                <TankCard key={tank.id} tank={tank} isAdmin={isAdmin} onEdit={(t) => { setSelectedTank(t); setTankModalOpen(true) }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Movimientos unificados ── */}
      {activeTab === 'movimientos' && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => handleMonthFilter(Number(e.target.value), filterYear)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              {MESES.map((mes, i) => (
                <option key={i + 1} value={i + 1}>{mes}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => handleMonthFilter(filterMonth, Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-sm text-zinc-400">{unifiedMovements.length} registros</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {unifiedMovements.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">
                No hay movimientos en este período.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-3 font-medium text-zinc-600">Fecha</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Estanque</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Equipo</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Litros</th>
                    <th className="px-4 py-3 font-medium text-zinc-600">Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {unifiedMovements.map((m) => (
                    <tr key={`${m.source}-${m.id}`} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 tabular-nums text-zinc-700">{formatFecha(m.date)}</td>
                      <td className="px-4 py-3"><UnifiedBadge type={m.type} /></td>
                      <td className="px-4 py-3">
                        {m.tank
                          ? <><span className="font-mono text-xs text-zinc-400">{m.tank.code}</span>{' '}<span className="text-zinc-700">{m.tank.name}</span></>
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {m.machine
                          ? `${m.machine.code} — ${m.machine.name}`
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                        {fmt(m.liters, 1)}
                      </td>
                      <td className="px-4 py-3">
                        {m.invoice_image_url ? (
                          <button
                            onClick={() => setLightboxUrl(m.invoice_image_url!)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                          >
                            <Receipt size={12} />
                            Ver factura
                          </button>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
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
      <TankModal open={tankModalOpen} onOpenChange={setTankModalOpen} tank={selectedTank} />
      <MovementModal open={movementModalOpen} onOpenChange={setMovementModalOpen} tanks={tanks} machines={machines} />
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  )
}
