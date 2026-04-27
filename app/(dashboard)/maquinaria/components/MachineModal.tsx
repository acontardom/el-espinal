'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createMachine,
  updateMachine,
  type Machine,
  type MachineStatus,
} from '@/lib/machines'

// ─── Schema ─────────────────────────────────────────────────────────────────

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
  code: z.string().min(1, 'Requerido'),
  name: z.string().min(1, 'Requerido'),
  type: z.string().min(1, 'Requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z
    .any()
    .transform((v): number | null => {
      if (v === '' || v === undefined || v === null) return null
      return Number(v)
    })
    .pipe(z.number().int().min(1900).max(2100).nullable())
    .optional(),
  status: z.enum(['activo', 'inactivo', 'en_mantencion']),
  current_hours: nullableNum,
  maintenance_interval_hours: nullableNum,
  last_maintenance_hours: nullableNum,
  fuel_standard_lh: nullableNum,
  daily_hours_target: nullableNum,
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-700'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  machine?: Machine | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MachineModal({ open, onOpenChange, machine }: Props) {
  const isEdit = !!machine
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      type: '',
      brand: '',
      model: '',
      year: undefined,
      status: 'activo',
      current_hours: undefined,
      maintenance_interval_hours: undefined,
      last_maintenance_hours: undefined,
      fuel_standard_lh: undefined,
      daily_hours_target: 10 as unknown as undefined,
      notes: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setServerError(null)
      reset(
        machine
          ? {
              code: machine.code,
              name: machine.name,
              type: machine.type,
              brand: machine.brand ?? '',
              model: machine.model ?? '',
              year: machine.year ?? undefined,
              status: machine.status,
              current_hours: machine.current_hours ?? undefined,
              maintenance_interval_hours:
                machine.maintenance_interval_hours ?? undefined,
              last_maintenance_hours:
                machine.last_maintenance_hours ?? undefined,
              fuel_standard_lh: machine.fuel_standard_lh ?? undefined,
              daily_hours_target: (machine.daily_hours_target ?? 10) as unknown as undefined,
              notes: machine.notes ?? '',
            }
          : {
              code: '',
              name: '',
              type: '',
              brand: '',
              model: '',
              year: undefined,
              status: 'activo',
              current_hours: undefined,
              maintenance_interval_hours: undefined,
              last_maintenance_hours: undefined,
              fuel_standard_lh: undefined,
              daily_hours_target: 10 as unknown as undefined,
              notes: '',
            }
      )
    }
  }, [open, machine, reset])

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const input = {
      ...values,
      brand: values.brand || null,
      model: values.model || null,
      notes: values.notes || null,
      status: values.status as MachineStatus,
    }

    const result = isEdit
      ? await updateMachine(machine!.id, input)
      : await createMachine(input)

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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              {isEdit ? 'Editar máquina' : 'Nueva máquina'}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Cerrar"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Código */}
              <Field label="Código" error={errors.code?.message}>
                <input
                  {...register('code')}
                  placeholder="EJ-001"
                  className={cn(inputClass, errors.code && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Nombre */}
              <Field label="Nombre" error={errors.name?.message}>
                <input
                  {...register('name')}
                  placeholder="Excavadora Komatsu"
                  className={cn(inputClass, errors.name && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Tipo */}
              <Field label="Tipo" error={errors.type?.message}>
                <input
                  {...register('type')}
                  placeholder="Excavadora, Camión, Bulldozer..."
                  className={cn(inputClass, errors.type && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Estado */}
              <Field label="Estado" error={errors.status?.message}>
                <select
                  {...register('status')}
                  className={cn(inputClass, errors.status && 'border-red-400')}
                  disabled={isSubmitting}
                >
                  <option value="activo">Activo</option>
                  <option value="en_mantencion">En mantención</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>

              {/* Marca */}
              <Field label="Marca" error={errors.brand?.message}>
                <input
                  {...register('brand')}
                  placeholder="Komatsu, Caterpillar..."
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Modelo */}
              <Field label="Modelo" error={errors.model?.message}>
                <input
                  {...register('model')}
                  placeholder="PC200, 320D..."
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Año */}
              <Field label="Año" error={errors.year?.message}>
                <input
                  {...register('year')}
                  type="number"
                  placeholder="2020"
                  className={cn(inputClass, errors.year && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Horas actuales */}
              <Field
                label="Horas actuales"
                error={errors.current_hours?.message}
              >
                <input
                  {...register('current_hours')}
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className={cn(
                    inputClass,
                    errors.current_hours && 'border-red-400'
                  )}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Intervalo de mantención */}
              <Field
                label="Intervalo de mantención (horas)"
                error={errors.maintenance_interval_hours?.message}
              >
                <input
                  {...register('maintenance_interval_hours')}
                  type="number"
                  placeholder="250"
                  className={cn(
                    inputClass,
                    errors.maintenance_interval_hours && 'border-red-400'
                  )}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Última mantención */}
              <Field
                label="Última mantención (horas)"
                error={errors.last_maintenance_hours?.message}
              >
                <input
                  {...register('last_maintenance_hours')}
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className={cn(
                    inputClass,
                    errors.last_maintenance_hours && 'border-red-400'
                  )}
                  disabled={isSubmitting}
                />
              </Field>

              {/* Parámetros técnicos — full width */}
              <div className="col-span-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Parámetros técnicos
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Consumo estándar (L/hora)" error={errors.fuel_standard_lh?.message}>
                    <input
                      {...register('fuel_standard_lh')}
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ej: 18.5 — según ficha técnica del fabricante"
                      className={cn(inputClass, errors.fuel_standard_lh && 'border-red-400')}
                      disabled={isSubmitting}
                    />
                  </Field>
                  <Field label="Meta horas/día" error={errors.daily_hours_target?.message}>
                    <input
                      {...register('daily_hours_target')}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Ej: 10"
                      className={cn(inputClass, errors.daily_hours_target && 'border-red-400')}
                      disabled={isSubmitting}
                    />
                  </Field>
                </div>
              </div>

              {/* Notas — full width */}
              <div className="col-span-2">
                <Field label="Notas" error={errors.notes?.message}>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className={cn(inputClass, 'resize-none')}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {serverError}
              </p>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Guardando...'
                  : isEdit
                    ? 'Guardar cambios'
                    : 'Crear máquina'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
