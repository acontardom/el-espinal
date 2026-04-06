'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import {
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type ContractType,
  createProject,
  updateProject,
} from '@/lib/proyectos'
import { type ClientWithStats } from '@/lib/clientes'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  status: z.enum(['cotizacion', 'activo', 'pausado', 'terminado', 'cancelado']),
  contract_type: z.enum(['precio_fijo', 'por_hitos']).nullable().optional(),
  contract_amount: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  client_id: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  clients: ClientWithStats[]
}

const PROJECT_TYPES = [
  'Movimiento de tierras',
  'Nivelación',
  'Excavación',
  'Relleno',
  'Demolición',
  'Construcción',
  'Pavimentación',
  'Otro',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectModal({ open, onOpenChange, project, clients }: Props) {
  const isEditing = !!project

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(
        isEditing
          ? {
              code: project.code,
              name: project.name,
              type: project.type,
              status: project.status,
              contract_type: project.contract_type ?? null,
              contract_amount: project.contract_amount ?? undefined,
              client_id: project.client_id ?? '',
              location: project.location ?? '',
              start_date: project.start_date ?? '',
              end_date: project.end_date ?? '',
              notes: project.notes ?? '',
            }
          : {
              code: '',
              name: '',
              type: '',
              status: 'cotizacion' as ProjectStatus,
              contract_type: null,
              contract_amount: undefined,
              client_id: '',
              location: '',
              start_date: '',
              end_date: '',
              notes: '',
            }
      )
    }
  }, [open, isEditing, project, reset])

  async function onSubmit(data: FormData) {
    const input: ProjectInput = {
      code: data.code,
      name: data.name,
      type: data.type,
      status: data.status,
      contract_type: data.contract_type ?? null,
      contract_amount: data.contract_amount ?? null,
      client_id: data.client_id || null,
      location: data.location || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes || null,
    }

    const result = isEditing
      ? await updateProject(project.id, input)
      : await createProject(input)

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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-zinc-900">
            {isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {/* Código y nombre */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('code')}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="PRY-001"
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="Nombre del proyecto"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Tipo, estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="">Seleccionar tipo...</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Estado</label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="cotizacion">Cotización</option>
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="terminado">Terminado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Cliente</label>
              <select
                {...register('client_id')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">Sin cliente asignado</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Tipo contrato y monto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Tipo de contrato
                </label>
                <select
                  {...register('contract_type')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="">Sin especificar</option>
                  <option value="precio_fijo">Precio fijo</option>
                  <option value="por_hitos">Por hitos</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Monto contrato ($)
                </label>
                <input
                  {...register('contract_amount')}
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="0"
                />
                {errors.contract_amount && (
                  <p className="mt-1 text-xs text-red-600">{errors.contract_amount.message}</p>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Ubicación</label>
              <input
                {...register('location')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="Ciudad, región o descripción del lugar"
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Fecha inicio
                </label>
                <input
                  {...register('start_date')}
                  type="date"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Fecha término
                </label>
                <input
                  {...register('end_date')}
                  type="date"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                />
              </div>
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
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear proyecto'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
