'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createTank, updateTank, type Tank } from '@/lib/combustible'

// ─── Schema ───────────────────────────────────────────────────────────────────

const nullableNum = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().min(0).nullable().optional()
)

const schema = z.object({
  code: z.string().min(1, 'Requerido'),
  name: z.string().min(1, 'Requerido'),
  capacity_liters: nullableNum,
  current_liters: nullableNum,
  status: z.enum(['activo', 'inactivo']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

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
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tank?: Tank | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TankModal({ open, onOpenChange, tank }: Props) {
  const isEdit = !!tank
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
      capacity_liters: undefined,
      current_liters: undefined,
      status: 'activo',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      reset(
        tank
          ? {
              code: tank.code,
              name: tank.name,
              capacity_liters: tank.capacity_liters ?? undefined,
              current_liters: tank.current_liters ?? undefined,
              status: tank.status,
              notes: tank.notes ?? '',
            }
          : {
              code: '',
              name: '',
              capacity_liters: undefined,
              current_liters: undefined,
              status: 'activo',
              notes: '',
            }
      )
    }
  }, [open, tank, reset])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const input = {
      ...values,
      notes: values.notes || null,
    }
    const result = isEdit
      ? await updateTank(tank!.id, input)
      : await createTank(input)

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
              {isEdit ? 'Editar estanque' : 'Nuevo estanque'}
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
              <Field label="Código" error={errors.code?.message}>
                <input
                  {...register('code')}
                  placeholder="EST-01"
                  className={cn(inputClass, errors.code && 'border-red-400')}
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Estado" error={errors.status?.message}>
                <select
                  {...register('status')}
                  className={inputClass}
                  disabled={isSubmitting}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>

              <div className="col-span-2">
                <Field label="Nombre" error={errors.name?.message}>
                  <input
                    {...register('name')}
                    placeholder="Estanque principal diésel"
                    className={cn(inputClass, errors.name && 'border-red-400')}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              <Field label="Capacidad (litros)" error={errors.capacity_liters?.message}>
                <input
                  {...register('capacity_liters')}
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Stock inicial (litros)" error={errors.current_liters?.message}>
                <input
                  {...register('current_liters')}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </Field>

              <div className="col-span-2">
                <Field label="Notas" error={errors.notes?.message}>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Observaciones..."
                    className={cn(inputClass, 'resize-none')}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </div>

            {serverError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {serverError}
              </p>
            )}

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
                {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear estanque'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
