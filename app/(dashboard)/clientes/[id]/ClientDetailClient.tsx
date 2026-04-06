'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ClientWithProjects } from '@/lib/clientes'
import { ClientModal } from '../components/ClientModal'

type Props = {
  client: ClientWithProjects
}

export function ClientDetailClient({ client }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setModalOpen(true)}>
        <Pencil size={14} />
        Editar
      </Button>
      <ClientModal open={modalOpen} onOpenChange={setModalOpen} client={client} />
    </>
  )
}
