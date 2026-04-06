'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type HorometroReporte, type MaquinaActiva } from '@/lib/horometros'
import { HorometroForm } from './HorometroForm'

function formatFecha(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

type Props = {
  reportes: HorometroReporte[]
  maquinas: MaquinaActiva[]
}

export function HorometroTable({ reportes, maquinas }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const router = useRouter()

  function handleGuardado() {
    setMostrarForm(false)
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Horómetros</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Reportes de los últimos 30 días
          </p>
        </div>
        {!mostrarForm && (
          <Button onClick={() => setMostrarForm(true)}>
            <Plus size={15} />
            Nuevo reporte
          </Button>
        )}
      </div>

      {/* Formulario inline */}
      {mostrarForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-base font-semibold text-zinc-900">
            Registrar horómetro
          </h2>
          <HorometroForm
            maquinas={maquinas}
            onGuardado={handleGuardado}
            onCancelar={() => setMostrarForm(false)}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {reportes.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">
            No hay reportes en los últimos 30 días.
          </div>
        ) : (
          <>
            {/* Vista desktop */}
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Equipo</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Operador</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">
                    Lectura (h)
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {reportes.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 tabular-nums text-zinc-700">
                      {formatFecha(r.reported_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-zinc-500">
                        {r.machine?.code}
                      </span>{' '}
                      <span className="font-medium text-zinc-900">
                        {r.machine?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {r.operator?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                      {r.hours_reading.toLocaleString('es-CL', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {r.notes ?? <span className="text-zinc-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vista mobile: cards */}
            <ul className="divide-y divide-zinc-100 sm:hidden">
              {reportes.map((r) => (
                <li key={r.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {r.machine?.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {r.machine?.code} · {r.operator?.full_name ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold tabular-nums text-zinc-900">
                        {r.hours_reading.toLocaleString('es-CL', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                        <span className="text-xs font-normal text-zinc-400">h</span>
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatFecha(r.reported_date)}
                      </p>
                    </div>
                  </div>
                  {r.notes && (
                    <p className="mt-2 text-sm text-zinc-500">{r.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
