import { getCalendarioData } from '@/lib/calendario'
import { CalendarioClient } from './components/CalendarioClient'

type SearchParams = Promise<{ mes?: string; anio?: string }>

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const today = new Date()
  const month = params.mes ? parseInt(params.mes) : today.getMonth() + 1
  const year = params.anio ? parseInt(params.anio) : today.getFullYear()

  const { machines, assignments } = await getCalendarioData(month, year)

  return (
    <CalendarioClient
      initialMonth={month}
      initialYear={year}
      initialMachines={machines}
      initialAssignments={assignments}
    />
  )
}
