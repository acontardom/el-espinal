'use client'

import { useState } from 'react'
import { Plus, Trash2, Truck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import { type ProjectMachine, type MachineOption, assignMachine, removeProjectMachine } from '@/lib/proyectos'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const machineStatusStyle: Record<string, string> = {
  activo: 'bg-green-100 text-green-700',
  inactivo: 'bg-zinc-100 text-zinc-500',
  en_mantencion: 'bg-amber-100 text-amber-700',
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  machine_id: z.string().min(1, 'Seleccione una máquina'),
  start_date: z.string().min(1, 'Requerido'),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  machines: ProjectMachine[]
  machineOptions: MachineOption[]
  projectId: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TabMaquinaria({ machines, machineOptions, projectId }: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  // Filter out already-assigned machines
  const assignedIds = new Set(machines.map((m) => m.machine_id))
  const available = machineOptions.filter((m) => !assignedIds.has(m.id))

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { start_date: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: FormData) {
    const res = await assignMachine({
      project_id: projectId,
      machine_id: data.machine_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      notes: data.notes || null,
    })
    if (res.error) { setError('root', { message: res.error }); return }
    setCreateOpen(false)
    reset({ start_date: new Date().toISOString().split('T')[0] })
  }

  async function handleRemove(id: string) {
    if (!confirm('¿Retirar esta máquina del proyecto?')) return
    await removeProjectMachine(id, projectId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {machines.length} máquina{machines.length !== 1 ? 's' : ''} asignada{machines.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          disabled={available.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Asignar máquina
        </button>
      </div>

      {/* List */}
      {machines.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
          <Truck size={32} className="mx-auto mb-3 text-zinc-300" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">No hay máquinas asignadas a este proyecto.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Código</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Máquina</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Asignada</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Retiro</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {machines.map((pm) => {
                const m = pm.machine
                return (
                  <tr key={pm.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{m?.code ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{m?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-600">{m?.type ?? '—'}</td>
                    <td className="px-4 py-3">
                      {m && (
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', machineStatusStyle[m.status] ?? 'bg-zinc-100 text-zinc-600')}>
                          {m.status === 'en_mantencion' ? 'Mantención' : m.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600">{formatFecha(pm.start_date)}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">{formatFecha(pm.end_date)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(pm.id)}
                        className="rounded-md p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
                        title="Retirar del proyecto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign modal */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-zinc-900">Asignar máquina</Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Máquina <span className="text-red-500">*</span>
                </label>
                <select {...register('machine_id')} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200">
                  <option value="">Seleccionar máquina...</option>
                  {available.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({m.type})
                    </option>
                  ))}
                </select>
                {errors.machine_id && <p className="mt-1 text-xs text-red-600">{errors.machine_id.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                    Fecha asignación <span className="text-red-500">*</span>
                  </label>
                  <input {...register('start_date')} type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                  {errors.start_date && <p className="mt-1 text-xs text-red-600">{errors.start_date.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Fecha retiro</label>
                  <input {...register('end_date')} type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Notas</label>
                <input {...register('notes')} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
              </div>
              {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Asignar'}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
