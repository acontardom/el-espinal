'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createMovement, type Tank, type MachineOption } from '@/lib/combustible'
import { createClient } from '@/lib/supabase/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

type Estado = 'idle' | 'loading' | 'success' | 'error'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tanks: Tank[]
  machines: MachineOption[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MovementModal({ open, onOpenChange, tanks, machines }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  const [type, setType] = useState<'carga' | 'descarga'>('carga')
  const [tankId, setTankId] = useState('')
  const [machineId, setMachineId] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [litros, setLitros] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [estado, setEstado] = useState<Estado>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setType('carga')
      setTankId('')
      setMachineId('')
      setFecha(hoy)
      setLitros('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setEstado('idle')
      setErrorMsg(null)
    }
  }, [open, hoy])

  const activeTanks = tanks.filter((t) => t.status === 'activo')
  const selectedTank = activeTanks.find((t) => t.id === tankId)
  const isCarga = type === 'carga'

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
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
    const { error } = await supabase.storage
      .from('facturas')
      .upload(fileName, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('facturas').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tankId || !litros || !fecha) return
    if (!isCarga && !machineId) return

    setEstado('loading')
    setErrorMsg(null)

    try {
      let invoiceImageUrl: string | null = null
      if (isCarga && photoFile) {
        invoiceImageUrl = await uploadPhoto(photoFile)
      }

      const result = await createMovement({
        type,
        tank_id: tankId,
        machine_id: isCarga ? null : machineId,
        movement_date: fecha,
        liters: parseFloat(litros),
        invoice_image_url: invoiceImageUrl,
      })

      if (result.error) {
        setErrorMsg(result.error)
        setEstado('error')
        return
      }

      setEstado('success')
      setTimeout(() => onOpenChange(false), 1200)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
      setEstado('error')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Registrar movimiento
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Cerrar"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          {estado === 'success' ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-medium text-zinc-900">Movimiento registrado</p>
              <p className="text-sm text-zinc-500">El stock del estanque ha sido actualizado.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Selector de tipo */}
              <div>
                <p className={labelClass}>Tipo de movimiento</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['carga', 'descarga'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'rounded-xl border-2 px-4 py-3 text-sm font-medium transition',
                        type === t
                          ? t === 'carga'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                      )}
                    >
                      {t === 'carga' ? '⬆ Carga a estanque' : '⬇ Descarga a máquina'}
                    </button>
                  ))}
                </div>
              </div>

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
                      {t.current_liters != null
                        ? ` (${t.current_liters.toLocaleString('es-CL')} L)`
                        : ''}
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

              {/* Máquina (solo descarga) */}
              {!isCarga && (
                <div>
                  <label htmlFor="machine" className={labelClass}>
                    Máquina <span className="text-red-500">*</span>
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
              )}

              {/* Fecha y litros */}
              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="500.00"
                    required
                    disabled={estado === 'loading'}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Foto de factura (solo carga) */}
              {isCarga && (
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
              )}

              {errorMsg && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMsg}
                </p>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={estado === 'loading'}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <Button type="submit" disabled={estado === 'loading'}>
                  {estado === 'loading' && <Loader2 size={15} className="animate-spin" />}
                  {estado === 'loading' ? 'Guardando...' : 'Guardar movimiento'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
