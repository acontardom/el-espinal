import { getProjects } from '@/lib/proyectos'
import { getClients } from '@/lib/clientes'
import { ProyectosClient } from './components/ProyectosClient'

export default async function ProyectosPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()])

  return <ProyectosClient projects={projects} clients={clients} />
}
