'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type Props = {
  displayName: string
  role: string
}

export function OperadorHeader({ displayName, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const showBack = pathname !== '/dashboard'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
      {/* Izquierda: volver */}
      <div className="w-20">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft size={15} />
            Volver
          </button>
        )}
      </div>

      {/* Centro: empresa */}
      <span className="text-sm font-semibold text-zinc-900">El Espinal</span>

      {/* Derecha: usuario + salir */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{displayName}</p>
          <p className="text-xs capitalize text-zinc-400">{role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <LogOut size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  )
}
