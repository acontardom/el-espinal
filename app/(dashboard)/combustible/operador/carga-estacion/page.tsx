import { getTanks, getMachinesForCombustible } from '@/lib/combustible'
import { CargaEstacionClient } from './components/CargaEstacionClient'

export default async function CargaEstacionPage() {
  const [tanks, machines] = await Promise.all([
    getTanks(),
    getMachinesForCombustible(),
  ])
  return <CargaEstacionClient tanks={tanks} machines={machines} />
}
