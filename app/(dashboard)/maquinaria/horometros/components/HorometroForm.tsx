'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type MaquinaActiva } from '@/lib/horometros'
import { cn } from '@/lib/utils'

const inputClass =
  'block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

type Props = {
  maquinas: MaquinaActiva[]
  onGuardado: () => void
  onCancelar: () => void
}

type Estado = 'idle' | 'loading' | 'success' | 'error'

export function HorometroForm({ maquinas, onGuardado, onCancelar }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  const [machineId, setMachineId] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [lectura, setLectura] = useState('')
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!machineId || !fecha || !lectura) return

    setEstado('loading')
    setErrorMsg(null)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMsg('No hay sesión activa.')
      setEstado('error')
      return
    }

    const lecturaNum = parseFloat(lectura)

    // Insertar reporte
    const { error: insertError } = await supabase
      .from('hourly_reports')
      .insert({
        machine_id: machineId,
        operator_id: user.id,
        reported_date: fecha,
        hours_reading: lecturaNum,
        notes: notas.trim() || null,
      })

    if (insertError) {
      const msg =
        insertError.code === '23505'
          ? 'Ya existe un reporte para esta máquina en esa fecha.'
          : insertError.message
      setErrorMsg(msg)
      setEstado('error')
      return
    }

    // Actualizar current_hours si la lectura es mayor
    const maquina = maquinas.find((m) => m.id === machineId)
    if (maquina && (maquina.current_hours === null || lecturaNum > maquina.current_hours)) {
      await supabase
        .from('machines')
        .update({ current_hours: lecturaNum })
        .eq('id', machineId)
    }

    setEstado('success')
    setTimeout(() => {
      onGuardado()
    }, 1200)
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-medium text-zinc-900">Reporte guardado</p>
        <p className="text-sm text-zinc-500">Las horas del equipo han sido actualizadas.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Máquina */}
      <div>
        <label htmlFor="machine" className={labelClass}>
          Equipo
        </label>
        <select
          id="machine"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          required
          disabled={estado === 'loading'}
          className={cn(inputClass, !machineId && 'text-zinc-400')}
        >
          <option value="" disabled>
            Seleccionar equipo...
          </option>
          {maquinas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="fecha" className={labelClass}>
          Fecha
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

      {/* Lectura */}
      <div>
        <label htmlFor="lectura" className={labelClass}>
          Lectura horómetro (horas)
        </label>
        <input
          id="lectura"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={lectura}
          onChange={(e) => setLectura(e.target.value)}
          placeholder="Ej: 1250.5"
          required
          disabled={estado === 'loading'}
          className={inputClass}
        />
        {machineId && (() => {
          const m = maquinas.find((m) => m.id === machineId)
          return m?.current_hours != null ? (
            <p className="mt-1.5 text-xs text-zinc-400">
              Última lectura registrada: {m.current_hours.toLocaleString('es-CL')} h
            </p>
          ) : null
        })()}
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notas" className={labelClass}>
          Notas{' '}
          <span className="font-normal text-zinc-400">(opcional)</span>
        </label>
        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones del turno..."
          disabled={estado === 'loading'}
          className={cn(inputClass, 'resize-none text-sm')}
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      {/* Acciones */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={estado === 'loading'}
          className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {estado === 'loading' ? 'Guardando...' : 'Guardar reporte'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={estado === 'loading'}
          className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
