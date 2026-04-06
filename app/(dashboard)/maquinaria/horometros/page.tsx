import { getHorometros, getMaquinasActivas } from '@/lib/horometros'
import { HorometroTable } from './components/HorometroTable'

export default async function HorometrosPage() {
  const [reportes, maquinas] = await Promise.all([
    getHorometros(),
    getMaquinasActivas(),
  ])

  return <HorometroTable reportes={reportes} maquinas={maquinas} />
}
