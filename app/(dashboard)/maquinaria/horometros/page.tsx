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
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Horómetros</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Selecciona la máquina y registra las horas actuales.
        </p>
      </div>
      <CumplimientoCalendario reportedDates={cumplimiento} days={30} />
      <HorometroTable reportes={reportes} maquinas={maquinas} />
    </div>
  )
}
