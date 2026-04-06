'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createMaintenance, type MachineOption } from '@/lib/mantenciones'

// ─── Schema ───────────────────────────────────────────────────────────────────

const nullableNum = z
  .any()
  .transform((v): number | null => {
    if (v === '' || v === undefined || v === null) return null
    const n = Number(v)
    return isNaN(n) ? null : n
  })
  .pipe(z.number().min(0).nullable())
  .optional()

const schema = z.object({
  machine_id: z.string().min(1, 'Selecciona una máquina'),
  type: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  scheduled_date: z.string().optional(),
  scheduled_hours: nullableNum,
  provider: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">
        {label}
        {hint && <span className="ml-1 font-normal text-zinc-400">{hint}</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  machines: MachineOption[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MaintenanceModal({ open, onOpenChange, machines }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      machine_id: '',
      type: '',
      description: '',
      scheduled_date: '',
      scheduled_hours: undefined,
      provider: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      reset({
        machine_id: '',
        type: '',
        description: '',
        scheduled_date: '',
        scheduled_hours: undefined,
        provider: '',
        notes: '',
      })
    }
  }, [open, reset])

  const selectedMachineId = watch('machine_id')
  const selectedMachine = machines.find((m) => m.id === selectedMachineId)

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createMaintenance({
      machine_id: values.machine_id,
      type: values.type,
      description: values.description || null,
      scheduled_date: values.scheduled_date || null,
      scheduled_hours: values.scheduled_hours ?? null,
      provider: values.provider || null,
      notes: values.notes || null,
    })
    if (result.error) {
      setServerError(result.error)
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Nueva mantención programada
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Cerrar"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            {/* Máquina */}
            <Field label="Máquina" error={errors.machine_id?.message}>
              <select
                {...register('machine_id')}
                className={cn(inputClass, errors.machine_id && 'border-red-400')}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar máquina...</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                    {m.current_hours != null ? ` (${m.current_hours.toLocaleString('es-CL')} h)` : ''}
                  </option>
                ))}
              </select>
              {selectedMachine?.current_hours != null && (
                <p className="mt-1 text-xs text-zinc-400">
                  Horas actuales:{' '}
                  <span className="font-medium text-zinc-600">
                    {selectedMachine.current_hours.toLocaleString('es-CL')} h
                  </span>
                </p>
              )}
            </Field>

            {/* Tipo */}
            <Field label="Tipo de mantención" error={errors.type?.message}>
              <input
                {...register('type')}
                list="tipos-mantencion"
                placeholder="Cambio de aceite, Filtros, Revisión general..."
                className={cn(inputClass, errors.type && 'border-red-400')}
                disabled={isSubmitting}
              />
              <datalist id="tipos-mantencion">
                <option value="Cambio de aceite" />
                <option value="Cambio de filtros" />
                <option value="Revisión general" />
                <option value="Cambio de correas" />
                <option value="Revisión de frenos" />
                <option value="Engrase general" />
              </datalist>
            </Field>

            {/* Descripción */}
            <Field label="Descripción" hint="(opcional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Detalle de trabajos a realizar..."
                className={cn(inputClass, 'resize-none')}
                disabled={isSubmitting}
              />
            </Field>

            {/* Fecha y horas programadas */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha programada" hint="(opc.)" error={errors.scheduled_date?.message}>
                <input
                  {...register('scheduled_date')}
                  type="date"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Horas programadas" hint="(opc.)" error={errors.scheduled_hours?.message}>
                <input
                  {...register('scheduled_hours')}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="1500"
                  className={cn(inputClass, errors.scheduled_hours && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            {/* Proveedor */}
            <Field label="Proveedor" hint="(opcional)">
              <input
                {...register('provider')}
                placeholder="Taller, empresa de servicio..."
                className={inputClass}
                disabled={isSubmitting}
              />
            </Field>

            {/* Notas */}
            <Field label="Notas" hint="(opcional)">
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Observaciones adicionales..."
                className={cn(inputClass, 'resize-none')}
                disabled={isSubmitting}
              />
            </Field>

            {serverError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {serverError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Programar mantención'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
