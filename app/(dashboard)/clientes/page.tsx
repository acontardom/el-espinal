import { getClients } from '@/lib/clientes'
import { ClientesClient } from './components/ClientesClient'

export default async function ClientesPage() {
  const clients = await getClients()

  return <ClientesClient clients={clients} />
}
