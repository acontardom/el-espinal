import {
  getTanks,
  getMovements,
  getMisMovimientos,
  getMachinesForCombustible,
} from '@/lib/combustible'
import { getUserProfile } from '@/lib/auth'
import { CombustibleClient } from './components/CombustibleClient'

type SearchParams = Promise<{ mes?: string; anio?: string }>

export default async function CombustiblePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const now = new Date()
  const month = Math.min(12, Math.max(1, parseInt(params.mes ?? '') || now.getMonth() + 1))
  const year = parseInt(params.anio ?? '') || now.getFullYear()

  const profile = await getUserProfile()
  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    const [tanks, movements, machines] = await Promise.all([
      getTanks(),
      getMovements(month, year),
      getMachinesForCombustible(),
    ])
    return (
      <CombustibleClient
        tanks={tanks}
        movements={movements}
        machines={machines}
        isAdmin={true}
        currentMonth={month}
        currentYear={year}
      />
    )
  }

  // Operador: sólo sus últimos movimientos + estanques para el modal
  const [tanks, movements, machines] = await Promise.all([
    getTanks(),
    getMisMovimientos(profile!.id),
    getMachinesForCombustible(),
  ])
  return (
    <CombustibleClient
      tanks={tanks}
      movements={movements}
      machines={machines}
      isAdmin={false}
      currentMonth={month}
      currentYear={year}
    />
  )
}
