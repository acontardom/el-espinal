'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type ProjectWithStats, type ProjectStatus } from '@/lib/proyectos'
import { type ClientWithStats } from '@/lib/clientes'
import { ProjectModal } from './ProjectModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; style: string }
> = {
  cotizacion: { label: 'Cotización', style: 'bg-blue-100 text-blue-700' },
  activo: { label: 'Activo', style: 'bg-green-100 text-green-700' },
  pausado: { label: 'Pausado', style: 'bg-amber-100 text-amber-700' },
  terminado: { label: 'Terminado', style: 'bg-zinc-100 text-zinc-600' },
  cancelado: { label: 'Cancelado', style: 'bg-red-100 text-red-700' },
}

type Tab = 'activos' | 'cotizaciones' | 'terminados' | 'todos'

const tabs: { key: Tab; label: string; statuses: ProjectStatus[] | null }[] = [
  { key: 'activos', label: 'Activos', statuses: ['activo', 'pausado'] },
  { key: 'cotizaciones', label: 'Cotizaciones', statuses: ['cotizacion'] },
  { key: 'terminados', label: 'Terminados', statuses: ['terminado', 'cancelado'] },
  { key: 'todos', label: 'Todos', statuses: null },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  projects: ProjectWithStats[]
  clients: ClientWithStats[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProyectosClient({ projects, clients }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('activos')
  const [modalOpen, setModalOpen] = useState(false)

  const currentTab = tabs.find((t) => t.key === activeTab)!
  const filtered = currentTab.statuses
    ? projects.filter((p) => currentTab.statuses!.includes(p.status))
    : projects

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Proyectos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {projects.length} proyecto{projects.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} />
          Nuevo proyecto
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {tabs.map((tab) => {
          const count = tab.statuses
            ? projects.filter((p) => tab.statuses!.includes(p.status)).length
            : projects.length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    activeTab === tab.key ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-200 text-zinc-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <FolderKanban size={32} className="mx-auto mb-3 text-zinc-300" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">No hay proyectos en esta categoría.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Código</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Proyecto</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Cliente</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Monto</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Período</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600">Hitos</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600">Máq.</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => {
                const st = statusConfig[p.status]
                return (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="font-mono text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        {p.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-zinc-400">{p.type}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {p.client ? (
                        <Link href={`/clientes/${p.client.id}`} className="hover:underline">
                          {p.client.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.style}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                      {p.contract_amount != null
                        ? `$ ${p.contract_amount.toLocaleString('es-CL')}`
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {formatFecha(p.start_date)}
                      {p.end_date ? ` → ${formatFecha(p.end_date)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.milestone_count > 0 ? (
                        <span className="tabular-nums text-zinc-700">
                          {p.milestone_count - p.pending_milestones}/{p.milestone_count}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-zinc-700">
                      {p.machine_count > 0 ? p.machine_count : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/proyectos/${p.id}`}>
                        <ChevronRight size={16} className="text-zinc-300" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProjectModal open={modalOpen} onOpenChange={setModalOpen} clients={clients} />
    </>
  )
}
