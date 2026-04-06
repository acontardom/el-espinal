import { getTanks, getMovements, getMachinesForCombustible } from '@/lib/combustible'
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

  const [tanks, movements, machines, profile] = await Promise.all([
    getTanks(),
    getMovements(month, year),
    getMachinesForCombustible(),
    getUserProfile(),
  ])

  return (
    <CombustibleClient
      tanks={tanks}
      movements={movements}
      machines={machines}
      isAdmin={profile?.role === 'admin'}
      currentMonth={month}
      currentYear={year}
    />
  )
}
