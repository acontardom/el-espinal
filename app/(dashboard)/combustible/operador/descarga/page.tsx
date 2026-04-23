import { getTanks, getMachinesForCombustible } from '@/lib/combustible'
import { DescargaClient } from './components/DescargaClient'

export default async function DescargaPage() {
  const [tanks, machines] = await Promise.all([
    getTanks(),
    getMachinesForCombustible(),
  ])
  return <DescargaClient tanks={tanks} machines={machines} />
}
