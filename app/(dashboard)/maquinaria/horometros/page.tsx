import { getHorometros, getMaquinasActivas, getCumplimiento } from '@/lib/horometros'
import { HorometroTable } from './components/HorometroTable'
import { CumplimientoCalendario } from './components/CumplimientoCalendario'

export default async function HorometrosPage() {
  const [reportes, maquinas, cumplimiento] = await Promise.all([
    getHorometros(),
    getMaquinasActivas(),
    getCumplimiento(30),
  ])

  return (
    <div className="space-y-6">
      <CumplimientoCalendario reportedDates={cumplimiento} days={30} />
      <HorometroTable reportes={reportes} maquinas={maquinas} />
    </div>
  )
}
