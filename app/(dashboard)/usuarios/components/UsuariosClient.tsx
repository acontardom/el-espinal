'use client'

import { useState } from 'react'
import { Users, Plus, Pencil } from 'lucide-react'
import type { UserWithProfile, UserRole } from '@/lib/users'
import { UserModal } from './UserModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  superadmin: { label: 'Superadmin', className: 'bg-red-100 text-red-700' },
  admin:      { label: 'Admin',      className: 'bg-blue-100 text-blue-700' },
  operador:   { label: 'Operador',   className: 'bg-zinc-100 text-zinc-600' },
}

const roleFilterOptions: Array<{ value: UserRole | 'todos'; label: string }> = [
  { value: 'todos',      label: 'Todos' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin',      label: 'Admin' },
  { value: 'operador',   label: 'Operador' },
]

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  users: UserWithProfile[]
  currentUserId: string
}

export function UsuariosClient({ users, currentUserId }: Props) {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'todos'>('todos')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserWithProfile | null>(null)

  const filtered = roleFilter === 'todos'
    ? users
    : users.filter((u) => u.role === roleFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Users size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Usuarios</h1>
            <p className="text-xs text-zinc-500">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus size={15} />
          Nuevo usuario
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {roleFilterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              roleFilter === opt.value
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
              <th className="px-4 py-3 font-medium text-zinc-500">Nombre</th>
              <th className="px-4 py-3 font-medium text-zinc-500">Email</th>
              <th className="px-4 py-3 font-medium text-zinc-500">Rol</th>
              <th className="px-4 py-3 font-medium text-zinc-500">Último acceso</th>
              <th className="px-4 py-3 font-medium text-zinc-500">Estado</th>
              <th className="px-4 py-3 font-medium text-zinc-500 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-zinc-400">
                  No hay usuarios con este filtro.
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const badge = roleBadge[user.role]
              const isSelf = user.id === currentUserId
              return (
                <tr key={user.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {user.full_name ?? <span className="text-zinc-400 font-normal">Sin nombre</span>}
                    {isSelf && <span className="ml-2 text-xs text-zinc-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        Suspendido
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => setEditUser(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UserModal
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {editUser && (
        <UserModal
          mode="edit"
          open={!!editUser}
          onOpenChange={(o) => { if (!o) setEditUser(null) }}
          user={editUser}
        />
      )}
    </div>
  )
}
