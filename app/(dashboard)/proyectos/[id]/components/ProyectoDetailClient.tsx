'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { type ProjectDetail, type MachineOption, type ProjectStatus } from '@/lib/proyectos'
import { type ClientWithStats } from '@/lib/clientes'
import { type ProjectDocument } from '@/lib/documentos'
import { ProjectModal } from '../../components/ProjectModal'
import { TabHitos } from './TabHitos'
import { TabCostos } from './TabCostos'
import { TabMaquinaria } from './TabMaquinaria'
import { ArchivosTab } from './ArchivosTab'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const statusConfig: Record<ProjectStatus, { label: string; style: string }> = {
  cotizacion: { label: 'Cotización', style: 'bg-blue-100 text-blue-700' },
  activo: { label: 'Activo', style: 'bg-green-100 text-green-700' },
  pausado: { label: 'Pausado', style: 'bg-amber-100 text-amber-700' },
  terminado: { label: 'Terminado', style: 'bg-zinc-100 text-zinc-600' },
  cancelado: { label: 'Cancelado', style: 'bg-red-100 text-red-700' },
}

const contractTypeLabel: Record<string, string> = {
  precio_fijo: 'Precio fijo',
  por_hitos: 'Por hitos',
}

type Tab = 'resumen' | 'hitos' | 'costos' | 'maquinaria' | 'archivos'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  project: ProjectDetail
  machineOptions: MachineOption[]
  clients: ClientWithStats[]
  isAdmin: boolean
  documents: ProjectDocument[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProyectoDetailClient({
  project,
  machineOptions,
  clients,
  isAdmin,
  documents,
}: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  const st = statusConfig[project.status]
  const totalCosts = project.costs.reduce((sum, c) => sum + c.amount, 0)
  const pendingMilestones = project.milestones.filter((m) => m.status === 'pendiente').length

  const tabs: { key: Tab; label: string; badge?: number; adminOnly?: boolean }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'hitos', label: 'Hitos', badge: project.milestones.length },
    { key: 'costos', label: 'Costos', badge: project.costs.length },
    { key: 'maquinaria', label: 'Maquinaria', badge: project.machines.length },
    { key: 'archivos', label: 'Archivos', badge: documents.length, adminOnly: true },
  ]

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin)

  return (
    <>
      {/* Status + Edit */}
      <div className="flex items-center justify-between gap-4">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', st.style)}>
          {st.label}
        </span>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil size={14} />
          Editar proyecto
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {visibleTabs.map((tab) => (
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
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  activeTab === tab.key
                    ? 'bg-zinc-200 text-zinc-700'
                    : 'bg-zinc-200 text-zinc-500'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                label="Tipo de contrato"
                value={project.contract_type ? contractTypeLabel[project.contract_type] : '—'}
              />
              <KpiCard
                label="Monto contrato"
                value={
                  project.contract_amount != null
                    ? `$ ${project.contract_amount.toLocaleString('es-CL')}`
                    : '—'
                }
              />
              <KpiCard
                label="Total costos"
                value={totalCosts > 0 ? `$ ${totalCosts.toLocaleString('es-CL')}` : '—'}
              />
              <KpiCard
                label="Hitos pendientes"
                value={pendingMilestones}
                alert={pendingMilestones > 0}
              />
            </div>

            {/* Details grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {project.client && (
                <InfoRow label="Cliente" value={project.client.name} />
              )}
              {project.location && (
                <InfoRow label="Ubicación" value={project.location} />
              )}
              <InfoRow label="Inicio" value={formatFecha(project.start_date)} />
              <InfoRow label="Término" value={formatFecha(project.end_date)} />
              <InfoRow label="Tipo de trabajo" value={project.type} />
            </div>

            {project.notes && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="mb-1 text-xs font-medium text-zinc-500">Notas</p>
                <p className="text-sm text-zinc-700">{project.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hitos' && (
          <TabHitos
            milestones={project.milestones}
            projectId={project.id}
            contractAmount={project.contract_amount}
          />
        )}

        {activeTab === 'costos' && (
          <TabCostos
            costs={project.costs}
            projectId={project.id}
            contractAmount={project.contract_amount}
          />
        )}

        {activeTab === 'maquinaria' && (
          <TabMaquinaria
            machines={project.machines}
            machineOptions={machineOptions}
            projectId={project.id}
          />
        )}

        {activeTab === 'archivos' && isAdmin && (
          <ArchivosTab
            documents={documents}
            projectId={project.id}
            isAdmin={isAdmin}
          />
        )}
      </div>

      <ProjectModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        clients={clients}
      />
    </>
  )
}

function KpiCard({
  label,
  value,
  alert,
}: {
  label: string
  value: string | number
  alert?: boolean
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-lg font-semibold', alert ? 'text-red-600' : 'text-zinc-900')}>
        {value}
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900">{value}</p>
    </div>
  )
}
