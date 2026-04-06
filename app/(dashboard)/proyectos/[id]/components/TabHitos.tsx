'use client'

import { useState } from 'react'
import { Plus, CheckCircle, FileText, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import {
  type Milestone,
  type MilestoneStatus,
  createMilestone,
  completeMilestone,
  invoiceMilestone,
  deleteMilestone,
} from '@/lib/proyectos'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; style: string }> = {
  pendiente: { label: 'Pendiente', style: 'bg-zinc-100 text-zinc-600' },
  completado: { label: 'Completado', style: 'bg-green-100 text-green-700' },
  facturado: { label: 'Facturado', style: 'bg-blue-100 text-blue-700' },
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string().nullable().optional(),
  amount: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const completeSchema = z.object({
  completed_date: z.string().min(1, 'Requerido'),
})

const invoiceSchema = z.object({
  invoiced_date: z.string().min(1, 'Requerido'),
  invoice_number: z.string().nullable().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type CompleteForm = z.infer<typeof completeSchema>
type InvoiceForm = z.infer<typeof invoiceSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  milestones: Milestone[]
  projectId: string
  contractAmount: number | null
}

// ─── Submodals ────────────────────────────────────────────────────────────────

function CompleteModal({
  open,
  onOpenChange,
  milestone,
  projectId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  milestone: Milestone | null
  projectId: string
}) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<CompleteForm>({
    resolver: zodResolver(completeSchema),
    defaultValues: { completed_date: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: CompleteForm) {
    if (!milestone) return
    const res = await completeMilestone(milestone.id, projectId, data.completed_date)
    if (res.error) { setError('root', { message: res.error }); return }
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-base font-semibold text-zinc-900">
            Marcar hito como completado
          </Dialog.Title>
          <p className="mt-1 text-sm text-zinc-500">{milestone?.name}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Fecha de realización <span className="text-red-500">*</span>
              </label>
              <input
                {...register('completed_date')}
                type="date"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
              {errors.completed_date && <p className="mt-1 text-xs text-red-600">{errors.completed_date.message}</p>}
            </div>
            {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50">
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function InvoiceModal({
  open,
  onOpenChange,
  milestone,
  projectId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  milestone: Milestone | null
  projectId: string
}) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { invoiced_date: new Date().toISOString().split('T')[0], invoice_number: '' },
  })

  async function onSubmit(data: InvoiceForm) {
    if (!milestone) return
    const res = await invoiceMilestone(milestone.id, projectId, data.invoiced_date, data.invoice_number || null)
    if (res.error) { setError('root', { message: res.error }); return }
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-base font-semibold text-zinc-900">
            Marcar hito como facturado
          </Dialog.Title>
          <p className="mt-1 text-sm text-zinc-500">{milestone?.name}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Fecha de facturación <span className="text-red-500">*</span>
              </label>
              <input
                {...register('invoiced_date')}
                type="date"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
              {errors.invoiced_date && <p className="mt-1 text-xs text-red-600">{errors.invoiced_date.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">N° Factura</label>
              <input
                {...register('invoice_number')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="F-001234"
              />
            </div>
            {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TabHitos({ milestones, projectId, contractAmount }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [selected, setSelected] = useState<Milestone | null>(null)

  const totalBilled = milestones
    .filter((m) => m.status === 'facturado')
    .reduce((sum, m) => sum + (m.amount ?? 0), 0)

  const totalAmount = milestones.reduce((sum, m) => sum + (m.amount ?? 0), 0)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  async function onCreateSubmit(data: CreateForm) {
    const res = await createMilestone({
      project_id: projectId,
      name: data.name,
      description: data.description || null,
      amount: data.amount ?? null,
      due_date: data.due_date || null,
      notes: data.notes || null,
    })
    if (res.error) { setError('root', { message: res.error }); return }
    setCreateOpen(false)
    reset()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este hito?')) return
    await deleteMilestone(id, projectId)
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {(contractAmount != null || totalAmount > 0) && (
        <div className="flex gap-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
          {contractAmount != null && (
            <div>
              <p className="text-xs text-zinc-500">Monto contrato</p>
              <p className="font-semibold text-zinc-900">$ {contractAmount.toLocaleString('es-CL')}</p>
            </div>
          )}
          {totalAmount > 0 && (
            <div>
              <p className="text-xs text-zinc-500">Total hitos</p>
              <p className="font-semibold text-zinc-900">$ {totalAmount.toLocaleString('es-CL')}</p>
            </div>
          )}
          {totalBilled > 0 && (
            <div>
              <p className="text-xs text-zinc-500">Facturado</p>
              <p className="font-semibold text-blue-700">$ {totalBilled.toLocaleString('es-CL')}</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{milestones.length} hito{milestones.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Plus size={14} />
          Agregar hito
        </button>
      </div>

      {/* List */}
      {milestones.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          No hay hitos definidos.
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => {
            const st = milestoneStatusConfig[m.status]
            return (
              <div key={m.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', st.style)}>
                        {st.label}
                      </span>
                      <p className="font-medium text-zinc-900">{m.name}</p>
                    </div>
                    {m.description && <p className="mt-1 text-sm text-zinc-500">{m.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                      {m.due_date && <span>Vence: {formatFecha(m.due_date)}</span>}
                      {m.completed_date && <span>Completado: {formatFecha(m.completed_date)}</span>}
                      {m.invoiced_date && (
                        <span>
                          Facturado: {formatFecha(m.invoiced_date)}
                          {m.invoice_number ? ` (${m.invoice_number})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.amount != null && (
                      <p className="text-sm font-semibold text-zinc-900">
                        $ {m.amount.toLocaleString('es-CL')}
                      </p>
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {m.status === 'pendiente' && (
                        <button
                          onClick={() => { setSelected(m); setCompleteOpen(true) }}
                          className="rounded-md p-1.5 text-zinc-400 hover:bg-green-50 hover:text-green-600"
                          title="Marcar completado"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {m.status === 'completado' && (
                        <button
                          onClick={() => { setSelected(m); setInvoiceOpen(true) }}
                          className="rounded-md p-1.5 text-zinc-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Marcar facturado"
                        >
                          <FileText size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-zinc-900">Nuevo hito</Dialog.Title>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input {...register('name')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" placeholder="Ej: Avance 30%" />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Descripción</label>
                <input {...register('description')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Monto ($)</label>
                  <input {...register('amount')} type="number" min="0" step="1" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" placeholder="0" />
                  {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Fecha límite</label>
                  <input {...register('due_date')} type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Notas</label>
                <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
              </div>
              {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Agregar hito'}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <CompleteModal open={completeOpen} onOpenChange={setCompleteOpen} milestone={selected} projectId={projectId} />
      <InvoiceModal open={invoiceOpen} onOpenChange={setInvoiceOpen} milestone={selected} projectId={projectId} />
    </div>
  )
}
