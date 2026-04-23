'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const inputClass =
  'block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

export default function NuevoHorometroPage() {
  const router = useRouter()
  const hoy = new Date().toISOString().split('T')[0]

  const [maquinas, setMaquinas] = useState<{ id: string; code: string; name: string; current_hours: number | null }[]>([])
  const [cargandoMaquinas, setCargandoMaquinas] = useState(true)

  const [machineId, setMachineId] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [lectura, setLectura] = useState('')
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Carga máquinas activas al montar
  useState(() => {
    createClient()
      .from('machines')
      .select('id, code, name, current_hours')
      .eq('status', 'activo')
      .order('code')
      .then(({ data }) => {
        setMaquinas(data ?? [])
        setCargandoMaquinas(false)
      })
  })

  const maquinaSeleccionada = maquinas.find((m) => m.id === machineId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!machineId || !fecha || !lectura) return

    setEstado('loading')
    setErrorMsg(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErrorMsg('No hay sesión activa.')
      setEstado('error')
      return
    }

    const lecturaNum = parseFloat(lectura)

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
      setErrorMsg(
        insertError.code === '23505'
          ? 'Ya existe un reporte para esta máquina en esa fecha.'
          : insertError.message
      )
      setEstado('error')
      return
    }

    if (maquinaSeleccionada && (maquinaSeleccionada.current_hours === null || lecturaNum > maquinaSeleccionada.current_hours)) {
      await supabase
        .from('machines')
        .update({ current_hours: lecturaNum })
        .eq('id', machineId)
    }

    setEstado('success')
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Registrar horómetro</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Selecciona la máquina y registra las horas actuales.
        </p>
      </div>

      {estado === 'success' ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-zinc-900">Reporte guardado</p>
          <p className="text-sm text-zinc-500">Las horas del equipo han sido actualizadas.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          {/* Máquina */}
          <div>
            <label htmlFor="machine" className={labelClass}>
              Equipo <span className="text-red-500">*</span>
            </label>
            <select
              id="machine"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              required
              disabled={estado === 'loading' || cargandoMaquinas}
              className={cn(inputClass, !machineId && 'text-zinc-400')}
            >
              <option value="" disabled>
                {cargandoMaquinas ? 'Cargando...' : 'Seleccionar equipo...'}
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

          {/* Lectura */}
          <div>
            <label htmlFor="lectura" className={labelClass}>
              Lectura horómetro (horas) <span className="text-red-500">*</span>
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
            {maquinaSeleccionada?.current_hours != null && (
              <p className="mt-1.5 text-xs text-zinc-400">
                Última lectura registrada:{' '}
                {maquinaSeleccionada.current_hours.toLocaleString('es-CL')} h
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notas" className={labelClass}>
              Notas <span className="font-normal text-zinc-400">(opcional)</span>
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

          {errorMsg && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={estado === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {estado === 'loading' && <Loader2 size={15} className="animate-spin" />}
              {estado === 'loading' ? 'Guardando...' : 'Guardar'}
            </button>
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:w-auto sm:px-6"
            >
              Volver
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
