'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { type Client, createClientRecord, updateClientRecord } from '@/lib/clientes'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  rut: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
  contact_phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientModal({ open, onOpenChange, client }: Props) {
  const isEditing = !!client

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(
        isEditing
          ? {
              name: client.name,
              rut: client.rut ?? '',
              contact_name: client.contact_name ?? '',
              contact_email: client.contact_email ?? '',
              contact_phone: client.contact_phone ?? '',
              address: client.address ?? '',
              notes: client.notes ?? '',
            }
          : { name: '', rut: '', contact_name: '', contact_email: '', contact_phone: '', address: '', notes: '' }
      )
    }
  }, [open, isEditing, client, reset])

  async function onSubmit(data: FormData) {
    const input = {
      name: data.name,
      rut: data.rut || null,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      address: data.address || null,
      notes: data.notes || null,
    }

    const result = isEditing
      ? await updateClientRecord(client.id, input)
      : await createClientRecord(input)

    if (result.error) {
      setError('root', { message: result.error })
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-zinc-900">
            {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="Nombre de la empresa o persona"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* RUT */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">RUT</label>
              <input
                {...register('rut')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="12.345.678-9"
              />
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nombre de contacto
                </label>
                <input
                  {...register('contact_name')}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Teléfono</label>
                <input
                  {...register('contact_phone')}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
              <input
                {...register('contact_email')}
                type="email"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="contacto@empresa.cl"
              />
              {errors.contact_email && (
                <p className="mt-1 text-xs text-red-600">{errors.contact_email.message}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Dirección</label>
              <input
                {...register('address')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="Calle 123, Ciudad"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Notas</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="Observaciones adicionales..."
              />
            </div>

            {errors.root && (
              <p className="text-sm text-red-600">{errors.root.message}</p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
