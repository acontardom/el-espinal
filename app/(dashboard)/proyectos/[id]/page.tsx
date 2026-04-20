import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getProject, getMachineOptions } from '@/lib/proyectos'
import { getClients } from '@/lib/clientes'
import { getDocuments } from '@/lib/documentos'
import { getUserProfile } from '@/lib/auth'
import { ProyectoDetailClient } from './components/ProyectoDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProyectoDetailPage({ params }: Props) {
  const { id } = await params

  const [project, machineOptions, clients, profile, documents] = await Promise.all([
    getProject(id),
    getMachineOptions(),
    getClients(),
    getUserProfile(),
    getDocuments(id),
  ])

  if (!project) notFound()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-2">
      {/* Back link */}
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft size={15} />
        Proyectos
      </Link>

      {/* Title */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="font-mono text-xs text-zinc-400">{project.code}</p>
          <h1 className="text-2xl font-semibold text-zinc-900">{project.name}</h1>
          {project.client && (
            <Link
              href={`/clientes/${project.client.id}`}
              className="mt-0.5 text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              {project.client.name}
            </Link>
          )}
        </div>
      </div>

      <ProyectoDetailClient
        project={project}
        machineOptions={machineOptions}
        clients={clients}
        isAdmin={isAdmin}
        documents={documents}
      />
    </div>
  )
}
