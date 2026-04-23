import Link from 'next/link'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function CombustibleOperadorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Combustible</h1>
        <p className="mt-0.5 text-sm text-zinc-500">¿Qué quieres hacer?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/combustible/operador/carga-estacion"
          className="group flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors group-hover:bg-zinc-700">
            <ArrowUp size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">Cargar en estación</p>
            <p className="mt-0.5 text-sm text-zinc-500">Carga a estanque y/o equipo</p>
          </div>
        </Link>

        <Link
          href="/combustible/operador/descarga"
          className="group flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors group-hover:bg-zinc-700">
            <ArrowDown size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">Descargar a máquina</p>
            <p className="mt-0.5 text-sm text-zinc-500">Descarga desde estanque</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
