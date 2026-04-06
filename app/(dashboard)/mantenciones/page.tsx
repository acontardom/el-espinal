import {
  getPendingMaintenances,
  getMaintenances,
  getMachinesForMantencion,
  checkOverdueMaintenances,
} from '@/lib/mantenciones'
import { getUserProfile } from '@/lib/auth'
import { MantencionesClient } from './components/MantencionesClient'

export default async function MantencionesPage() {
  // Primero actualizar vencidas, luego traer datos frescos
  await checkOverdueMaintenances()

  const [pending, history, machines, profile] = await Promise.all([
    getPendingMaintenances(),
    getMaintenances(),
    getMachinesForMantencion(),
    getUserProfile(),
  ])

  return (
    <MantencionesClient
      pending={pending}
      history={history}
      machines={machines}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
