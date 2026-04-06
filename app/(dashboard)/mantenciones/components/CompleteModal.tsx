'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { completeMaintenance, type Maintenance } from '@/lib/mantenciones'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  done_date: z.string().min(1, 'Requerido'),
  done_hours: z
    .any()
    .transform((v): number => {
      if (v === '' || v === undefined || v === null) return NaN
      return Number(v)
    })
    .pipe(z.number().min(0, 'Debe ser ≥ 0')),
  cost: z
    .any()
    .transform((v): number | null => {
      if (v === '' || v === undefined || v === null) return null
      const n = Number(v)
      return isNaN(n) ? null : n
    })
    .pipe(z.number().min(0).nullable())
    .optional(),
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
  maintenance: Maintenance | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CompleteModal({ open, onOpenChange, maintenance }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const hoy = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      done_date: hoy,
      done_hours: undefined,
      cost: undefined,
      provider: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      reset({
        done_date: hoy,
        done_hours: maintenance?.machine?.current_hours ?? undefined,
        cost: undefined,
        provider: maintenance?.provider ?? '',
        notes: '',
      })
    }
  }, [open, maintenance, hoy, reset])

  async function onSubmit(values: FormValues) {
    if (!maintenance) return
    setServerError(null)

    const result = await completeMaintenance(maintenance.id, maintenance.machine_id, {
      done_date: values.done_date,
      done_hours: values.done_hours as number,
      cost: values.cost ?? null,
      provider: values.provider || null,
      notes: values.notes || null,
    })

    if (result.error) {
      setServerError(result.error)
      return
    }
    onOpenChange(false)
  }

  if (!maintenance) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Marcar como realizada
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Cerrar"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          {/* Context info */}
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3">
            <p className="text-sm font-medium text-zinc-900">{maintenance.type}</p>
            <p className="text-xs text-zinc-500">
              {maintenance.machine?.code} — {maintenance.machine?.name}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            {/* Fecha y horas */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha realizada" error={errors.done_date?.message}>
                <input
                  {...register('done_date')}
                  type="date"
                  max={hoy}
                  className={cn(inputClass, errors.done_date && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>
              <Field label="Horas al realizar" error={errors.done_hours?.message}>
                <input
                  {...register('done_hours')}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={String(maintenance.machine?.current_hours ?? '')}
                  className={cn(inputClass, errors.done_hours && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            {/* Costo */}
            <Field label="Costo" hint="(opcional)" error={errors.cost?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <input
                  {...register('cost')}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  className={cn(inputClass, 'pl-7', errors.cost && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            {/* Proveedor */}
            <Field label="Proveedor" hint="(opcional)">
              <input
                {...register('provider')}
                placeholder="Taller o empresa que realizó el trabajo"
                className={inputClass}
                disabled={isSubmitting}
              />
            </Field>

            {/* Notas */}
            <Field label="Notas" hint="(opcional)">
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Observaciones, repuestos utilizados..."
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
                {isSubmitting ? 'Guardando...' : 'Confirmar realizada'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
