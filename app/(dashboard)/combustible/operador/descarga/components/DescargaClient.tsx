'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createMovement, type Tank, type MachineOption } from '@/lib/combustible'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tanks: Tank[]
  machines: MachineOption[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DescargaClient({ tanks, machines }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  const [tankId, setTankId] = useState('')
  const [machineId, setMachineId] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [litros, setLitros] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activeTanks = tanks.filter((t) => t.status === 'activo')
  const selectedTank = activeTanks.find((t) => t.id === tankId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tankId || !machineId || !litros || !fecha) return

    setEstado('loading')
    setErrorMsg(null)

    const result = await createMovement({
      type: 'descarga',
      tank_id: tankId,
      machine_id: machineId,
      movement_date: fecha,
      liters: parseFloat(litros),
    })

    if (result.error) {
      setErrorMsg(result.error)
      setEstado('error')
      return
    }

    setEstado('success')
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-zinc-900">Descarga registrada</p>
        <p className="text-sm text-zinc-500">
          El stock del estanque ha sido actualizado.
        </p>
        <Link
          href="/combustible/operador"
          className="mt-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition"
        >
          Volver
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Descargar combustible</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Selecciona el estanque origen, la máquina receptora y los litros a descargar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Estanque */}
        <div>
          <label htmlFor="tank" className={labelClass}>
            Estanque <span className="text-red-500">*</span>
          </label>
          <select
            id="tank"
            value={tankId}
            onChange={(e) => setTankId(e.target.value)}
            required
            disabled={estado === 'loading'}
            className={cn(inputClass, !tankId && 'text-zinc-400')}
          >
            <option value="" disabled>Seleccionar estanque...</option>
            {activeTanks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name}
                {t.current_liters != null ? ` (${t.current_liters.toLocaleString('es-CL')} L)` : ''}
              </option>
            ))}
          </select>
          {selectedTank && (
            <p className="mt-1.5 text-xs text-zinc-400">
              Stock actual:{' '}
              <span className="font-medium text-zinc-600">
                {(selectedTank.current_liters ?? 0).toLocaleString('es-CL')} L
              </span>
              {selectedTank.capacity_liters
                ? ` / ${selectedTank.capacity_liters.toLocaleString('es-CL')} L`
                : ''}
            </p>
          )}
        </div>

        {/* Máquina */}
        <div>
          <label htmlFor="machine" className={labelClass}>
            Máquina receptora <span className="text-red-500">*</span>
          </label>
          <select
            id="machine"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            required
            disabled={estado === 'loading'}
            className={cn(inputClass, !machineId && 'text-zinc-400')}
          >
            <option value="" disabled>Seleccionar máquina...</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="fecha" className={labelClass}>
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => setFecha(e.target.value)}
            required
            disabled={estado === 'loading'}
            className={inputClass}
          />
        </div>

        {/* Litros */}
        <div>
          <label htmlFor="litros" className={labelClass}>
            Litros <span className="text-red-500">*</span>
          </label>
          <input
            id="litros"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            placeholder="0.00"
            required
            disabled={estado === 'loading'}
            className={inputClass}
          />
        </div>

        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={estado === 'loading'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {estado === 'loading' && <Loader2 size={16} className="animate-spin" />}
          {estado === 'loading' ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
