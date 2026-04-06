import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { getClient } from '@/lib/clientes'
import { ClientDetailClient } from './ClientDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const statusLabel: Record<string, string> = {
  cotizacion: 'Cotización',
  activo: 'Activo',
  pausado: 'Pausado',
  terminado: 'Terminado',
  cancelado: 'Cancelado',
}

const statusStyle: Record<string, string> = {
  cotizacion: 'bg-blue-100 text-blue-700',
  activo: 'bg-green-100 text-green-700',
  pausado: 'bg-amber-100 text-amber-700',
  terminado: 'bg-zinc-100 text-zinc-600',
  cancelado: 'bg-red-100 text-red-700',
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) notFound()

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft size={15} />
        Clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
            <Building2 size={24} className="text-zinc-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
            {client.rut && <p className="text-sm text-zinc-400">RUT: {client.rut}</p>}
          </div>
        </div>
        <ClientDetailClient client={client} />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {client.contact_name && (
          <InfoCard icon={<Building2 size={15} />} label="Contacto" value={client.contact_name} />
        )}
        {client.contact_email && (
          <InfoCard icon={<Mail size={15} />} label="Email" value={client.contact_email} />
        )}
        {client.contact_phone && (
          <InfoCard icon={<Phone size={15} />} label="Teléfono" value={client.contact_phone} />
        )}
        {client.address && (
          <InfoCard icon={<MapPin size={15} />} label="Dirección" value={client.address} />
        )}
        {client.notes && (
          <div className="sm:col-span-2 lg:col-span-3">
            <InfoCard icon={<FileText size={15} />} label="Notas" value={client.notes} />
          </div>
        )}
      </div>

      {/* Projects */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Proyectos ({client.projects.length})
        </h2>
        {client.projects.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
            Este cliente no tiene proyectos asociados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">Código</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Nombre</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Tipo</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Monto</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {client.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="font-mono text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                      >
                        {p.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      <Link href={`/proyectos/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{p.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[p.status] ?? 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                      {p.contract_amount != null
                        ? `$ ${p.contract_amount.toLocaleString('es-CL')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {p.start_date ? formatFecha(p.start_date) : '—'}
                      {p.end_date ? ` → ${formatFecha(p.end_date)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-1 flex items-center gap-1.5 text-zinc-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm text-zinc-900">{value}</p>
    </div>
  )
}
