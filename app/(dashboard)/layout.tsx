import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout, getUserProfile } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const displayName = profile.full_name ?? profile.email

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar role={profile.role} />

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-zinc-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-900">{displayName}</p>
              <p className="text-xs capitalize text-zinc-400">{profile.role}</p>
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

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
