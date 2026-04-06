'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Building2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ClientWithStats } from '@/lib/clientes'
import { ClientModal } from './ClientModal'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  clients: ClientWithStats[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientesClient({ clients }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.rut ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : clients

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} />
          Nuevo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-zinc-300" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay clientes registrados.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {filtered.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clientes/${client.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                      <Building2 size={18} className="text-zinc-500" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{client.name}</p>
                      <p className="text-xs text-zinc-400">
                        {client.rut ? `RUT: ${client.rut}` : 'Sin RUT'}
                        {client.contact_name ? ` · ${client.contact_name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900">{client.project_count}</p>
                      <p className="text-xs text-zinc-400">proyecto{client.project_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ClientModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
