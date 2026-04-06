import Link from 'next/link'
import { Fuel, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { type FuelActivity } from '@/lib/combustible'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function fmt(n: number) {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatFecha(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  activity: FuelActivity
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PanelCombustible({ activity }: Props) {
  const { litrosCargados, litrosDescargados, movimientos } = activity
  const now = new Date()
  const mesActual = MESES[now.getMonth()]
  const sinMovimientos = movimientos.length === 0 && litrosCargados === 0 && litrosDescargados === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Fuel size={16} className="text-zinc-400" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-zinc-900">Mi actividad — combustible</h2>
        <span className="ml-auto text-xs capitalize text-zinc-400">{mesActual}</span>
      </div>

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-1 flex items-center gap-1.5 text-blue-600">
            <ArrowUpCircle size={14} strokeWidth={2} />
            <span className="text-xs font-medium">Cargado</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-zinc-900">
            {fmt(litrosCargados)}
          </p>
          <p className="text-xs text-zinc-400">litros</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-1 flex items-center gap-1.5 text-orange-600">
            <ArrowDownCircle size={14} strokeWidth={2} />
            <span className="text-xs font-medium">Descargado</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-zinc-900">
            {fmt(litrosDescargados)}
          </p>
          <p className="text-xs text-zinc-400">litros</p>
        </div>
      </div>

      {/* Lista de movimientos */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {sinMovimientos ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm text-zinc-400">Sin registros este mes</p>
            <Link
              href="/combustible"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              <Fuel size={13} />
              Registrar ahora
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      m.type === 'carga'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    )}
                  >
                    {m.type === 'carga' ? '⬆ Carga' : '⬇ Descarga'}
                  </span>
                  <span className="truncate text-sm text-zinc-700">
                    {m.tank?.name ?? m.tank?.code ?? '—'}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular-nums text-sm font-medium text-zinc-900">
                    {fmt(m.liters)} L
                  </p>
                  <p className="text-xs text-zinc-400">{formatFecha(m.movement_date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
