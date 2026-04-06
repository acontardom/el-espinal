'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import { type ProjectCost, type CostType, createCost, deleteCost } from '@/lib/proyectos'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const costTypeConfig: Record<CostType, { label: string; style: string }> = {
  maquinaria_propia: { label: 'Maquinaria propia', style: 'bg-violet-100 text-violet-700' },
  subcontrato: { label: 'Subcontrato', style: 'bg-orange-100 text-orange-700' },
  material: { label: 'Material', style: 'bg-yellow-100 text-yellow-700' },
  combustible: { label: 'Combustible', style: 'bg-red-100 text-red-700' },
  otro: { label: 'Otro', style: 'bg-zinc-100 text-zinc-600' },
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  type: z.enum(['maquinaria_propia', 'subcontrato', 'material', 'combustible', 'otro']),
  description: z.string().min(1, 'Requerido'),
  amount: z
    .any()
    .transform((v): number => {
      if (v === '' || v === undefined || v === null) return NaN
      return Number(v)
    })
    .pipe(z.number().positive('El monto debe ser mayor a 0')),
  date: z.string().min(1, 'Requerido'),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  costs: ProjectCost[]
  projectId: string
  contractAmount: number | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TabCostos({ costs, projectId, contractAmount }: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const margin = contractAmount != null ? contractAmount - totalCosts : null

  // Group by type for summary
  const byType = new Map<CostType, number>()
  for (const c of costs) {
    byType.set(c.type, (byType.get(c.type) ?? 0) + c.amount)
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: FormData) {
    const res = await createCost({
      project_id: projectId,
      type: data.type,
      description: data.description,
      amount: data.amount as number,
      date: data.date,
      notes: data.notes || null,
    })
    if (res.error) { setError('root', { message: res.error }); return }
    setCreateOpen(false)
    reset({ date: new Date().toISOString().split('T')[0] })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este costo?')) return
    await deleteCost(id, projectId)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Total costos</p>
          <p className="font-semibold text-zinc-900">$ {totalCosts.toLocaleString('es-CL')}</p>
        </div>
        {contractAmount != null && (
          <>
            <div>
              <p className="text-xs text-zinc-500">Monto contrato</p>
              <p className="font-semibold text-zinc-900">$ {contractAmount.toLocaleString('es-CL')}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Margen</p>
              <p className={cn('font-semibold', margin! >= 0 ? 'text-green-700' : 'text-red-600')}>
                $ {margin!.toLocaleString('es-CL')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* By type summary */}
      {byType.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(byType.entries()).map(([type, amount]) => {
            const cfg = costTypeConfig[type]
            return (
              <span key={type} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', cfg.style)}>
                {cfg.label}: $ {amount.toLocaleString('es-CL')}
              </span>
            )
          })}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{costs.length} registro{costs.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Plus size={14} />
          Registrar costo
        </button>
      </div>

      {/* Table */}
      {costs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          No hay costos registrados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Fecha</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Descripción</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Monto</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {costs.map((c) => {
                const cfg = costTypeConfig[c.type]
                return (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 tabular-nums text-zinc-600">{formatFecha(c.date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cfg.style)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {c.description}
                      {c.notes && <p className="text-xs text-zinc-400">{c.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                      $ {c.amount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-md p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-zinc-600">Total</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-zinc-900">
                  $ {totalCosts.toLocaleString('es-CL')}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-zinc-900">Registrar costo</Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Tipo <span className="text-red-500">*</span></label>
                  <select {...register('type')} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200">
                    <option value="maquinaria_propia">Maquinaria propia</option>
                    <option value="subcontrato">Subcontrato</option>
                    <option value="material">Material</option>
                    <option value="combustible">Combustible</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Fecha <span className="text-red-500">*</span></label>
                  <input {...register('date')} type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                  {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Descripción <span className="text-red-500">*</span></label>
                <input {...register('description')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" placeholder="Descripción del costo" />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Monto ($) <span className="text-red-500">*</span></label>
                <input {...register('amount')} type="number" min="0" step="1" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" placeholder="0" />
                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Notas</label>
                <input {...register('notes')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
              </div>
              {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
