'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Fuel,
  Wrench,
  Gauge,
  FolderKanban,
  Users,
  CalendarDays,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  indent: boolean
  adminOnly: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, indent: false, adminOnly: false },
  { href: '/maquinaria', label: 'Maquinaria', icon: Truck, indent: false, adminOnly: true },
  { href: '/maquinaria/horometros', label: 'Horómetros', icon: Gauge, indent: true, adminOnly: false },
  { href: '/combustible', label: 'Combustible', icon: Fuel, indent: false, adminOnly: true },
  { href: '/mantenciones', label: 'Mantenciones', icon: Wrench, indent: false, adminOnly: true },
  { href: '/proyectos', label: 'Proyectos', icon: FolderKanban, indent: false, adminOnly: true },
  { href: '/clientes', label: 'Clientes', icon: Users, indent: false, adminOnly: true },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays, indent: false, adminOnly: true },
]

type Props = {
  role: 'admin' | 'operador'
}

export function Sidebar({ role }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = role === 'admin'
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Botón toggle mobile */}
      <button
        type="button"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-30 rounded-md bg-white p-2 shadow-md lg:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 px-6">
          <span className="text-base font-semibold text-zinc-900">El Espinal</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {visibleItems.map(({ href, label, icon: Icon, indent }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                      indent ? 'pl-8 pr-3' : 'px-3',
                      active
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                    )}
                  >
                    <Icon size={indent ? 14 : 16} strokeWidth={1.75} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
