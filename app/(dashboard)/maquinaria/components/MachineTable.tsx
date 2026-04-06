'use client'

import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Machine, type MachineStatus } from '@/lib/machines'
import { MachineModal } from './MachineModal'

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  MachineStatus,
  { label: string; className: string }
> = {
  activo: {
    label: 'Activo',
    className: 'bg-green-100 text-green-700',
  },
  en_mantencion: {
    label: 'En mantención',
    className: 'bg-amber-100 text-amber-700',
  },
  inactivo: {
    label: 'Inactivo',
    className: 'bg-zinc-100 text-zinc-500',
  },
}

function StatusBadge({ status }: { status: MachineStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.inactivo
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  machines: Machine[]
  isAdmin: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MachineTable({ machines, isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Machine | null>(null)

  function handleNew() {
    setSelected(null)
    setModalOpen(true)
  }

  function handleEdit(machine: Machine) {
    setSelected(machine)
    setModalOpen(true)
  }

  return (
    <>
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Maquinaria</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {machines.length} máquina{machines.length !== 1 ? 's' : ''}{' '}
            registrada{machines.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleNew}>
            <Plus size={15} />
            Nueva máquina
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {machines.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">
            No hay máquinas registradas aún.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Código</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Marca / Modelo
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">
                  Horas
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {machines.map((machine) => (
                <tr
                  key={machine.id}
                  className="transition-colors hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {machine.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {machine.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{machine.type}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {[machine.brand, machine.model]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={machine.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                    {machine.current_hours != null
                      ? machine.current_hours.toLocaleString('es-CL')
                      : '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(machine)}
                        title="Editar"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MachineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        machine={selected}
      />
    </>
  )
}
