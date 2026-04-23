'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Camera, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  createMovement,
  createDirectFuelEntry,
  type Tank,
  type MachineOption,
} from '@/lib/combustible'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-zinc-900' : 'bg-zinc-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tanks: Tank[]
  machines: MachineOption[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CargaEstacionClient({ tanks, machines }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  const [fecha, setFecha] = useState(hoy)

  const [tankEnabled, setTankEnabled] = useState(false)
  const [tankId, setTankId] = useState('')
  const [tankLitros, setTankLitros] = useState('')

  const [directEnabled, setDirectEnabled] = useState(false)
  const [machineId, setMachineId] = useState('')
  const [directLitros, setDirectLitros] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeTanks = tanks.filter((t) => t.status === 'activo')
  const selectedTank = activeTanks.find((t) => t.id === tankId)

  const totalLitros =
    (tankEnabled && tankLitros ? parseFloat(tankLitros) || 0 : 0) +
    (directEnabled && directLitros ? parseFloat(directLitros) || 0 : 0)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `facturas/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('facturas').upload(fileName, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('facturas').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!tankEnabled && !directEnabled) {
      setErrorMsg('Activa al menos uno de los bloques.')
      return
    }
    if (tankEnabled && (!tankId || !tankLitros)) {
      setErrorMsg('Completa el estanque y los litros para la carga a estanque.')
      return
    }
    if (directEnabled && (!machineId || !directLitros)) {
      setErrorMsg('Completa el equipo y los litros para la carga directa.')
      return
    }

    setEstado('loading')

    try {
      let invoiceImageUrl: string | null = null
      if (photoFile) invoiceImageUrl = await uploadPhoto(photoFile)

      const ops: Promise<{ error?: string }>[] = []

      if (tankEnabled && tankId && tankLitros) {
        ops.push(
          createMovement({
            type: 'carga',
            tank_id: tankId,
            movement_date: fecha,
            liters: parseFloat(tankLitros),
            invoice_image_url: invoiceImageUrl,
          })
        )
      }

      if (directEnabled && machineId && directLitros) {
        ops.push(
          createDirectFuelEntry({
            machine_id: machineId,
            entry_date: fecha,
            liters: parseFloat(directLitros),
            invoice_image_url: invoiceImageUrl,
          })
        )
      }

      const results = await Promise.all(ops)
      const errors = results.filter((r) => r.error).map((r) => r.error)

      if (errors.length > 0) {
        setErrorMsg(errors.join('. '))
        setEstado('error')
        return
      }

      setEstado('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
      setEstado('error')
    }
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-zinc-900">Carga registrada</p>
        <p className="text-sm text-zinc-500">
          {totalLitros > 0 ? `${totalLitros.toLocaleString('es-CL')} L registrados correctamente.` : 'Registrado correctamente.'}
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
        <h1 className="text-2xl font-semibold text-zinc-900">Carga en estación</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Selecciona qué quieres cargar y los litros. Adjunta foto de la factura si tienes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
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

        {/* Bloque: Carga a estanque */}
        <div className={cn(
          'rounded-2xl border transition-colors',
          tankEnabled ? 'border-zinc-300 bg-white' : 'border-zinc-200 bg-zinc-50'
        )}>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Carga a estanque</p>
              <p className="text-xs text-zinc-400 mt-0.5">Rellena el estanque de combustible</p>
            </div>
            <Toggle checked={tankEnabled} onChange={setTankEnabled} />
          </div>

          {tankEnabled && (
            <div className="space-y-4 border-t border-zinc-100 px-5 pb-5 pt-4">
              <div>
                <label htmlFor="tank" className={labelClass}>
                  Estanque <span className="text-red-500">*</span>
                </label>
                <select
                  id="tank"
                  value={tankId}
                  onChange={(e) => setTankId(e.target.value)}
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
              <div>
                <label htmlFor="tankLitros" className={labelClass}>
                  Litros <span className="text-red-500">*</span>
                </label>
                <input
                  id="tankLitros"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={tankLitros}
                  onChange={(e) => setTankLitros(e.target.value)}
                  placeholder="0.00"
                  disabled={estado === 'loading'}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bloque: Carga directa a equipo */}
        <div className={cn(
          'rounded-2xl border transition-colors',
          directEnabled ? 'border-zinc-300 bg-white' : 'border-zinc-200 bg-zinc-50'
        )}>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Carga directa a equipo</p>
              <p className="text-xs text-zinc-400 mt-0.5">Carga directo al estanque del equipo</p>
            </div>
            <Toggle checked={directEnabled} onChange={setDirectEnabled} />
          </div>

          {directEnabled && (
            <div className="space-y-4 border-t border-zinc-100 px-5 pb-5 pt-4">
              <div>
                <label htmlFor="machine" className={labelClass}>
                  Equipo <span className="text-red-500">*</span>
                </label>
                <select
                  id="machine"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  disabled={estado === 'loading'}
                  className={cn(inputClass, !machineId && 'text-zinc-400')}
                >
                  <option value="" disabled>Seleccionar equipo...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="directLitros" className={labelClass}>
                  Litros <span className="text-red-500">*</span>
                </label>
                <input
                  id="directLitros"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={directLitros}
                  onChange={(e) => setDirectLitros(e.target.value)}
                  placeholder="0.00"
                  disabled={estado === 'loading'}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Total */}
        {totalLitros > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-5 py-3 text-sm">
            <span className="font-medium text-zinc-600">Total litros</span>
            <span className="text-lg font-bold text-zinc-900 tabular-nums">
              {totalLitros.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
            </span>
          </div>
        )}

        {/* Foto factura */}
        <div>
          <p className={labelClass}>
            Foto de factura{' '}
            <span className="font-normal text-zinc-400">(opcional)</span>
          </p>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Vista previa factura"
                className="h-40 w-full rounded-xl border border-zinc-200 object-contain bg-zinc-50"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={estado === 'loading'}
                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md text-zinc-500 hover:text-red-500 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={estado === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50"
            >
              <Camera size={18} />
              Adjuntar foto de factura
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={estado === 'loading' || (!tankEnabled && !directEnabled)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {estado === 'loading' && <Loader2 size={16} className="animate-spin" />}
          {estado === 'loading' ? 'Registrando...' : 'Registrar carga'}
        </button>
      </form>
    </div>
  )
}
